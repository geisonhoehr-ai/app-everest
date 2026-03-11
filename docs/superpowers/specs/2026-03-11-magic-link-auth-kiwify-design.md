# Magic Link Auth + Kiwify Webhook Integration

**Date:** 2026-03-11
**Status:** Approved

## Overview

Replace password-based login with magic link as primary auth method. Users enter the system via Kiwify purchase (webhook) or manual admin registration. Both receive welcome email with access link. Optional password can be set in settings.

## 1. Login Page (Reformulated)

- Single field: email
- Button: "Enviar link de acesso"
- Uses `supabase.auth.signInWithOtp({ email })` for native magic link
- Fallback: if user has a password set, show password field after email is entered (small "Entrar com senha" link)
- Remove: password fields, "Esqueci senha" link, "Registre-se" link
- Keep: Everest branding

## 2. Optional Password (Settings)

- In `/configuracoes`, "Segurança" section
- Button "Definir senha" allows creating a password for alternative login
- If password exists, user can login via magic link OR email/password
- Uses `supabase.auth.updateUser({ password })`

## 3. Kiwify Webhook (Supabase Edge Function)

**Function:** `kiwify-webhook`

**Flow:**
1. Receives POST from Kiwify on purchase completion
2. Validates webhook signature/token
3. Extracts: email, full name, product ID, coupon (if any)
4. Looks up product → class mapping in `kiwify_products` table
5. If user doesn't exist: creates auth user + `public.users` + `students` + `student_classes`
6. If user exists: enrolls in the new class only
7. Sends welcome email via Resend with magic link

**Coupon handling:** Kiwify sends coupon data in webhook payload. Store in `student_classes.coupon_code` for tracking ex-student re-enrollments.

## 4. Resend as SMTP Provider

- Configure Resend as SMTP in Supabase Dashboard (Auth → SMTP Settings)
- All auth emails (magic link, password reset) go through Resend
- Custom email template with Everest branding
- Separate welcome email sent by Edge Function after user creation

## 5. New Database Table: `kiwify_products`

```sql
CREATE TABLE kiwify_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kiwify_product_id TEXT NOT NULL UNIQUE,
  class_id UUID NOT NULL REFERENCES classes(id),
  product_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add coupon tracking to student_classes
ALTER TABLE student_classes ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE student_classes ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
-- source: 'manual', 'memberkit', 'kiwify'
```

## 6. Pages Removed/Changed

| Page | Action |
|------|--------|
| `/register` | Remove. Route redirects to `/login` |
| `/forgot-password` | Remove. Not needed with magic link |
| `/reset-password` | Keep. For users who set password in settings |
| `/login` | Rewrite. Email-only + magic link + optional password fallback |

## 7. Auth Provider Changes

- Add `signInWithMagicLink(email)` method → `supabase.auth.signInWithOtp({ email })`
- Keep `signIn(email, password)` for password fallback
- Remove `signUp()` from public interface
- Handle `TOKEN_REFRESHED` and magic link session detection in `onAuthStateChange`

## 8. Admin Manual User Creation

- Existing admin management page gets "Criar Aluno" button
- Creates Supabase auth user via Admin API (service role)
- Creates `public.users` + `students` + `student_classes`
- Sends welcome email with magic link via Resend

## 9. Complete Flows

```
KIWIFY PURCHASE:
Student buys → Kiwify webhook → Edge Function →
  create user (if new) → enroll in class →
  send welcome email with magic link

LOGIN:
Student opens site → enters email → receives magic link →
  clicks → logged in → dashboard

ADMIN MANUAL:
Admin creates student → creates user → enrolls in class →
  student receives magic link email

EXISTING USERS (MemberKit):
Open login → enter email → receive magic link →
  click → logged in (no password needed anymore)
```

## 10. Security Considerations

- Kiwify webhook validated by signature/secret token
- Service role key only used server-side (Edge Functions)
- Magic links expire after 1 hour (Supabase default)
- Rate limiting on magic link requests (Supabase built-in)
- No self-registration possible (no `/register` page)
