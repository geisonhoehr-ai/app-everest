import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Mountain, Loader2, MailCheck } from 'lucide-react'
import { sendPasswordResetEmail } from '@/services/authService'
import { Link } from 'react-router-dom'

const forgotPasswordSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
})

type FormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    const { error } = await sendPasswordResetEmail(data.email)
    if (!error) {
      setIsSubmitted(true)
      toast({
        title: 'Email Enviado',
        description: 'Verifique sua caixa de entrada para instruções de recuperação.',
        variant: 'default',
      })
    } else {
      toast({
        title: 'Erro ao Enviar Email',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Mountain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Everest</span>
          </div>
          <CardTitle>Recuperar Senha</CardTitle>
          <CardDescription>
            {isSubmitted
              ? 'Verifique sua caixa de entrada.'
              : 'Insira seu email para receber o link de recuperação.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <MailCheck className="h-16 w-16 text-green-500 mx-auto" />
              <p>
                Se uma conta com este email existir, um link para redefinir sua
                senha foi enviado.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Voltar para o Login</Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enviar Link de Recuperação
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
