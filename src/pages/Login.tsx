import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
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
  Star,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { signIn } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
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

  return (
    <MagicLayout 
      title="Bem-vindo de volta"
      description="Acesse sua conta e continue sua jornada de aprendizado"
      showHeader={false}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Brand */}
          <div className="text-center space-y-6">
            <div className="flex justify-center items-center gap-3">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Mountain className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Everest
                </h1>
                <p className="text-sm text-muted-foreground">Plataforma de Ensino</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Acesse sua Conta</h2>
              <p className="text-muted-foreground">
                Bem-vindo de volta! Insira seus dados para continuar.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <MagicCard variant="premium" size="lg">
            <div className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
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
                              className="pl-10 bg-card/50 backdrop-blur-sm border-border/50 h-12 rounded-xl"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              className="pl-10 pr-10 bg-card/50 backdrop-blur-sm border-border/50 h-12 rounded-xl"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <Button 
                      variant="link" 
                      asChild
                      className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
                    >
                      <Link to="/forgot-password">Esqueceu a senha?</Link>
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white h-12 rounded-xl font-semibold transition-transform duration-300 hover:scale-105 hover:shadow-lg inline-flex items-center justify-center" 
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

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{' '}
                  <Button 
                    variant="link" 
                    asChild
                    className="text-primary hover:text-primary/80 p-0 h-auto font-semibold"
                  >
                    <Link to="/register">Registre-se</Link>
                  </Button>
                </p>
              </div>
            </div>
          </MagicCard>

          {/* Features */}
          <MagicCard variant="glass" size="lg">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Por que escolher o Everest?</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <Shield className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Seguro</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                  <Zap className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Rápido</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                  <Sparkles className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Inteligente</p>
                </div>
              </div>
            </div>
          </MagicCard>
        </div>
      </div>
    </MagicLayout>
  )
}
