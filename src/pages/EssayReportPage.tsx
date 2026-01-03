import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Printer } from 'lucide-react'
import {
  getStudentEssayDetails,
  type StudentEssayDetails,
} from '@/services/essayService'
import { SectionLoader } from '@/components/SectionLoader'

const renderTextWithAnnotations = (
  text: string,
  annotations: StudentEssayDetails['essay_annotations'],
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
      <span
        key={i}
        className="bg-yellow-200/50 p-0.5 rounded-sm"
        title={anno.annotation_text}
      >
        {text.substring(anno.start_offset, anno.end_offset)}
      </span>,
    )
    lastIndex = anno.end_offset
  })

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return <p className="whitespace-pre-wrap">{parts}</p>
}

export default function EssayReportPage() {
  const { essayId } = useParams<{ essayId: string }>()
  const [essay, setEssay] = useState<StudentEssayDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (essayId) {
      getStudentEssayDetails(essayId)
        .then(setEssay)
        .finally(() => setIsLoading(false))
    }
  }, [essayId])

  if (isLoading) {
    return <SectionLoader />
  }

  if (!essay) {
    return <div>Relatório não encontrado.</div>
  }

  const criteria = essay.essay_prompts?.evaluation_criteria as any

  return (
    <div className="bg-background min-h-screen">
      <div className="container py-8 mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <h1 className="text-2xl font-bold">Relatório de Correção</h1>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
        <div className="p-8 border rounded-lg space-y-6 bg-card">
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {essay.essay_prompts?.title}
            </h2>
            <p className="text-muted-foreground">
              Nota Final:{' '}
              <span className="font-bold text-primary text-2xl">
                {essay.final_grade}
              </span>
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="font-bold mb-2 text-lg">Redação Enviada</h3>
            <div className="prose prose-sm max-w-none">
              {renderTextWithAnnotations(
                essay.submission_text,
                essay.essay_annotations,
              )}
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="font-bold mb-2 text-lg">Feedback do Corretor</h3>
            <p className="text-sm text-muted-foreground italic">
              {essay.teacher_feedback_text}
            </p>
          </div>
          {criteria && (
            <>
              <Separator />
              <div>
                <h3 className="font-bold mb-2 text-lg">
                  Análise por Competência
                </h3>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
