import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { StudentEssayDetails } from '@/services/essayService'

interface FeedbackReportProps {
  essay: StudentEssayDetails
}

const renderTextWithAnnotations = (
  text: string,
  annotations: FeedbackReportProps['essay']['essay_annotations'],
) => {
  if (!annotations || annotations.length === 0) {
    return <p>{text}</p>
  }

  let lastIndex = 0
  const parts = []
  const sortedAnnotations = [...annotations].sort(
    (a, b) => a.start_offset - b.start_offset,
  )

  sortedAnnotations.forEach((anno, i) => {
    if (anno.start_offset > lastIndex) {
      parts.push(text.substring(lastIndex, anno.start_offset))
    }
    parts.push(
      <mark
        key={i}
        className="bg-primary/20 p-0.5 rounded-sm cursor-pointer"
        title={anno.annotation_text}
      >
        {text.substring(anno.start_offset, anno.end_offset)}
      </mark>,
    )
    lastIndex = anno.end_offset
  })

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return <p className="whitespace-pre-wrap">{parts}</p>
}

export const FeedbackReport = ({ essay }: FeedbackReportProps) => {
  const criteria = essay.essay_prompts?.evaluation_criteria as any

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Texto Corrigido</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          {renderTextWithAnnotations(
            essay.submission_text,
            essay.essay_annotations,
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Feedback do Corretor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Comentários Gerais</h3>
            <p className="text-muted-foreground">
              {essay.teacher_feedback_text ||
                'Nenhum comentário geral fornecido.'}
            </p>
          </div>
          <Separator />
          {criteria && (
            <div>
              <h3 className="font-semibold mb-2">Análise por Competência</h3>
              <ul className="space-y-2 text-sm">
                {Object.entries(criteria.competencies).map(([key, value]) => (
                  <li key={key}>
                    <strong>{(value as any).name}:</strong>{' '}
                    {(essay.ai_analysis as any)?.feedback?.[key] ||
                      'Análise não disponível.'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
