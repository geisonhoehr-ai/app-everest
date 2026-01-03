import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MagicLayout } from '@/components/ui/magic-layout'
import { ChevronLeft } from 'lucide-react'

const courseSchema = z.object({
  name: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z
    .string()
    .min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  thumbnail_url: z
    .string()
    .url('URL da miniatura inválida.')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().default(false),
})

type CourseFormValues = z.infer<typeof courseSchema>

export default function AdminCourseFormPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEditing = !!courseId

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      description: '',
      thumbnail_url: '',
      is_active: false,
    },
  })

  useEffect(() => {
    const fetchCourseData = async () => {
      if (isEditing && courseId) {
        try {
          const { data: course, error } = await supabase
            .from('video_courses')
            .select('*')
            .eq('id', courseId)
            .single()

          if (error) {
            logger.error('Error fetching course:', error)
            toast({
              title: 'Erro ao carregar curso',
              description: 'Não foi possível carregar os dados do curso.',
              variant: 'destructive',
            })
            return
          }

          if (course) {
            form.reset({
              name: course.name || '',
              description: course.description || '',
              thumbnail_url: course.thumbnail_url || '',
              is_active: course.is_active || false,
            })
          }
        } catch (error) {
          logger.error('Unexpected error fetching course:', error)
          toast({
            title: 'Erro inesperado',
            description: 'Ocorreu um erro ao carregar o curso.',
            variant: 'destructive',
          })
        }
      }
    }

    fetchCourseData()
  }, [isEditing, courseId, form, toast])

  const onSubmit = async (data: CourseFormValues) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        toast({
          title: 'Erro de autenticação',
          description: 'Você precisa estar logado para criar um curso.',
          variant: 'destructive',
        })
        return
      }

      if (isEditing && courseId) {
        // Update existing course
        const { error } = await supabase
          .from('video_courses')
          .update({
            name: data.name,
            description: data.description,
            thumbnail_url: data.thumbnail_url || null,
            is_active: data.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', courseId)

        if (error) throw error

        toast({
          title: 'Curso atualizado!',
          description: 'O curso foi atualizado com sucesso.',
        })
      } else {
        // Create new course
        const { error } = await supabase
          .from('video_courses')
          .insert({
            name: data.name,
            description: data.description,
            thumbnail_url: data.thumbnail_url || null,
            is_active: data.is_active,
            created_by_user_id: user.id,
          })

        if (error) throw error

        toast({
          title: 'Curso criado!',
          description: 'O curso foi criado com sucesso.',
        })
      }

      navigate('/admin/courses')
    } catch (error) {
      logger.error('Error saving course:', error)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o curso. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <MagicLayout
      title={isEditing ? 'Editar Curso' : 'Novo Curso'}
      description="Preencha os detalhes principais do curso"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/courses')}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para Cursos
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? 'Editar Curso' : 'Novo Curso'}</CardTitle>
                <CardDescription>
                  Preencha os detalhes principais do curso.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Curso</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thumbnail_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Miniatura (Thumbnail)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Publicar Curso</FormLabel>
                    <FormDescription>
                      Torna o curso visível para os alunos.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/courses')}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Curso</Button>
            </div>
          </form>
        </Form>
      </div>
    </MagicLayout>
  )
}
