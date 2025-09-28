import { useForm, useFieldArray } from 'react-hook-form'


import * as z from 'zod'
import { Button } from '@/components/ui/button'
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
import { PlusCircle, Trash2 } from 'lucide-react'
import type { CriteriaTemplate } from '@/services/essaySettingsService'

const competencySchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  max_score: z.coerce.number().positive('A pontuação deve ser positiva.'),
})

const templateSchema = z.object({
  name: z.string().min(3, 'O nome do template é muito curto.'),
  description: z.string().optional(),
  competencies: z
    .array(competencySchema)
    .min(1, 'Adicione ao menos uma competência.'),
})

type TemplateFormValues = z.infer<typeof templateSchema>

interface CriteriaTemplateFormProps {
  template?: CriteriaTemplate | null
  onSubmit: (values: TemplateFormValues) => void
  onCancel: () => void
}

export const CriteriaTemplateForm = ({
  template,
  onSubmit,
  onCancel,
}: CriteriaTemplateFormProps) => {
  const form = useForm<TemplateFormValues>({
    
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      competencies: (template?.criteria as any)?.competencies || [
        { name: '', description: '', max_score: 200 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'competencies',
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Template</FormLabel>
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
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <FormLabel>Competências</FormLabel>
          <div className="space-y-3 mt-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-3 border rounded-md space-y-2 bg-muted/50"
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Competência {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name={`competencies.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`competencies.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`competencies.${index}.max_score`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        Pontuação Máxima
                      </FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ name: '', description: '', max_score: 200 })
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Competência
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar Template</Button>
        </div>
      </form>
    </Form>
  )
}
