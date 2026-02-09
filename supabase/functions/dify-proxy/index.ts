import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const DIFY_API_KEY = Deno.env.get('DIFY_API_KEY')
    if (!DIFY_API_KEY) {
      console.error('DIFY_API_KEY not set in environment variables')
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta (DIFY_API_KEY)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the request body
    const body = await req.json().catch(() => ({}))
    const { action, payload } = body

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let endpoint = ''
    let method = 'POST'

    switch (action) {
      case 'workflow':
        endpoint = 'https://api.dify.ai/v1/workflows/run'
        break
      case 'chat':
        endpoint = 'https://api.dify.ai/v1/chat-messages'
        break
      case 'stats':
        endpoint = 'https://api.dify.ai/v1/statistics'
        method = 'GET'
        break
      default:
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    console.log(`Proxying ${action} request to Dify API...`)

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: method === 'GET' ? undefined : JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}));

    return new Response(
      JSON.stringify(data),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in dify-proxy:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
