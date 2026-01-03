import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { logger } from '@/lib/logger'
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
import {
  getCriteriaTemplates,
  type CriteriaTemplate,
} from '@/services/essaySettingsService'

const essayPromptSchema = z.object({
  theme: z.string().min(10, 'O tema deve ter pelo menos 10 caracteres.'),
  description: z
    .string()
    .min(20, 'A descrição deve ter pelo menos 20 caracteres.'),
  criteria_template_id: z.string().uuid('Selecione um template válido.'),
  evaluation_criteria: z.any(),
})

type EssayPromptFormValues = z.infer<typeof essayPromptSchema>

const mockPrompt = {
  id: 1,
  theme: 'Inteligência Artificial e o Futuro do Trabalho',
  description:
    'Discorra sobre os impactos da inteligência artificial no mercado de trabalho, abordando tanto as oportunidades quanto os desafios para a sociedade contemporânea.',
  criteria_template_id: 'some-uuid-1',
  evaluation_criteria: {},
}

export default function AdminEssayFormPage() {
  const { promptId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEditing = !!promptId
  const [templates, setTemplates] = useState<CriteriaTemplate[]>([])

  const form = useForm<EssayPromptFormValues>({
    resolver: zodResolver(essayPromptSchema),
    defaultValues: isEditing
      ? mockPrompt
      : {
          theme: '',
          description: '',
          criteria_template_id: '',
          evaluation_criteria: {},
        },
  })

  useEffect(() => {
    getCriteriaTemplates().then(setTemplates)
  }, [])

  const selectedTemplateId = form.watch('criteria_template_id')
  useEffect(() => {
    if (selectedTemplateId) {
      const selectedTemplate = templates.find(
        (t) => t.id === selectedTemplateId,
      )
      if (selectedTemplate) {
        form.setValue('evaluation_criteria', selectedTemplate.criteria)
      }
    }
  }, [selectedTemplateId, templates, form])

  const onSubmit = (data: EssayPromptFormValues) => {
    logger.debug(data)
    toast({
      title: `Tema ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
      description: data.theme,
    })
    navigate('/admin/essays')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Editar Tema de Redação' : 'Novo Tema de Redação'}
            </CardTitle>
            <CardDescription>
              Crie ou edite um tema para que os alunos possam enviar suas
              redações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: A Persistência da Violência Contra a Mulher"
                    />
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
                  <FormLabel>Descrição / Texto de Apoio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={8}
                      placeholder="Forneça o texto de apoio e as instruções para a redação."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="criteria_template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Critérios de Avaliação</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template de critérios" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            onClick={() => navigate('/admin/essays')}
          >
            Cancelar
          </Button>
          <Button type="submit">Salvar Tema</Button>
        </div>
      </form>
    </Form>
  )
}
