import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { getUserById, updateUser } from '@/services/adminUserService'
import { SectionLoader } from '@/components/SectionLoader'
import { 
  User, 
  Mail, 
  Shield, 
  Save, 
  ArrowLeft,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

const userSchema = z.object({
  first_name: z.string().min(1, 'O nome é obrigatório.'),
  last_name: z.string().min(1, 'O sobrenome é obrigatório.'),
  email: z.string().email('Email inválido.'),
  role: z.enum(['student', 'teacher', 'administrator']),
  is_active: z.boolean(),
})

type UserFormValues = z.infer<typeof userSchema>

export default function AdminUserFormPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      role: 'student',
      is_active: true,
    },
  })

  useEffect(() => {
    if (userId) {
      getUserById(userId).then((user) => {
        if (user) {
          form.reset(user)
        }
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [userId, form])

  const onSubmit = async (data: UserFormValues) => {
    if (!userId) return
    const updatedUser = await updateUser(userId, data)
    if (updatedUser) {
      toast({ title: 'Usuário atualizado com sucesso!' })
      navigate('/admin/management')
    } else {
      toast({ title: 'Erro ao atualizar usuário', variant: 'destructive' })
    }
  }

  if (isLoading) return <SectionLoader />

  return (
    <MagicLayout 
      title="Editar Usuário"
      description="Atualize as informações e permissões do usuário"
    >
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <User className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Editar Usuário
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-lg">
                    Atualize as informações do usuário
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/management')}
                className="w-full md:w-auto bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>
        </MagicCard>

        {/* User Form */}
        <MagicCard variant="glass" size="lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
              {/* Personal Information */}
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold">Informações Pessoais</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Nome</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              className="pl-10 bg-card/50 backdrop-blur-sm border-border/50 h-12 rounded-xl"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Sobrenome</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              className="pl-10 bg-card/50 backdrop-blur-sm border-border/50 h-12 rounded-xl"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                            {...field} 
                            className="pl-10 bg-card/50 backdrop-blur-sm border-border/50 h-12 rounded-xl"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Role and Permissions */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                  <h2 className="text-xl font-semibold">Função e Permissões</h2>
                </div>

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Função</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-card/50 backdrop-blur-sm border-border/50 h-12 rounded-xl">
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50">
                          <SelectItem value="student" className="hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Estudante
                            </div>
                          </SelectItem>
                          <SelectItem value="teacher" className="hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              Professor
                            </div>
                          </SelectItem>
                          <SelectItem value="administrator" className="hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Administrador
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {field.value ? (
                              <UserCheck className="h-5 w-5 text-green-500" />
                            ) : (
                              <UserX className="h-5 w-5 text-red-500" />
                            )}
                            <FormLabel className="text-base font-semibold">
                              Usuário Ativo
                            </FormLabel>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Desative para bloquear o acesso do usuário ao sistema
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-border/50">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => navigate('/admin/management')}
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Form>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}