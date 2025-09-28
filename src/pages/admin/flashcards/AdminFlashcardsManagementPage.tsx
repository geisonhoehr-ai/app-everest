import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { flashcardData } from '@/lib/flashcard-data'
import { ArrowLeft, Trash, Upload, Download } from 'lucide-react'
import { useRef, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import {
  formatFlashcardsForExport,
  parseFlashcardsFromFile,
  downloadTxtFile,
  type ImportError,
} from '@/lib/importExport'
import { ImportErrorsDialog } from '@/components/admin/ImportErrorsDialog'

const flashcardsSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string().min(1, 'A pergunta é obrigatória.'),
      answer: z.string().min(1, 'A resposta é obrigatória.'),
      external_resource_url: z
        .string()
        .url('Por favor, insira uma URL válida.')
        .optional()
        .or(z.literal('')),
    }),
  ),
})

type FlashcardsFormValues = z.infer<typeof flashcardsSchema>

export default function AdminFlashcardsManagementPage() {
  const { subjectId, topicId } = useParams<{
    subjectId: string
    topicId: string
  }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)

  const subject = flashcardData.find((s) => s.id === subjectId)
  const topic = subject?.topics.find((t) => t.id === topicId)

  const form = useForm<FlashcardsFormValues>({
    resolver: zodResolver(flashcardsSchema),
    defaultValues: {
      flashcards:
        topic?.flashcards.map((f) => ({
          question: f.question,
          answer: f.answer,
          external_resource_url: f.external_resource_url || '',
        })) || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'flashcards',
  })

  if (!topic) return <div>Tópico não encontrado.</div>

  const onSubmit = (data: FlashcardsFormValues) => {
    console.log(data)
    toast({ title: 'Sucesso!', description: 'Flashcards salvos.' })
    navigate(`/admin/flashcards/${subjectId}`)
  }

  const handleExport = () => {
    const flashcards = form.getValues('flashcards')
    if (flashcards.length === 0) {
      toast({
        title: 'Nenhum card para exportar',
        variant: 'destructive',
      })
      return
    }
    const content = formatFlashcardsForExport(flashcards)
    downloadTxtFile(content, `${topic?.id}-flashcards.txt`)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = parseFlashcardsFromFile(content)

      if (result.errors) {
        setImportErrors(result.errors)
        setIsErrorDialogOpen(true)
      } else if (result.data) {
        form.setValue(
          'flashcards',
          result.data.map((d) => ({ ...d, external_resource_url: '' })),
        )
        toast({
          title: 'Importação Concluída',
          description: `${result.data.length} cards carregados. Salve para confirmar.`,
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
                onClick={() => navigate(`/admin/flashcards/${subjectId}`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Gerenciar: {topic.title}</h1>
                <p className="text-muted-foreground">
                  Adicione, edite ou remova os flashcards deste tópico.
                </p>
              </div>
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
              <Button type="submit">Salvar</Button>
            </div>
          </div>
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Card {index + 1}</CardTitle>
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
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`flashcards.${index}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pergunta (Frente)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`flashcards.${index}.answer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resposta (Verso)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`flashcards.${index}.external_resource_url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Recurso Externo (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://exemplo.com/artigo"
                        />
                      </FormControl>
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
              append({ question: '', answer: '', external_resource_url: '' })
            }
          >
            Adicionar Novo Card
          </Button>
        </form>
      </Form>
    </>
  )
}
