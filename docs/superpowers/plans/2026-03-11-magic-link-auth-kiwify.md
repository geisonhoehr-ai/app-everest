# Magic Link Auth + Kiwify Webhook Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace password login with magic link, add Kiwify webhook for automatic enrollment, configure Resend SMTP.

**Architecture:** Login page becomes email-only with magic link via `signInWithOtp`. Kiwify webhook is a Supabase Edge Function that creates users and enrolls them. Resend handles all transactional email. Optional password in settings.

**Tech Stack:** Supabase Auth (magic link/OTP), Supabase Edge Functions (Deno), Resend SMTP, React/TypeScript frontend.

---

## File Map

### Create
- `supabase/migrations/20260311000001_create_kiwify_products.sql` — new table for Kiwify product→class mapping
- `supabase/migrations/20260311000002_add_student_classes_source.sql` — add source/coupon columns
- `supabase/functions/kiwify-webhook/index.ts` — Edge Function for Kiwify purchase webhook

### Modify
- `src/contexts/auth-provider.tsx` — add `signInWithMagicLink` method
- `src/services/authService.ts` — add magic link function
- `src/pages/Login.tsx` — rewrite for magic link primary + password fallback
- `src/App.tsx` — remove /register, /forgot-password routes; redirect them to /login
- `src/pages/Settings.tsx` — add Security section (set optional password)
- `src/components/admin/management/UserManagement.tsx` — add "Criar Aluno" dialog with magic link invite

### Delete
- `src/pages/Register.tsx` — no more self-registration
- `src/pages/ForgotPassword.tsx` — no more password reset (magic link replaces it)

---

## Chunk 1: Database Migrations

### Task 1: Create kiwify_products table

**Files:**
- Create: `supabase/migrations/20260311000001_create_kiwify_products.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Maps Kiwify product IDs to Everest classes
CREATE TABLE IF NOT EXISTS kiwify_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kiwify_product_id TEXT NOT NULL UNIQUE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE kiwify_products ENABLE ROW LEVEL SECURITY;

-- Only admins can manage product mappings
CREATE POLICY "Admins can manage kiwify_products"
  ON kiwify_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- Service role (edge functions) can read
CREATE POLICY "Service role can read kiwify_products"
  ON kiwify_products FOR SELECT
  USING (true);
```

- [ ] **Step 2: Run migration against Supabase**

Run in Supabase SQL Editor or via CLI:
```bash
npx supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260311000001_create_kiwify_products.sql
git commit -m "feat: add kiwify_products table for product→class mapping"
```

### Task 2: Add source and coupon columns to student_classes

**Files:**
- Create: `supabase/migrations/20260311000002_add_student_classes_source.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Track how students were enrolled and coupon usage
ALTER TABLE student_classes
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Add constraint for valid sources
ALTER TABLE student_classes
  ADD CONSTRAINT student_classes_source_check
  CHECK (source IN ('manual', 'memberkit', 'kiwify'));

COMMENT ON COLUMN student_classes.source IS 'How student was enrolled: manual, memberkit, kiwify';
COMMENT ON COLUMN student_classes.coupon_code IS 'Kiwify coupon code used at purchase (ex-student discount)';
```

- [ ] **Step 2: Run migration**

Run in Supabase SQL Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260311000002_add_student_classes_source.sql
git commit -m "feat: add source and coupon_code columns to student_classes"
```

---

## Chunk 2: Auth Provider + Service Layer

### Task 3: Add magic link to authService

**Files:**
- Modify: `src/services/authService.ts`

- [ ] **Step 1: Add signInWithMagicLink function**

Replace entire file content with:

```typescript
import { supabase } from '@/lib/supabase/client'

export const signInWithMagicLink = async (email: string) => {
  const redirectUrl = `${window.location.origin}/dashboard`
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })
  return { error }
}

export const updateUserPassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password })
  return { error }
}

export const sendPasswordResetEmail = async (email: string) => {
  const redirectUrl = `${window.location.origin}/reset-password`
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })
  return { error }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/services/authService.ts
git commit -m "feat: add signInWithMagicLink to auth service"
```

### Task 4: Update auth provider with magic link method

**Files:**
- Modify: `src/contexts/auth-provider.tsx`

- [ ] **Step 1: Add signInWithMagicLink to AuthContextType interface**

At `src/contexts/auth-provider.tsx` line 36-46, add new method to interface:

```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  loading: boolean
  profileFetchAttempted: boolean
  refreshProfile: () => Promise<void>
  getRedirectPath: () => string
}
```

- [ ] **Step 2: Add signInWithMagicLink implementation**

After the `signIn` callback (around line 371), add:

```typescript
const signInWithMagicLink = useCallback(async (email: string) => {
  const redirectUrl = `${window.location.origin}/dashboard`
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) {
    logger.error('Magic link error:', error)
  }

  return { error }
}, [])
```

- [ ] **Step 3: Add signInWithMagicLink to context value**

In the `value` object (around line 425), add `signInWithMagicLink`:

```typescript
const value = {
  user: session?.user ?? null,
  session,
  profile,
  signIn,
  signInWithMagicLink,
  signUp,
  signOut,
  loading,
  profileFetchAttempted,
  refreshProfile,
  getRedirectPath,
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/contexts/auth-provider.tsx
git commit -m "feat: add signInWithMagicLink to auth provider"
```

---

## Chunk 3: Login Page Rewrite

### Task 5: Rewrite Login.tsx for magic link

**Files:**
- Modify: `src/pages/Login.tsx`

- [ ] **Step 1: Rewrite Login page**

The new login has two states:
1. **Default:** Email field + "Enviar link de acesso" button
2. **Password fallback:** Small link "Entrar com senha" shows password field
3. **Success state:** "Verifique seu email" message after magic link sent

Full replacement for `src/pages/Login.tsx`:

```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Mountain,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  MailCheck,
  KeyRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const magicLinkSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
})

const passwordSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
})

type MagicLinkValues = z.infer<typeof magicLinkSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export default function LoginPage() {
  const { signIn, signInWithMagicLink } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [usePasswordMode, setUsePasswordMode] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const magicLinkForm = useForm<MagicLinkValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  })

  const onMagicLinkSubmit = async (data: MagicLinkValues) => {
    setIsLoading(true)
    const { error } = await signInWithMagicLink(data.email)
    if (error) {
      toast({
        title: 'Erro ao enviar link',
        description: 'Não foi possível enviar o link de acesso. Verifique seu email e tente novamente.',
        variant: 'destructive',
      })
    } else {
      setSentEmail(data.email)
      setMagicLinkSent(true)
    }
    setIsLoading(false)
  }

  const onPasswordSubmit = async (data: PasswordValues) => {
    setIsLoading(true)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      toast({
        title: 'Erro de Autenticação',
        description: 'Email ou senha inválidos. Por favor, tente novamente.',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  // Success state after magic link sent
  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-3xl bg-green-500/10">
                <MailCheck className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Verifique seu Email</h2>
              <p className="text-muted-foreground">
                Enviamos um link de acesso para{' '}
                <span className="font-medium text-foreground">{sentEmail}</span>
              </p>
            </div>
          </div>

          <Card className="border-border shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Clique no link enviado para seu email para acessar a plataforma.</p>
                <p>O link expira em 1 hora.</p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMagicLinkSent(false)
                  setSentEmail('')
                }}
              >
                Tentar com outro email
              </Button>

              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => onMagicLinkSubmit({ email: sentEmail })}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Reenviar link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Brand */}
        <div className="text-center space-y-6">
          <div className="flex justify-center items-center gap-3">
            <div className="p-4 rounded-3xl bg-primary/10">
              <Mountain className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Everest</h1>
              <p className="text-sm text-muted-foreground">Plataforma de Ensino</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Acesse sua Conta</h2>
            <p className="text-muted-foreground">
              {usePasswordMode
                ? 'Entre com seu email e senha.'
                : 'Informe seu email para receber o link de acesso.'}
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {usePasswordMode ? (
                /* Password login mode */
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="seu@email.com"
                                autoComplete="email"
                                className="pl-10 h-12 rounded-xl"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="pl-10 pr-10 h-12 rounded-xl"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl font-semibold hover:bg-green-600"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        <>
                          Entrar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                /* Magic link mode (default) */
                <Form {...magicLinkForm}>
                  <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} className="space-y-6">
                    <FormField
                      control={magicLinkForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="seu@email.com"
                                autoComplete="email"
                                className="pl-10 h-12 rounded-xl"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl font-semibold hover:bg-green-600"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar Link de Acesso
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {/* Toggle between modes */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setUsePasswordMode(!usePasswordMode)}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                {usePasswordMode ? 'Entrar com link mágico' : 'Entrar com senha'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Por que escolher o Everest?</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Shield className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Seguro</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Zap className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Rápido</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Sparkles className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Inteligente</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Login.tsx
git commit -m "feat: rewrite login page with magic link as primary auth"
```

---

## Chunk 4: Route Cleanup

### Task 6: Remove Register and ForgotPassword pages, update routes

**Files:**
- Modify: `src/App.tsx` (lines 19-20 imports, lines 245-249 routes)
- Delete: `src/pages/Register.tsx`
- Delete: `src/pages/ForgotPassword.tsx`

- [ ] **Step 1: Update App.tsx imports**

Remove these two lazy imports (lines 19-20):
```typescript
// DELETE these lines:
const RegisterPage = lazy(() => import('@/pages/Register'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'))
```

- [ ] **Step 2: Update routes in App.tsx**

Replace the public routes block (lines 242-251):

```tsx
<Route element={<PublicRoute />}>
  <Route path="/" element={<Index />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<Navigate to="/login" replace />} />
  <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
</Route>
```

- [ ] **Step 3: Delete Register.tsx and ForgotPassword.tsx**

```bash
rm src/pages/Register.tsx src/pages/ForgotPassword.tsx
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: remove self-registration and forgot-password, redirect to login"
```

---

## Chunk 5: Settings Security Section

### Task 7: Add security section to Settings page

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Add Lock import**

Add `Lock` to the lucide-react imports in Settings.tsx (check existing imports first and add if missing).

- [ ] **Step 2: Add security section before Data Management**

Insert this section before the `{/* Data Management */}` card (before line 819):

```tsx
{/* Security */}
<Card className="border-border shadow-sm">
  <CardHeader>
    <CardTitle className="flex items-center gap-4">
      <Lock className="h-6 w-6 text-primary" />
      Segurança
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Defina uma senha para usar como alternativa ao link mágico de acesso.
      </p>
      <SecurityPasswordForm />
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 3: Create SecurityPasswordForm component inline**

Add this component inside Settings.tsx (before the main export, or as a separate small component at the top of the file):

```tsx
function SecurityPasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const { toast } = useToast()

  const handleSetPassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'A confirmação de senha não corresponde.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingPassword(true)
    const { error } = await updateUserPassword(newPassword)
    if (error) {
      toast({
        title: 'Erro ao definir senha',
        description: 'Não foi possível salvar a senha. Tente novamente.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Senha definida!',
        description: 'Agora você pode usar email + senha para entrar.',
      })
      setNewPassword('')
      setConfirmPassword('')
    }
    setIsSavingPassword(false)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nova Senha</label>
        <Input
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Confirmar Senha</label>
        <Input
          type="password"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <Button
        onClick={handleSetPassword}
        disabled={isSavingPassword || !newPassword || !confirmPassword}
      >
        {isSavingPassword ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Lock className="mr-2 h-4 w-4" />
        )}
        Definir Senha
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Add import for updateUserPassword**

```typescript
import { updateUserPassword } from '@/services/authService'
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: add security section to settings for optional password"
```

---

## Chunk 6: Kiwify Webhook Edge Function

### Task 8: Create Kiwify webhook Edge Function

**Files:**
- Create: `supabase/functions/kiwify-webhook/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const KIWIFY_WEBHOOK_TOKEN = Deno.env.get('KIWIFY_WEBHOOK_TOKEN') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      return new Response(
        JSON.stringify({ error: 'Invalid webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()

    // Kiwify sends different event types
    // We only care about approved purchases
    if (body.order_status !== 'paid' && body.order_status !== 'approved') {
      return new Response(
        JSON.stringify({ message: 'Ignored: not a paid order', status: body.order_status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract customer data from Kiwify payload
    const customerEmail = body.Customer?.email?.toLowerCase()?.trim()
    const customerName = body.Customer?.full_name || ''
    const productId = body.Product?.product_id || body.product_id
    const couponCode = body.Subscription?.charges?.coupon?.code || body.coupon_code || null

    if (!customerEmail || !productId) {
      return new Response(
        JSON.stringify({ error: 'Missing customer email or product ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse name
    const nameParts = customerName.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Create admin Supabase client (service role)
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
      return new Response(
        JSON.stringify({ error: `No class mapping found for product: ${productId}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    })

    // Search by email in auth users
    let authUser = null
    const { data: usersByEmail } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', customerEmail)
      .maybeSingle()

    if (usersByEmail) {
      // User exists in public.users
      authUser = { id: usersByEmail.id }
    } else {
      // 3. Create new auth user (no password - magic link only)
      const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      })

      if (createAuthError) {
        // User might exist in auth but not in public.users
        if (createAuthError.message?.includes('already been registered')) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
          const found = users?.find(u => u.email === customerEmail)
          if (found) {
            authUser = { id: found.id }
          } else {
            return new Response(
              JSON.stringify({ error: 'User exists but could not be found', detail: createAuthError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        } else {
          return new Response(
            JSON.stringify({ error: 'Failed to create auth user', detail: createAuthError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        authUser = newAuthUser.user
      }

      // 4. Create public.users record if new
      if (authUser && !usersByEmail) {
        await supabaseAdmin.from('users').upsert({
          id: authUser.id,
          email: customerEmail,
          first_name: firstName,
          last_name: lastName,
          role: 'student',
          is_active: true,
        }, { onConflict: 'id' })

        // Create student record
        await supabaseAdmin.from('students').upsert({
          user_id: authUser.id,
          student_id_number: `STU-${authUser.id.substring(0, 8)}`,
          enrollment_date: new Date().toISOString().split('T')[0],
        }, { onConflict: 'user_id' })
      }
    }

    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'Could not resolve user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Enroll in class (skip if already enrolled)
    const { data: existingEnrollment } = await supabaseAdmin
      .from('student_classes')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('class_id', productMapping.class_id)
      .maybeSingle()

    if (!existingEnrollment) {
      await supabaseAdmin.from('student_classes').insert({
        user_id: authUser.id,
        class_id: productMapping.class_id,
        enrollment_date: new Date().toISOString().split('T')[0],
        source: 'kiwify',
        coupon_code: couponCode,
      })
    }

    // 6. Send welcome email via Resend
    if (RESEND_API_KEY && !usersByEmail) {
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
              <h1 style="color: #16a34a;">🏔️ Bem-vindo ao Everest!</h1>
              <p>Olá ${firstName},</p>
              <p>Sua matrícula na turma <strong>${productMapping.product_name}</strong> foi confirmada!</p>
              <p>Para acessar a plataforma, basta clicar no botão abaixo e informar seu email:</p>
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

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authUser.id,
        class_id: productMapping.class_id,
        is_new_user: !usersByEmail,
        coupon: couponCode,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Set Edge Function secrets**

Run these commands to set the secrets in Supabase:

```bash
npx supabase secrets set RESEND_API_KEY=re_fUV2TVVR_BEUHc8EhN6EG69VaKpxWBGu3
npx supabase secrets set KIWIFY_WEBHOOK_TOKEN=<generate-a-random-token>
npx supabase secrets set APP_URL=https://app.everestpreparatorios.com.br
```

Generate the webhook token with:
```bash
openssl rand -hex 32
```

- [ ] **Step 3: Deploy Edge Function**

```bash
npx supabase functions deploy kiwify-webhook --no-verify-jwt
```

Note: `--no-verify-jwt` is required because Kiwify sends unauthenticated webhook requests. The function validates via its own token.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/kiwify-webhook/index.ts
git commit -m "feat: add Kiwify webhook Edge Function for automatic enrollment"
```

---

## Chunk 7: Admin User Creation

### Task 9: Add "Criar Aluno" dialog to UserManagement

**Files:**
- Modify: `src/components/admin/management/UserManagement.tsx`

- [ ] **Step 1: Add CreateUserDialog component**

Add a dialog component that admins use to manually create users. The dialog collects email, first name, last name, and class. It calls the Supabase Admin API (via an Edge Function or service role) to create the user and send a magic link.

For simplicity, create the user via the existing MemberKit import pattern (admin API call from frontend using service role key stored in the admin's session). The dialog should:

1. Collect: email, first_name, last_name, class_id
2. Create auth user via `supabase.auth.admin.createUser()` (requires service role - use existing pattern from memberkitImportService.ts)
3. Create public.users + students + student_classes records
4. Show success toast with message "Aluno criado! Um email de boas-vindas será enviado."

Since this requires the service role key (which is only available server-side in production), create a new Edge Function for it.

- [ ] **Step 2: Create admin-create-user Edge Function**

Create `supabase/functions/admin-create-user/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller is admin
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user: caller }, error: authError } = await authClient.auth.getUser()
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check caller is admin
    const { data: callerProfile } = await authClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || !['administrator', 'teacher'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, first_name, last_name, class_id } = await req.json()

    if (!email || !first_name || !last_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
              <h1 style="color: #16a34a;">🏔️ Bem-vindo ao Everest!</h1>
              <p>Olá ${first_name},</p>
              <p>Sua conta foi criada na plataforma Everest Preparatórios.</p>
              <p>Para acessar, basta clicar no botão abaixo e informar seu email <strong>${email}</strong>:</p>
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

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 3: Wire "Adicionar Usuário" button in UserManagement.tsx**

Add a Dialog that opens when "Adicionar Usuário" is clicked (line 236-239 of UserManagement.tsx). The dialog has fields for email, first_name, last_name, and a class selector dropdown. On submit, it calls:

```typescript
const response = await supabase.functions.invoke('admin-create-user', {
  body: { email, first_name, last_name, class_id }
})
```

Then shows a success/error toast and refreshes the user list.

- [ ] **Step 4: Deploy Edge Function**

```bash
npx supabase functions deploy admin-create-user
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/admin-create-user/index.ts src/components/admin/management/UserManagement.tsx
git commit -m "feat: add admin user creation with magic link welcome email"
```

---

## Chunk 8: Resend SMTP Configuration + Final Verification

### Task 10: Configure Resend as Supabase SMTP (manual)

This is a manual step done in the Supabase and Resend dashboards.

- [ ] **Step 1: Configure Resend domain**

In Resend dashboard (resend.com):
1. Add domain: `everestpreparatorios.com.br`
2. Add DNS records (MX, TXT for SPF/DKIM) as instructed by Resend
3. Verify domain

- [ ] **Step 2: Configure Supabase SMTP**

In Supabase Dashboard → Authentication → SMTP Settings:
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: `re_fUV2TVVR_BEUHc8EhN6EG69VaKpxWBGu3`
- Sender name: `Everest Preparatórios`
- Sender email: `noreply@everestpreparatorios.com.br`

- [ ] **Step 3: Customize email templates in Supabase**

In Supabase Dashboard → Authentication → Email Templates:

**Magic Link template:**
```html
<h2>🏔️ Acesse o Everest</h2>
<p>Olá,</p>
<p>Clique no botão abaixo para acessar a plataforma:</p>
<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="background-color: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
    Entrar na Plataforma
  </a>
</p>
<p style="color: #666; font-size: 14px;">Este link expira em 1 hora.</p>
<p style="color: #999; font-size: 12px;">Se você não solicitou este acesso, ignore este email.</p>
```

- [ ] **Step 4: Configure Kiwify webhook URL**

In Kiwify dashboard → Configurações → Webhooks:
- URL: `https://hnhzindsfuqnaxosujay.supabase.co/functions/v1/kiwify-webhook?token=<YOUR_WEBHOOK_TOKEN>`
- Events: `order_approved` / `purchase_approved`

### Task 11: Final verification and push

- [ ] **Step 1: Run full TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Run dev server and test login flow**

```bash
npm run dev
```

Manual test:
1. Go to /login → should see magic link form
2. Enter email → should see "Verifique seu email" screen
3. Click "Entrar com senha" → should toggle to password form
4. Go to /register → should redirect to /login
5. Go to /forgot-password → should redirect to /login
6. Go to /configuracoes → should see Security section

- [ ] **Step 3: Final commit and push**

```bash
git push
```
