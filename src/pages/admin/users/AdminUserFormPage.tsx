import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'


import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Editar Usuário</CardTitle>
            <CardDescription>
              Atualize as informações do usuário.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Aluno</SelectItem>
                      <SelectItem value="teacher">Professor</SelectItem>
                      <SelectItem value="administrator">
                        Administrador
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Usuário Ativo</FormLabel>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/management')}
          >
            Cancelar
          </Button>
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </Form>
  )
}
