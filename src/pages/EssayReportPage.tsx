import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Printer, ArrowLeft, FileText, Target } from 'lucide-react'
import {
  getStudentEssayDetails,
  type StudentEssayDetails,
} from '@/services/essayService'
import { SectionLoader } from '@/components/SectionLoader'
import { Progress } from '@/components/ui/progress'

const renderTextWithAnnotations = (
  text: string,
  annotations: any[],
) => {
  if (!annotations || annotations.length === 0) {
    return <p className="whitespace-pre-wrap text-foreground leading-relaxed">{text}</p>
  }

  let lastIndex = 0
  const parts: React.ReactNode[] = []
  const sorted = [...annotations].sort((a, b) => a.start_offset - b.start_offset)

  sorted.forEach((anno, i) => {
    if (anno.start_offset > lastIndex) {
      parts.push(text.substring(lastIndex, anno.start_offset))
    }
    parts.push(
      <span
        key={i}
        className="bg-yellow-200/60 dark:bg-yellow-500/20 px-0.5 rounded-sm border-b-2 border-yellow-500"
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

  return <p className="whitespace-pre-wrap text-foreground leading-relaxed">{parts}</p>
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

  if (isLoading) return <SectionLoader />

  if (!essay) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Relatório não encontrado</h1>
        <Button asChild>
          <Link to="/redacoes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
    )
  }

  const data = essay as any
  const grade = data.final_grade || 0
  const criteria = data.essay_prompts?.evaluation_criteria as any
  const aiAnalysis = data.ai_analysis as any
  const competencies = criteria?.competencies
    ? Object.entries(criteria.competencies).map(([key, val]: [string, any]) => ({
        key,
        name: val.name || key,
        maxScore: val.value || 200,
        score: aiAnalysis?.scores?.[key] || 0,
      }))
    : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <Link
            to={`/redacoes/${essayId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Relatório de Correção</h1>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Title + Grade */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            {data.essay_prompts?.title || 'Redação'}
          </h2>
          <div className="text-4xl font-bold text-primary">{grade}</div>
          <div className="text-sm text-muted-foreground">de 1000 pontos</div>
        </CardContent>
      </Card>

      {/* Competencies */}
      {competencies.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Competências</h3>
            </div>
            <div className="space-y-3">
              {competencies.map((c) => {
                const pct = c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0
                return (
                  <div key={c.key} className="p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <span className="text-sm font-bold text-primary">
                        {c.score}/{c.maxScore}
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-muted [&>div]:bg-blue-500" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Essay Text */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Redação</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            {renderTextWithAnnotations(
              data.submission_text || '',
              data.essay_annotations || [],
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teacher feedback */}
      {data.teacher_feedback_text && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-3">
            <h3 className="font-bold text-foreground">Feedback do Corretor</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.teacher_feedback_text}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
