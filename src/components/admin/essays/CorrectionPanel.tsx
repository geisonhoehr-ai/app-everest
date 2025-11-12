import { useForm, useFieldArray } from 'react-hook-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import type {
  EssayAnnotation,
  ErrorCategory,
  EssayForCorrection,
} from '@/services/essayService'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { useEffect } from 'react'

interface CorrectionPanelProps {
  essay: EssayForCorrection
  errorCategories: ErrorCategory[]
  selectedAnnotation: EssayAnnotation | null
  onAnnotationUpdate: (annotation: EssayAnnotation) => void
  onAnnotationDelete: (annotationId: string) => void
  onFinalizeCorrection: (payload: {
    finalGrade: number
    feedback: string
  }) => void
}

export const CorrectionPanel = ({
  essay,
  errorCategories,
  selectedAnnotation,
  onAnnotationUpdate,
  onAnnotationDelete,
  onFinalizeCorrection,
}: CorrectionPanelProps) => {
  const criteria = essay.essay_prompts?.evaluation_criteria as any
  const competencies = criteria?.competencies
    ? Object.entries(criteria.competencies)
    : []

  const form = useForm({
    defaultValues: {
      competency_scores: competencies.map(() => 0),
      final_grade: essay.final_grade || 0,
      teacher_feedback_text: essay.teacher_feedback_text || '',
    },
  })

  const competencyScores = form.watch('competency_scores')

  useEffect(() => {
    const total = competencyScores.reduce(
      (acc, score) => acc + Number(score),
      0,
    )
    form.setValue('final_grade', total)
  }, [competencyScores, form])

  const onSubmit = (data: any) => {
    onFinalizeCorrection({
      finalGrade: data.final_grade,
      feedback: data.teacher_feedback_text,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="h-full flex flex-col"
      >
        <Card className="h-full flex flex-col border-0 shadow-none">
          <CardHeader>
            <CardTitle>Painel de Correção</CardTitle>
            <CardDescription>
              Revise as sugestões e adicione suas anotações.
            </CardDescription>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="space-y-4">
              {selectedAnnotation && (
                <div>
                  <h3 className="font-semibold mb-2">Anotação Selecionada</h3>
                  <div className="space-y-2 p-3 border rounded-md bg-muted/50">
                    <p className="text-sm italic">
                      "
                      {essay.submission_text.substring(
                        selectedAnnotation.start_offset,
                        selectedAnnotation.end_offset,
                      )}
                      "
                    </p>
                    <Textarea
                      defaultValue={selectedAnnotation.annotation_text}
                      placeholder="Comentário..."
                    />
                    <Textarea
                      defaultValue={
                        selectedAnnotation.suggested_correction || ''
                      }
                      placeholder="Sugestão de correção..."
                    />
                    <Select
                      defaultValue={selectedAnnotation.error_category_id || ''}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Categoria do Erro" />
                      </SelectTrigger>
                      <SelectContent>
                        {errorCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm">Salvar Anotação</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          onAnnotationDelete(selectedAnnotation.id)
                        }
                      >
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">Critérios de Avaliação</h3>
                <div className="space-y-2">
                  {competencies.map(([key, value], index) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={`competency_scores.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <Label>{(value as any).name}</Label>
                          <FormControl>
                            <Input
                              type="number"
                              max={(value as any).max_score}
                              min="0"
                              placeholder={`0-${(value as any).max_score}`}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
              <FormField
                control={form.control}
                name="final_grade"
                render={({ field }) => (
                  <FormItem>
                    <Label>Nota Final (0-1000)</Label>
                    <FormControl>
                      <Input type="number" readOnly {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teacher_feedback_text"
                render={({ field }) => (
                  <FormItem>
                    <Label>Comentários Gerais</Label>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </ScrollArea>
          <div className="p-6 border-t">
            <Button type="submit" className="w-full">
              Finalizar Correção
            </Button>
          </div>
        </Card>
      </form>
    </Form>
  )
}
