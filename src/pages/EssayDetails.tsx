import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  FileDown,
  FileText,
  Target,
  Star,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import {
  getStudentEssayDetails,
  type StudentEssayDetails,
} from '@/services/essayService'
import { SectionLoader } from '@/components/SectionLoader'
import { FeedbackReport } from '@/components/essays/FeedbackReport'
import { cn } from '@/lib/utils'

export default function EssayDetailsPage() {
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Redação não encontrada</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A redação solicitada não existe ou foi removida.
          </p>
        </div>
        <Button asChild>
          <Link to="/redacoes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
    )
  }

  const grade = (essay as any).final_grade || 0
  const isCorrected = (essay as any).status === 'corrected'
  const submissionDate = (essay as any).submission_date || (essay as any).created_at
  const formattedDate = submissionDate
    ? new Date(submissionDate).toLocaleDateString('pt-BR')
    : '—'
  const submissionText = (essay as any).submission_text || ''
  const wordCount = submissionText.trim() ? submissionText.trim().split(/\s+/).length : 0
  const promptTitle = (essay as any).essay_prompts?.title || 'Redação'

  const getGradeLevel = (g: number) => {
    if (g >= 900) return { level: 'Excelente', color: 'green' }
    if (g >= 800) return { level: 'Bom', color: 'blue' }
    if (g >= 700) return { level: 'Regular', color: 'yellow' }
    return { level: 'Precisa melhorar', color: 'red' }
  }

  const gradeLevel = getGradeLevel(grade)
  const gradePercent = Math.min(100, (grade / 1000) * 100)

  // Extract competency scores from evaluation_criteria or ai_analysis
  const criteria = (essay as any).essay_prompts?.evaluation_criteria as any
  const aiAnalysis = (essay as any).ai_analysis as any
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/redacoes"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{promptTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enviada em {formattedDate} · {wordCount} palavras
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="gap-2 transition-all duration-200 hover:shadow-md hover:border-primary/30"
        >
          <Link to={`/redacoes/${essayId}/report`} target="_blank">
            <FileDown className="h-4 w-4" />
            Relatório
          </Link>
        </Button>
      </div>

      {/* Score Card */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            {/* Grade circle */}
            <div className="text-center shrink-0">
              <div
                className={cn(
                  'text-5xl font-bold',
                  gradeLevel.color === 'green' && 'text-green-600',
                  gradeLevel.color === 'blue' && 'text-blue-600',
                  gradeLevel.color === 'yellow' && 'text-yellow-600',
                  gradeLevel.color === 'red' && 'text-red-600',
                )}
              >
                {grade}
              </div>
              <div className="text-sm text-muted-foreground">de 1000</div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    isCorrected
                      ? 'bg-green-500/10 text-green-600 border-green-500/30'
                      : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
                  )}
                >
                  {isCorrected ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {isCorrected ? 'Corrigida' : 'Em Correção'}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    gradeLevel.color === 'green' && 'bg-green-500/10 text-green-600 border-green-500/30',
                    gradeLevel.color === 'blue' && 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                    gradeLevel.color === 'yellow' && 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
                    gradeLevel.color === 'red' && 'bg-red-500/10 text-red-600 border-red-500/30',
                  )}
                >
                  <Star className="h-3 w-3 mr-1" />
                  {gradeLevel.level}
                </Badge>
              </div>
              <Progress
                value={gradePercent}
                className="h-2 bg-muted [&>div]:bg-blue-500"
              />
            </div>
          </div>
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
              <h2 className="text-lg font-bold text-foreground">Competências</h2>
            </div>
            <div className="space-y-3">
              {competencies.map((c) => {
                const pct = c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0
                return (
                  <div
                    key={c.key}
                    className="p-3 rounded-lg border border-border bg-muted/30 transition-all duration-200 hover:shadow-md hover:border-primary/30"
                  >
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

      {/* Feedback */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Feedback</h2>
          </div>
          <FeedbackReport essay={essay} />
        </CardContent>
      </Card>
    </div>
  )
}
