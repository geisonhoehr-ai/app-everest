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
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  MailCheck,
  KeyRound,
} from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-background to-orange-50/30 dark:from-orange-950/20 dark:via-background dark:to-orange-950/10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-3xl bg-primary/10">
                <MailCheck className="h-12 w-12 text-primary" />
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-background to-orange-50/30 dark:from-orange-950/20 dark:via-background dark:to-orange-950/10">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Brand */}
        <div className="text-center space-y-6">
          <div className="flex justify-center items-center gap-3">
            <img src="/logo.png" alt="Everest Preparatórios" className="h-16 w-16 rounded-2xl object-contain" />
            <div>
              <h1 className="text-4xl font-bold">Everest</h1>
              <p className="text-sm text-muted-foreground">Preparatórios</p>
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
                      className="w-full h-12 rounded-xl font-semibold"
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
                      className="w-full h-12 rounded-xl font-semibold"
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
                onClick={() => {
                  if (usePasswordMode) {
                    magicLinkForm.setValue('email', passwordForm.getValues('email'))
                  } else {
                    passwordForm.setValue('email', magicLinkForm.getValues('email'))
                  }
                  setUsePasswordMode(!usePasswordMode)
                }}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                {usePasswordMode ? 'Entrar com link mágico' : 'Entrar com senha'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Ao acessar, você concorda com nossos{' '}
          <a href="/termos" className="underline hover:text-foreground">Termos de Uso</a>
          {' '}e{' '}
          <a href="/privacidade" className="underline hover:text-foreground">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  )
}
