import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
            console.error('Error fetching course:', error)
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
          console.error('Unexpected error fetching course:', error)
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

  const onSubmit = (data: CourseFormValues) => {
    console.log(data)
    toast({
      title: `Curso ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
    })
    navigate('/admin/courses')
  }

  return (
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
  )
}
