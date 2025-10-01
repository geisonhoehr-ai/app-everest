import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, GraduationCap, Save } from 'lucide-react'

const classSchema = z.object({
  name: z.string().min(1, 'O nome da turma é obrigatório'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'A data de início é obrigatória'),
  end_date: z.string().min(1, 'A data de término é obrigatória'),
  status: z.enum(['active', 'inactive', 'archived']),
})

type ClassFormValues = z.infer<typeof classSchema>

export default function AdminClassFormPage() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(!!classId)

  const isEditing = !!classId

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
    },
  })

  useEffect(() => {
    if (isEditing) {
      loadClass()
    }
  }, [classId])

  const loadClass = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single()

      if (error) throw error

      if (data) {
        form.reset({
          name: data.name,
          description: data.description || '',
          start_date: data.start_date,
          end_date: data.end_date,
          status: data.status || 'active',
        })
      }
    } catch (error) {
      console.error('Erro ao carregar turma:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da turma',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: ClassFormValues) => {
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('classes')
          .update({
            name: values.name,
            description: values.description,
            start_date: values.start_date,
            end_date: values.end_date,
            status: values.status,
          })
          .eq('id', classId)

        if (error) throw error

        toast({
          title: 'Sucesso',
          description: 'Turma atualizada com sucesso',
        })
      } else {
        const { error } = await supabase
          .from('classes')
          .insert({
            name: values.name,
            description: values.description,
            start_date: values.start_date,
            end_date: values.end_date,
            status: values.status,
          })

        if (error) throw error

        toast({
          title: 'Sucesso',
          description: 'Turma criada com sucesso',
        })
      }

      navigate('/admin/classes')
    } catch (error) {
      console.error('Erro ao salvar turma:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a turma',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <SectionLoader />
  }

  return (
    <MagicLayout
      title={isEditing ? 'Editar Turma' : 'Nova Turma'}
      description={isEditing ? 'Edite as informações da turma' : 'Crie uma nova turma no sistema'}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <MagicCard variant="glass" size="lg">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/classes')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isEditing ? 'Editar Turma' : 'Nova Turma'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Preencha as informações da turma
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome da Turma *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Turma 2025.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição da turma (opcional)"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Término *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="inactive">Inativa</SelectItem>
                          <SelectItem value="archived">Arquivada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Turmas ativas aparecem para os alunos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/classes')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Turma'}
                </Button>
              </div>
            </form>
          </Form>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
