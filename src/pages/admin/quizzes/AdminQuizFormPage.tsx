import { useEffect, useState } from 'react'
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
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { getTopics, type AdminTopic } from '@/services/adminQuizService'

const quizSchema = z.object({
  title: z.string().min(3, 'O título é muito curto.'),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().positive().optional(),
  topic_id: z.string().uuid('Selecione um tópico válido.'),
})

type QuizFormValues = z.infer<typeof quizSchema>

export default function AdminQuizFormPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const isEditing = !!quizId
  const { toast } = useToast()
  const [topics, setTopics] = useState<AdminTopic[]>([])

  useEffect(() => {
    getTopics().then(setTopics)
  }, [])

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  const onSubmit = (data: QuizFormValues) => {
    console.log(data)
    toast({
      title: `Quiz ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
    })
    navigate('/admin/quizzes')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Editar Quiz' : 'Novo Quiz'}</CardTitle>
            <CardDescription>
              Preencha os detalhes do quiz. As questões são gerenciadas
              separadamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Quiz</FormLabel>
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
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="topic_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tópico Associado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tópico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/quizzes')}
          >
            Cancelar
          </Button>
          <Button type="submit">Salvar Quiz</Button>
        </div>
      </form>
    </Form>
  )
}
