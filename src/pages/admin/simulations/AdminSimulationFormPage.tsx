import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { logger } from '@/lib/logger'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Trash, Upload, Download } from 'lucide-react'
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
  question: z.string().min(1, 'A pergunta é obrigatória.'),
  options: z.array(z.string().min(1)).length(4, 'Deve haver 4 opções.'),
  correctAnswer: z.string().min(1, 'Selecione a resposta correta.'),
})

const simulationSchema = z.object({
  name: z.string().min(3, 'O nome é muito curto.'),
  date: z.string().min(1, 'A data é obrigatória.'),
  duration: z.coerce.number().min(1, 'A duração deve ser maior que 0.'),
  questions: z.array(questionSchema),
})

type SimulationFormValues = z.infer<typeof simulationSchema>

export default function AdminSimulationFormPage() {
  const { simulationId } = useParams()
  const navigate = useNavigate()
  const isEditing = !!simulationId
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)

  const form = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationSchema),
    defaultValues: {
      name: '',
      date: '',
      duration: 180,
      questions: [],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'questions',
  })

  const onSubmit = (data: SimulationFormValues) => {
    logger.debug(data)
    toast({
      title: `Simulado ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
    })
    navigate('/admin/simulations')
  }

  const handleExport = () => {
    const questions = form.getValues('questions')
    if (questions.length === 0) {
      toast({ title: 'Nenhuma questão para exportar', variant: 'destructive' })
      return
    }
    const content = formatQuizQuestionsForExport(questions)
    downloadTxtFile(
      content,
      `simulado-${form.getValues('name') || 'questoes'}.txt`,
    )
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
          ...q,
          options: q.options
            .slice(0, 4)
            .concat(Array(4 - q.options.length).fill(''))
            .slice(0, 4),
        }))
        replace(formatted)
        toast({
          title: 'Importação Concluída',
          description: `${result.data.length} questões carregadas. Salve para confirmar.`,
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
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditing ? 'Editar Simulado' : 'Novo Simulado'}
              </CardTitle>
              <CardDescription>
                Preencha os detalhes e adicione as questões do simulado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Simulado</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Questões</CardTitle>
                <CardDescription>
                  Adicione, edite ou importe as questões do simulado.
                </CardDescription>
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
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="bg-muted/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-base">
                      Questão {index + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`questions.${index}.question`}
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
                      name={`questions.${index}.correctAnswer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Opções (marque a correta)</FormLabel>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
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
                                      <RadioGroupItem
                                        value={optionField.value}
                                      />
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
                  </CardContent>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: '',
                  })
                }
              >
                Adicionar Questão
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/simulations')}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar Simulado</Button>
          </div>
        </form>
      </Form>
    </>
  )
}
