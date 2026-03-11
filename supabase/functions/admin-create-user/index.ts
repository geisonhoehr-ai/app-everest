import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller is admin/teacher
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user: caller }, error: authError } = await authClient.auth.getUser()
    if (authError || !caller) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: callerProfile } = await authClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || !['administrator', 'teacher'].includes(callerProfile.role)) {
      return jsonResponse({ error: 'Forbidden: admin/teacher only' }, 403)
    }

    const { email, first_name, last_name, class_id } = await req.json()

    if (!email || !first_name || !last_name) {
      return jsonResponse({ error: 'Missing required fields: email, first_name, last_name' }, 400)
    }

    // Admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create auth user (no password - magic link only)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      email_confirm: true,
      user_metadata: { first_name, last_name },
    })

    if (createError) {
      return jsonResponse({ error: createError.message }, 400)
    }

    // Create public.users
    await supabaseAdmin.from('users').upsert({
      id: newUser.user.id,
      email: email.toLowerCase().trim(),
      first_name,
      last_name,
      role: 'student',
      is_active: true,
    }, { onConflict: 'id' })

    // Create student record
    await supabaseAdmin.from('students').upsert({
      user_id: newUser.user.id,
      student_id_number: `STU-${newUser.user.id.substring(0, 8)}`,
      enrollment_date: new Date().toISOString().split('T')[0],
    }, { onConflict: 'user_id' })

    // Enroll in class if provided
    if (class_id) {
      await supabaseAdmin.from('student_classes').insert({
        user_id: newUser.user.id,
        class_id,
        enrollment_date: new Date().toISOString().split('T')[0],
        source: 'manual',
      })
    }

    // Send welcome email via Resend
    if (RESEND_API_KEY) {
      const appUrl = Deno.env.get('APP_URL') || 'https://app.everestpreparatorios.com.br'

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Everest Preparatórios <noreply@everestpreparatorios.com.br>',
          to: [email],
          subject: 'Bem-vindo ao Everest! Seu acesso está pronto',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #16a34a;">Bem-vindo ao Everest!</h1>
              <p>Olá ${first_name},</p>
              <p>Sua conta foi criada na plataforma Everest Preparatórios.</p>
              <p>Para acessar, clique no botão abaixo e informe seu email <strong>${email}</strong>:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/login" style="background-color: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                  Acessar Plataforma
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Você receberá um link de acesso no seu email toda vez que fizer login.
              </p>
            </div>
          `,
        }),
      })
    }

    return jsonResponse({ success: true, user_id: newUser.user.id })
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500)
  }
})
