import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
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

const mockCourse = {
  id: 'course1',
  name: 'Matemática para Concursos',
  modules: [
    {
      name: 'Módulo 1: Fundamentos',
      lessons: [
        {
          title: 'Aula 1: Adição e Subtração',
          is_active: true,
          is_preview: true,
          attachments: [],
        },
        {
          title: 'Aula 2: Multiplicação',
          is_active: true,
          is_preview: false,
          attachments: [],
        },
      ],
    },
  ],
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

  const form = useForm<CourseContentFormValues>({
    resolver: zodResolver(courseContentSchema),
    defaultValues: {
      modules: mockCourse.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => ({
          ...l,
          description: '',
          video_source_id: '',
        })),
      })),
    },
  })

  const {
    fields: moduleFields,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control: form.control,
    name: 'modules',
  })

  const onSubmit = (data: CourseContentFormValues) => {
    console.log('Saving course content:', data)
    toast({ title: 'Conteúdo do curso salvo com sucesso!' })
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate('/admin/courses')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Conteúdo</h1>
              <p className="text-muted-foreground">{mockCourse.name}</p>
            </div>
          </div>
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
  )
}
