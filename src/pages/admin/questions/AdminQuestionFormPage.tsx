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

const questionSchema = z.object({
  question: z.string().min(10, 'O enunciado é muito curto.'),
  source: z.string().min(1, 'A fonte é obrigatória.'),
  year: z.coerce.number().min(2000, 'Ano inválido.'),
  subject: z.string().min(1, 'A matéria é obrigatória.'),
  options: z.array(z.string().min(1)).length(4, 'Deve haver 4 opções.'),
  correctAnswer: z.string().min(1, 'A resposta correta é obrigatória.'),
  explanation: z.string().min(10, 'A explicação é muito curta.'),
})

type QuestionFormValues = z.infer<typeof questionSchema>

export default function AdminQuestionFormPage() {
  const { questionId } = useParams()
  const navigate = useNavigate()
  const isEditing = !!questionId

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: '',
      source: '',
      year: new Date().getFullYear(),
      subject: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
    },
  })

  const onSubmit = (data: QuestionFormValues) => {
    console.log(data)
    navigate('/admin/questions')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Editar Questão' : 'Nova Questão'}
            </CardTitle>
            <CardDescription>Preencha os detalhes da questão.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enunciado</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ENEM, FUVEST..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matéria</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormLabel>Opções</FormLabel>
              <div className="space-y-2 mt-2">
                {[0, 1, 2, 3].map((i) => (
                  <FormField
                    key={i}
                    control={form.control}
                    name={`options.${i}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder={`Opção ${i + 1}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resposta Correta</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a resposta correta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {form.watch('options').map(
                        (opt, i) =>
                          opt && (
                            <SelectItem key={i} value={opt}>
                              {opt}
                            </SelectItem>
                          ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explicação</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/questions')}
          >
            Cancelar
          </Button>
          <Button type="submit">Salvar Questão</Button>
        </div>
      </form>
    </Form>
  )
}
