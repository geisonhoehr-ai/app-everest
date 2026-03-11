import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const KIWIFY_WEBHOOK_TOKEN = Deno.env.get('KIWIFY_WEBHOOK_TOKEN') ?? ''
const KIWIFY_CLIENT_SECRET = Deno.env.get('KIWIFY_CLIENT_SECRET') ?? ''

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
    // Read raw body for signature validation
    const rawBody = await req.text()

    // Validate: Kiwify signature (HMAC SHA256) or our custom token
    const kiwifySignature = req.headers.get('x-kiwify-signature') || req.headers.get('signature')
    const url = new URL(req.url)
    const token = url.searchParams.get('token') || req.headers.get('x-kiwify-token')

    let isValid = false

    // Method 1: Kiwify HMAC signature validation
    if (kiwifySignature && KIWIFY_CLIENT_SECRET) {
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(KIWIFY_CLIENT_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
      const computed = new TextDecoder().decode(hexEncode(new Uint8Array(sig)))
      isValid = computed === kiwifySignature
    }

    // Method 2: Custom token in URL
    if (!isValid && KIWIFY_WEBHOOK_TOKEN && token === KIWIFY_WEBHOOK_TOKEN) {
      isValid = true
    }

    // If neither method validates and we have secrets configured, reject
    if (!isValid && (KIWIFY_CLIENT_SECRET || KIWIFY_WEBHOOK_TOKEN)) {
      return jsonResponse({ error: 'Invalid webhook signature or token' }, 401)
    }

    const body = JSON.parse(rawBody)

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

      const emailHtml = [
          '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>',
          '<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">',
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;"><tr><td align="center">',
          '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">',
          '<tr><td style="background:linear-gradient(135deg,#ea580c 0%,#c2410c 100%);padding:40px 40px 30px;text-align:center;">',
          '<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Bem-vindo ao Everest!</h1>',
          '</td></tr>',
          '<tr><td style="padding:36px 40px;">',
          `<p style="margin:0 0 16px;font-size:17px;color:#1f2937;line-height:1.6;">Ol&#225; <strong>${firstName}</strong>,</p>`,
          `<p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">Sua matr&#237;cula na turma <strong style="color:#ea580c;">${productMapping.product_name}</strong> foi confirmada!</p>`,
          '<p style="margin:0 0 28px;font-size:16px;color:#374151;line-height:1.6;">Para acessar a plataforma, clique no bot&#227;o abaixo e informe seu email. Voc&#234; receber&#225; um link de acesso instant&#226;neo &#8212; sem senha!</p>',
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">',
          `<a href="${appUrl}/login" style="background-color:#ea580c;color:#ffffff;padding:16px 48px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 4px rgba(234,88,12,0.3);">Acessar Plataforma</a>`,
          '</td></tr></table>',
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background-color:#fff7ed;border-radius:8px;padding:16px 20px;border-left:4px solid #ea580c;">',
          '<p style="margin:0;font-size:14px;color:#9a3412;line-height:1.5;"><strong>Como funciona?</strong><br/>Digite seu email no login e receba um link m&#225;gico. Clicou, entrou! Sem senha para lembrar.</p>',
          '</td></tr></table>',
          '</td></tr>',
          '<tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">',
          '<p style="margin:0;font-size:13px;color:#9ca3af;">Everest Preparat&#243;rios &#8212; Plataforma de Ensino</p>',
          '</td></tr></table></td></tr></table></body></html>',
        ].join('')

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Everest Preparatorios <noreply@app.everestpreparatorios.com.br>',
          to: [customerEmail],
          subject: 'Bem-vindo ao Everest! Seu acesso esta pronto',
          html: emailHtml,
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
