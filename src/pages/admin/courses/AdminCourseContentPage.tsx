import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem } from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, GripVertical, Plus, Trash2 } from 'lucide-react'
import { LessonForm } from '@/components/admin/courses/LessonForm'
import { MagicLayout } from '@/components/ui/magic-layout'
import { SectionLoader } from '@/components/SectionLoader'

const lessonSchema = z.object({
  title: z.string().min(3, 'O título da aula é muito curto.'),
  description: z.string().optional(),
  video_source_type: z.enum(['panda_video', 'youtube', 'vimeo']).optional(),
  video_source_id: z.string().optional(),
  duration_seconds: z.number().optional(),
  is_active: z.boolean().default(false),
  is_preview: z.boolean().default(false),
  attachments: z.array(z.any()).optional(),
  accompanyingPdfId: z.string().optional(),
})

const moduleSchema = z.object({
  name: z.string().min(3, 'O nome do módulo é muito curto.'),
  lessons: z.array(lessonSchema),
})

const courseContentSchema = z.object({
  modules: z.array(moduleSchema),
})

type CourseContentFormValues = z.infer<typeof courseContentSchema>

interface CourseWithModules {
  id: string
  name: string
  modules: Array<{
    id?: string
    name: string
    order_index?: number
    lessons: Array<{
      id?: string
      title: string
      description?: string
      video_source_type?: string
      video_source_id?: string
      duration_seconds?: number
      is_active: boolean
      is_preview: boolean
      order_index?: number
      attachments?: any[]
    }>
  }>
}

const ModuleItem = ({
  moduleIndex,
  removeModule,
}: {
  moduleIndex: number
  removeModule: (index: number) => void
}) => {
  const { control } = useFormContext()
  const {
    fields: lessonFields,
    append: appendLesson,
    remove: removeLesson,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.lessons`,
  })

  return (
    <AccordionItem
      value={`module-${moduleIndex}`}
      className="border rounded-lg bg-muted/30"
    >
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center gap-2 w-full">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
          <FormField
            control={control}
            name={`modules.${moduleIndex}.name`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl>
                  <Input
                    {...field}
                    className="text-base font-semibold border-none bg-transparent shadow-none focus-visible:ring-0"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              removeModule(moduleIndex)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 border-t space-y-4">
        {lessonFields.map((lessonField, lessonIndex) => (
          <Card key={lessonField.id}>
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Aula {lessonIndex + 1}</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLesson(lessonIndex)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <LessonForm moduleIndex={moduleIndex} lessonIndex={lessonIndex} />
            </CardContent>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            appendLesson({
              title: '',
              is_active: false,
              is_preview: false,
              attachments: [],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar Aula
        </Button>
      </AccordionContent>
    </AccordionItem>
  )
}

export default function AdminCourseContentPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [course, setCourse] = useState<CourseWithModules | null>(null)
  const [loading, setLoading] = useState(true)

  const form = useForm<CourseContentFormValues>({
    resolver: zodResolver(courseContentSchema),
    defaultValues: {
      modules: [],
    },
  })

  // Load course with modules and lessons
  useEffect(() => {
    const fetchCourseContent = async () => {
      if (!courseId) return

      try {
        setLoading(true)

        // Get course
        const { data: courseData, error: courseError } = await supabase
          .from('video_courses')
          .select('id, name')
          .eq('id', courseId)
          .single()

        if (courseError) throw courseError

        // Get modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('video_modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index')

        if (modulesError) throw modulesError

        // Get lessons for each module
        const modulesWithLessons = await Promise.all(
          (modulesData || []).map(async (module) => {
            const { data: lessonsData } = await supabase
              .from('video_lessons')
              .select('*')
              .eq('module_id', module.id)
              .order('order_index')

            return {
              id: module.id,
              name: module.name,
              order_index: module.order_index,
              lessons: (lessonsData || []).map((lesson) => ({
                id: lesson.id,
                title: lesson.title,
                description: lesson.description || '',
                video_source_type: lesson.video_source_type || '',
                video_source_id: lesson.video_source_id || '',
                duration_seconds: lesson.duration_seconds || 0,
                is_active: lesson.is_active || false,
                is_preview: lesson.is_preview || false,
                order_index: lesson.order_index,
                attachments: [],
              })),
            }
          })
        )

        const courseWithModules: CourseWithModules = {
          id: courseData.id,
          name: courseData.name,
          modules: modulesWithLessons,
        }

        setCourse(courseWithModules)

        // Set form values
        form.reset({
          modules: modulesWithLessons,
        })
      } catch (error) {
        logger.error('Error loading course content:', error)
        toast({
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar o conteúdo do curso.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCourseContent()
  }, [courseId, form, toast])

  const {
    fields: moduleFields,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control: form.control,
    name: 'modules',
  })

  const onSubmit = async (data: CourseContentFormValues) => {
    if (!courseId) return

    try {
      // Delete all existing modules and lessons for this course
      const { error: deleteError } = await supabase
        .from('video_modules')
        .delete()
        .eq('course_id', courseId)

      if (deleteError) throw deleteError

      // Insert new modules and lessons
      for (let moduleIndex = 0; moduleIndex < data.modules.length; moduleIndex++) {
        const module = data.modules[moduleIndex]

        const { data: newModule, error: moduleError } = await supabase
          .from('video_modules')
          .insert({
            course_id: courseId,
            name: module.name,
            order_index: moduleIndex,
            is_active: true,
          })
          .select()
          .single()

        if (moduleError) throw moduleError

        // Insert lessons for this module
        for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
          const lesson = module.lessons[lessonIndex]

          const { data: newLesson, error: lessonError } = await supabase
            .from('video_lessons')
            .insert({
              module_id: newModule.id,
              title: lesson.title,
              description: lesson.description || null,
              video_source_type: lesson.video_source_type || null,
              video_source_id: lesson.video_source_id || null,
              duration_seconds: lesson.duration_seconds || null,
              is_active: lesson.is_active,
              is_preview: lesson.is_preview,
              order_index: lessonIndex,
            })
            .select()
            .single()

          if (lessonError) throw lessonError

          // Insert attachments if any
          if (lesson.attachments && lesson.attachments.length > 0) {
            for (const att of lesson.attachments) {
              const { data: newAtt, error: attError } = await supabase
                .from('lesson_attachments')
                .insert({
                  lesson_id: newLesson.id,
                  file_url: att.url,
                  file_name: att.name,
                  file_type: att.type,
                })
                .select('id')
                .single()

              if (attError) throw attError

              // If this attachment was the selected accompanying PDF, update the lesson
              if (att.id === lesson.accompanyingPdfId) {
                await supabase
                  .from('video_lessons')
                  .update({ accompanying_pdf_attachment_id: newAtt.id })
                  .eq('id', newLesson.id)
              }
            }
          }
        }
      }

      toast({
        title: 'Conteúdo salvo!',
        description: 'O conteúdo do curso foi salvo com sucesso.',
      })

      navigate('/admin/courses')
    } catch (error) {
      logger.error('Error saving course content:', error)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o conteúdo do curso.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <SectionLoader />
  }

  if (!course) {
    return (
      <MagicLayout title="Curso não encontrado">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Curso não encontrado</h2>
          <Button onClick={() => navigate('/admin/courses')}>
            Voltar para Cursos
          </Button>
        </div>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title={`Gerenciar Conteúdo: ${course.name}`}
      description="Organize módulos e aulas do seu curso"
    >
      <div className="max-w-6xl mx-auto">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/courses')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Cursos
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Módulos e Aulas</CardTitle>
                <CardDescription>
                  Organize a estrutura do seu curso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full space-y-4">
                  {moduleFields.map((moduleField, moduleIndex) => (
                    <ModuleItem
                      key={moduleField.id}
                      moduleIndex={moduleIndex}
                      removeModule={removeModule}
                    />
                  ))}
                </Accordion>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => appendModule({ name: '', lessons: [] })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Módulo
                </Button>
              </CardContent>
            </Card>
          </form>
        </FormProvider>
      </div>
    </MagicLayout>
  )
}
