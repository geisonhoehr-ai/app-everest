import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { logger } from '@/lib/logger'
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
  class_type: z.enum(['standard', 'trial']).default('standard'),
  teacher_id: z.string().min(1, 'O professor é obrigatório'),
})

type ClassFormValues = z.infer<typeof classSchema>

import { getTeachers, Teacher } from '@/services/teacherService'

export default function AdminClassFormPage() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const isEditing = !!classId

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      class_type: 'standard',
      teacher_id: '',
    },
  })

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadTeachers()
      if (isEditing) {
        await loadClass()
      }
      setLoading(false)
    }
    init()
  }, [classId])

  const loadTeachers = async () => {
    try {
      const data = await getTeachers()
      setTeachers(data)

      // If not editing, try to find current user in teachers list to set as default
      if (!isEditing) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const currentTeacher = data.find(t => t.user_id === user.id)
          if (currentTeacher) {
            form.setValue('teacher_id', currentTeacher.id)
          }
        }
      }
    } catch (error) {
      logger.error('Erro ao carregar professores:', error)
    }
  }

  const loadClass = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single()

      if (error) throw error

      const classData = data as any
      if (classData) {
        form.reset({
          name: classData.name,
          description: classData.description || '',
          start_date: classData.start_date,
          end_date: classData.end_date,
          status: classData.status || 'active',
          class_type: classData.class_type || 'standard',
          teacher_id: classData.teacher_id || '',
        })
      }
    } catch (error) {
      logger.error('Erro ao carregar turma:', error)
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
        const { error } = await (supabase as any)
          .from('classes')
          .update({
            name: values.name,
            description: values.description,
            start_date: values.start_date,
            end_date: values.end_date,
            status: values.status,
            class_type: values.class_type,
            teacher_id: values.teacher_id,
          })
          .eq('id', classId)

        if (error) throw error

        toast({
          title: 'Sucesso',
          description: 'Turma atualizada com sucesso',
        })
      } else {
        const { error } = await (supabase as any)
          .from('classes')
          .insert({
            name: values.name,
            description: values.description,
            start_date: values.start_date,
            end_date: values.end_date,
            status: values.status,
            class_type: values.class_type,
            teacher_id: values.teacher_id,
          })

        if (error) throw error

        toast({
          title: 'Sucesso',
          description: 'Turma criada com sucesso',
        })
      }

      navigate('/admin/classes')
    } catch (error) {
      logger.error('Erro ao salvar turma:', error)
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
                  name="class_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Turma *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Padrão</SelectItem>
                          <SelectItem value="trial">Trial (Teste)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Turmas trial têm acesso limitado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professor Responsável *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um professor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.length === 0 ? (
                            <SelectItem value="none" disabled>Nenhum professor encontrado</SelectItem>
                          ) : (
                            teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.first_name} {teacher.last_name} ({teacher.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
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
