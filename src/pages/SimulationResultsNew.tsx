import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  TrendingUp,
  Award,
  Loader2,
  ChevronLeft,
  Eye,
  EyeOff,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuestionRenderer } from '@/components/QuestionRenderer'
import { ReadingTextDisplay } from '@/components/ReadingTextDisplay'
import { AnswerSheet } from '@/components/AnswerSheet'
import {
  getAttemptResult,
  getAttemptAnswers,
  getQuizReadingTexts,
  type QuizAttempt,
  type QuizAnswer,
  type ReadingText
} from '@/services/quizAttemptService'
import { getSimulation, type Simulation } from '@/services/simulationService'
import { useToast } from '@/hooks/use-toast'

export default function SimulationResultsPage() {
  const { simulationId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const attemptId = searchParams.get('attemptId')

  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [readingTexts, setReadingTexts] = useState<ReadingText[]>([])
  const [loading, setLoading] = useState(true)
  const [showReview, setShowReview] = useState(false)
  const [currentReviewQ, setCurrentReviewQ] = useState(0)

  useEffect(() => {
    if (attemptId) {
      loadResults()
    }
  }, [attemptId])

  const loadResults = async () => {
    try {
      setLoading(true)

      // Carregar resultado da tentativa
      const attemptData = await getAttemptResult(attemptId!)
      if (!attemptData) {
        toast({
          title: 'Erro',
          description: 'Resultado não encontrado',
          variant: 'destructive',
        })
        navigate('/simulados')
        return
      }
      setAttempt(attemptData)

      // Carregar simulado
      const simData = await getSimulation(attemptData.quiz_id)
      if (!simData) {
        throw new Error('Simulado não encontrado')
      }
      setSimulation(simData)

      // Carregar respostas
      const answersData = await getAttemptAnswers(attemptId!)
      setAnswers(answersData)

      // Carregar textos de leitura
      const texts = await getQuizReadingTexts(attemptData.quiz_id)
      setReadingTexts(texts)

    } catch (error: any) {
      toast({
        title: 'Erro ao carregar resultados',
        description: error.message,
        variant: 'destructive',
      })
      navigate('/simulados')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds?: number) => {
    if (!seconds) return '00:00:00'
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const getPerformanceLevel = (percentage?: number) => {
    if (!percentage) return { label: 'Não avaliado', color: 'text-muted-foreground' }
    if (percentage >= 90) return { label: 'Excelente', color: 'text-green-600' }
    if (percentage >= 70) return { label: 'Bom', color: 'text-blue-600' }
    if (percentage >= 50) return { label: 'Regular', color: 'text-yellow-600' }
    return { label: 'Precisa melhorar', color: 'text-red-600' }
  }

  if (loading) {
    return (
      <MagicLayout title="Carregando..." description="Aguarde...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MagicLayout>
    )
  }

  if (!attempt || !simulation) {
    return (
      <MagicLayout title="Erro" description="Resultado não encontrado">
        <MagicCard>
          <p className="text-center text-muted-foreground">
            Não foi possível carregar os resultados.
          </p>
        </MagicCard>
      </MagicLayout>
    )
  }

  const performance = getPerformanceLevel(attempt.percentage)
  const correctCount = answers.filter(a => a.is_correct).length
  const incorrectCount = answers.filter(a => a.is_correct === false).length
  const unansweredCount = simulation.questions.length - answers.length
  const isPassed = attempt.passing_score ? (attempt.percentage || 0) >= attempt.passing_score : true

  // Vista de revisão
  if (showReview && simulation.questions.length > 0) {
    const question = simulation.questions[currentReviewQ]
    const answer = answers.find(a => a.question_id === question.id)
    const readingText = question.reading_text_id
      ? readingTexts.find(t => t.id === question.reading_text_id)
      : null

    const answerSheetQuestions = simulation.questions.map((q, idx) => {
      const ans = answers.find(a => a.question_id === q.id)
      return {
        id: q.id,
        number: q.question_number || (idx + 1),
        answer: ans?.answer_value,
        isCorrect: ans?.is_correct,
        isAnswered: !!ans
      }
    })

    return (
      <MagicLayout
        title="Revisão do Simulado"
        description={`Questão ${currentReviewQ + 1} de ${simulation.questions.length}`}
        showHeader={false}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <MagicCard variant="premium" size="lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowReview(false)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Revisão do Simulado</h1>
                  <p className="text-muted-foreground">
                    Questão {currentReviewQ + 1} de {simulation.questions.length}
                  </p>
                </div>
              </div>

              <Badge
                variant={answer?.is_correct ? 'default' : 'destructive'}
                className="text-sm py-1 px-3"
              >
                {answer?.is_correct ? 'Correta' : answer ? 'Incorreta' : 'Não respondida'}
              </Badge>
            </div>
          </MagicCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {readingText && <ReadingTextDisplay text={readingText} />}

              <MagicCard variant="glass" size="lg">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        Questão {question.question_number || currentReviewQ + 1}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {question.points} {question.points === 1 ? 'ponto' : 'pontos'} •{' '}
                        {answer?.is_correct ? `+${answer.points_earned} pontos` : '0 pontos'}
                      </p>
                    </div>
                  </div>

                  <QuestionRenderer
                    question={question}
                    answer={answer?.answer_json || answer?.answer_value}
                    onAnswerChange={() => {}}
                    disabled
                    showCorrectAnswer
                  />

                  {question.explanation && (
                    <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <h4 className="font-semibold text-blue-600 mb-2">Explicação:</h4>
                      {question.explanation_html ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: question.explanation_html }}
                          className="prose prose-sm dark:prose-invert"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
              </MagicCard>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentReviewQ(prev => Math.max(0, prev - 1))}
                  disabled={currentReviewQ === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentReviewQ(prev => Math.min(simulation.questions.length - 1, prev + 1))}
                  disabled={currentReviewQ === simulation.questions.length - 1}
                >
                  Próxima
                  <ChevronLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <AnswerSheet
                  questions={answerSheetQuestions}
                  currentQuestionIndex={currentReviewQ}
                  onQuestionSelect={setCurrentReviewQ}
                  showResults
                />
              </div>
            </div>
          </div>
        </div>
      </MagicLayout>
    )
  }

  // Vista de resultados
  return (
    <MagicLayout
      title="Resultado do Simulado"
      description={simulation.title}
      showHeader={false}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header com Score */}
        <MagicCard variant="premium" size="lg" className="text-center">
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "p-6 rounded-full",
              isPassed ? "bg-gradient-to-br from-green-500/20 to-green-500/10" : "bg-gradient-to-br from-red-500/20 to-red-500/10"
            )}>
              {isPassed ? (
                <Trophy className="h-16 w-16 text-green-500" />
              ) : (
                <Target className="h-16 w-16 text-red-500" />
              )}
            </div>

            <div>
              <h1 className="text-4xl font-bold mb-2">{attempt.percentage?.toFixed(1)}%</h1>
              <p className={cn("text-xl font-semibold", performance.color)}>
                {performance.label}
              </p>
              <p className="text-muted-foreground mt-2">
                {attempt.score?.toFixed(1)} de {attempt.total_points} pontos
              </p>
            </div>

            {attempt.passing_score && (
              <Badge
                variant={isPassed ? 'default' : 'destructive'}
                className="text-sm py-1 px-3"
              >
                {isPassed ? '✓ Aprovado' : '✗ Reprovado'} (nota mínima: {attempt.passing_score}%)
              </Badge>
            )}
          </div>
        </MagicCard>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MagicCard variant="glass">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{correctCount}</p>
                <p className="text-sm text-muted-foreground">Corretas</p>
              </div>
            </div>
          </MagicCard>

          <MagicCard variant="glass">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incorrectCount}</p>
                <p className="text-sm text-muted-foreground">Incorretas</p>
              </div>
            </div>
          </MagicCard>

          <MagicCard variant="glass">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <Circle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unansweredCount}</p>
                <p className="text-sm text-muted-foreground">Em branco</p>
              </div>
            </div>
          </MagicCard>

          <MagicCard variant="glass">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(attempt.time_spent_seconds)}</p>
                <p className="text-sm text-muted-foreground">Tempo gasto</p>
              </div>
            </div>
          </MagicCard>
        </div>

        {/* Gráfico de Progresso */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Desempenho</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {correctCount} de {simulation.questions.length} questões
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Acertos</span>
                  <span className="font-medium">{((correctCount / simulation.questions.length) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(correctCount / simulation.questions.length) * 100} className="h-2 bg-green-500/20" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Erros</span>
                  <span className="font-medium">{((incorrectCount / simulation.questions.length) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(incorrectCount / simulation.questions.length) * 100} className="h-2 bg-red-500/20" />
              </div>

              {unansweredCount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Em branco</span>
                    <span className="font-medium">{((unansweredCount / simulation.questions.length) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(unansweredCount / simulation.questions.length) * 100} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </MagicCard>

        {/* Ações */}
        <MagicCard variant="glass" size="lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold">Quer melhorar seu resultado?</h3>
                <p className="text-sm text-muted-foreground">
                  Revise suas respostas e veja as explicações
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/simulados')}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={() => setShowReview(true)}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Eye className="mr-2 h-4 w-4" />
                Revisar Questões
              </Button>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
