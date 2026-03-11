import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const KIWIFY_WEBHOOK_TOKEN = Deno.env.get('KIWIFY_WEBHOOK_TOKEN') ?? ''

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
    // Validate webhook token
    const url = new URL(req.url)
    const token = url.searchParams.get('token') || req.headers.get('x-kiwify-token')

    if (KIWIFY_WEBHOOK_TOKEN && token !== KIWIFY_WEBHOOK_TOKEN) {
      return jsonResponse({ error: 'Invalid webhook token' }, 401)
    }

    const body = await req.json()

    // Only process paid/approved orders
    if (body.order_status !== 'paid' && body.order_status !== 'approved') {
      return jsonResponse({ message: 'Ignored: not a paid order', status: body.order_status })
    }

    // Extract customer data from Kiwify payload
    const customerEmail = body.Customer?.email?.toLowerCase()?.trim()
    const customerName = body.Customer?.full_name || ''
    const productId = body.Product?.product_id || body.product_id
    const couponCode = body.Subscription?.charges?.coupon?.code || body.coupon_code || null

    if (!customerEmail || !productId) {
      return jsonResponse({ error: 'Missing customer email or product ID' }, 400)
    }

    // Parse name
    const nameParts = customerName.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Look up product → class mapping
    const { data: productMapping, error: productError } = await supabaseAdmin
      .from('kiwify_products')
      .select('class_id, product_name')
      .eq('kiwify_product_id', productId)
      .eq('is_active', true)
      .single()

    if (productError || !productMapping) {
      return jsonResponse({ error: `No class mapping found for product: ${productId}` }, 404)
    }

    // 2. Check if user already exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', customerEmail)
      .maybeSingle()

    let userId: string

    if (existingUser) {
      // User exists
      userId = existingUser.id
    } else {
      // 3. Create new auth user (no password - magic link only)
      const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      })

      if (createAuthError) {
        // User might exist in auth but not in public.users
        if (createAuthError.message?.includes('already been registered')) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
          const found = users?.find((u: { email?: string }) => u.email === customerEmail)
          if (!found) {
            return jsonResponse({ error: 'User exists in auth but could not be found' }, 500)
          }
          userId = found.id
        } else {
          return jsonResponse({ error: 'Failed to create auth user', detail: createAuthError.message }, 500)
        }
      } else {
        userId = newAuthUser.user.id
      }

      // 4. Create public.users record
      await supabaseAdmin.from('users').upsert({
        id: userId,
        email: customerEmail,
        first_name: firstName,
        last_name: lastName,
        role: 'student',
        is_active: true,
      }, { onConflict: 'id' })

      // Create student record
      await supabaseAdmin.from('students').upsert({
        user_id: userId,
        student_id_number: `STU-${userId.substring(0, 8)}`,
        enrollment_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'user_id' })
    }

    // 5. Enroll in class (skip if already enrolled)
    const { data: existingEnrollment } = await supabaseAdmin
      .from('student_classes')
      .select('id')
      .eq('user_id', userId)
      .eq('class_id', productMapping.class_id)
      .maybeSingle()

    if (!existingEnrollment) {
      await supabaseAdmin.from('student_classes').insert({
        user_id: userId,
        class_id: productMapping.class_id,
        enrollment_date: new Date().toISOString().split('T')[0],
        source: 'kiwify',
        coupon_code: couponCode,
      })
    }

    // 6. Send welcome email via Resend (only for new users)
    if (RESEND_API_KEY && !existingUser) {
      const appUrl = Deno.env.get('APP_URL') || 'https://app.everestpreparatorios.com.br'

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Everest Preparatórios <noreply@everestpreparatorios.com.br>',
          to: [customerEmail],
          subject: `Bem-vindo ao Everest! Seu acesso à ${productMapping.product_name} está pronto`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #16a34a;">Bem-vindo ao Everest!</h1>
              <p>Olá ${firstName},</p>
              <p>Sua matrícula na turma <strong>${productMapping.product_name}</strong> foi confirmada!</p>
              <p>Para acessar a plataforma, clique no botão abaixo e informe seu email:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/login" style="background-color: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                  Acessar Plataforma
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Você receberá um link de acesso no seu email toda vez que fizer login. Sem senha para lembrar!
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">Everest Preparatórios - Plataforma de Ensino</p>
            </div>
          `,
        }),
      })
    }

    return jsonResponse({
      success: true,
      user_id: userId,
      class_id: productMapping.class_id,
      is_new_user: !existingUser,
      coupon: couponCode,
    })

  } catch (error) {
    return jsonResponse({ error: 'Internal server error', detail: (error as Error).message }, 500)
  }
})
