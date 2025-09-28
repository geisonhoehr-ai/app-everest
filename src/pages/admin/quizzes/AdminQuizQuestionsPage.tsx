import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'


import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Trash, Upload, Download } from 'lucide-react'
import { useRef, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import {
  formatQuizQuestionsForExport,
  parseQuizQuestionsFromFile,
  downloadTxtFile,
  type ImportError,
} from '@/lib/importExport'
import { ImportErrorsDialog } from '@/components/admin/ImportErrorsDialog'

const questionSchema = z.object({
  question_text: z.string().min(1, 'A pergunta é obrigatória.'),
  options: z.array(z.string().min(1)).length(4, 'Deve haver 4 opções.'),
  correct_answer: z.string().min(1, 'Selecione a resposta correta.'),
  explanation: z.string().optional(),
  points: z.coerce.number().default(1),
})

const quizQuestionsSchema = z.object({
  questions: z.array(questionSchema),
})

type QuizQuestionsFormValues = z.infer<typeof quizQuestionsSchema>

export default function AdminQuizQuestionsPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)

  const form = useForm<QuizQuestionsFormValues>({
    
    defaultValues: {
      questions: [],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'questions',
  })

  const onSubmit = (data: QuizQuestionsFormValues) => {
    console.log('Saving questions for quiz:', quizId, data)
    toast({ title: 'Sucesso!', description: 'Questões salvas.' })
    navigate(`/admin/quizzes`)
  }

  const handleExport = () => {
    const questions = form.getValues('questions').map((q) => ({
      question: q.question_text,
      options: q.options,
      correctAnswer: q.correct_answer,
    }))
    if (questions.length === 0) {
      toast({ title: 'Nenhuma questão para exportar', variant: 'destructive' })
      return
    }
    const content = formatQuizQuestionsForExport(questions)
    downloadTxtFile(content, `quiz-${quizId}-questoes.txt`)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = parseQuizQuestionsFromFile(content)

      if (result.errors) {
        setImportErrors(result.errors)
        setIsErrorDialogOpen(true)
      } else if (result.data) {
        const formatted = result.data.map((q) => ({
          question_text: q.question,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: '',
          points: 1,
        }))
        replace(formatted)
        toast({
          title: 'Importação Concluída',
          description: `${result.data.length} questões carregadas.`,
        })
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <ImportErrorsDialog
        errors={importErrors}
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => navigate(`/admin/quizzes`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Gerenciar Questões do Quiz</h1>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Importar
              </Button>
              <Button type="button" variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
              <Button type="submit">Salvar Questões</Button>
            </div>
          </div>
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Questão {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={`questions.${index}.question_text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enunciado</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`questions.${index}.correct_answer`}
                  render={({ field: radioField }) => (
                    <FormItem>
                      <FormLabel>Opções (marque a correta)</FormLabel>
                      <RadioGroup
                        onValueChange={radioField.onChange}
                        defaultValue={radioField.value}
                        className="space-y-2"
                      >
                        {[0, 1, 2, 3].map((optIndex) => (
                          <FormField
                            key={optIndex}
                            control={form.control}
                            name={`questions.${index}.options.${optIndex}`}
                            render={({ field: optionField }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <RadioGroupItem value={optionField.value} />
                                </FormControl>
                                <Input
                                  {...optionField}
                                  placeholder={`Opção ${optIndex + 1}`}
                                />
                              </FormItem>
                            )}
                          />
                        ))}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`questions.${index}.explanation`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Explicação (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                question_text: '',
                options: ['', '', '', ''],
                correct_answer: '',
                explanation: '',
                points: 1,
              })
            }
          >
            Adicionar Nova Questão
          </Button>
        </form>
      </Form>
    </>
  )
}
