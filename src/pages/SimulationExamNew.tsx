import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Timer,
  ChevronLeft,
  ChevronRight,
  Target,
  AlertTriangle,
  Trophy,
  Loader2,
  BookOpen,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuestionRenderer } from '@/components/QuestionRenderer'
import { ReadingTextDisplay } from '@/components/ReadingTextDisplay'
import { AnswerSheet, type AnswerSheetQuestion } from '@/components/AnswerSheet'
import { getSimulation, type Simulation } from '@/services/simulationService'
import {
  createQuizAttempt,
  getCurrentAttempt,
  saveQuizAnswer,
  submitQuizAttempt,
  getQuizReadingTexts,
  canUserAccessQuiz,
  type ReadingText,
  type QuizAttempt
} from '@/services/quizAttemptService'
import { useToast } from '@/hooks/use-toast'

export default function SimulationExamPage() {
  const { simulationId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [readingTexts, setReadingTexts] = useState<ReadingText[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (simulationId) {
      loadSimulation()
    }
  }, [simulationId])

  useEffect(() => {
    if (!simulation || !attempt) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [simulation, attempt])

  // Auto-save a cada 10 segundos
  useEffect(() => {
    if (!attempt) return

    const autoSaveInterval = setInterval(() => {
      saveCurrentAnswer()
    }, 10000)

    return () => clearInterval(autoSaveInterval)
  }, [attempt, currentQ, answers])

  const loadSimulation = async () => {
    try {
      setLoading(true)

      // Verificar acesso
      const hasAccess = await canUserAccessQuiz(simulationId!)
      if (!hasAccess) {
        toast({
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar este simulado',
          variant: 'destructive',
        })
        navigate('/simulados')
        return
      }

      // Carregar simulado
      const data = await getSimulation(simulationId!)
      if (!data) {
        toast({
          title: 'Erro',
          description: 'Simulado não encontrado',
          variant: 'destructive',
        })
        navigate('/simulados')
        return
      }

      setSimulation(data)

      // Carregar ou criar tentativa
      let currentAttempt = await getCurrentAttempt(simulationId!)
      if (!currentAttempt) {
        currentAttempt = await createQuizAttempt(simulationId!)
      }

      if (!currentAttempt) {
        throw new Error('Não foi possível criar tentativa')
      }

      setAttempt(currentAttempt)

      // Calcular tempo restante
      const startTime = new Date(currentAttempt.started_at).getTime()
      const durationMs = (data.duration_minutes || 60) * 60 * 1000
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000))
      setTimeLeft(remaining)

      // Carregar textos de leitura
      const texts = await getQuizReadingTexts(simulationId!)
      setReadingTexts(texts)

    } catch (error: any) {
      toast({
        title: 'Erro ao carregar simulado',
        description: error.message,
        variant: 'destructive',
      })
      navigate('/simulados')
    } finally {
      setLoading(false)
    }
  }

  const saveCurrentAnswer = useCallback(async () => {
    if (!attempt || !simulation) return

    const question = simulation.questions[currentQ]
    const answer = answers[question.id]

    if (answer !== undefined && answer !== null && answer !== '') {
      try {
        await saveQuizAnswer(attempt.id, question.id, answer)
      } catch (error) {
        console.error('Erro ao salvar resposta:', error)
      }
    }
  }, [attempt, simulation, currentQ, answers])

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleQuestionSelect = async (index: number) => {
    await saveCurrentAnswer()
    setCurrentQ(index)
  }

  const handlePrevious = async () => {
    await saveCurrentAnswer()
    setCurrentQ(prev => Math.max(0, prev - 1))
  }

  const handleNext = async () => {
    await saveCurrentAnswer()
    setCurrentQ(prev => Math.min(simulation!.questions.length - 1, prev + 1))
  }

  const handleAutoSubmit = async () => {
    if (!attempt || submitting) return

    toast({
      title: 'Tempo esgotado!',
      description: 'Seu simulado será submetido automaticamente',
    })

    await handleFinish()
  }

  const handleFinish = async () => {
    if (!attempt || submitting) return

    try {
      setSubmitting(true)

      // Salvar resposta atual
      await saveCurrentAnswer()

      // Submeter simulado
      const result = await submitQuizAttempt(attempt.id)

      toast({
        title: 'Simulado enviado!',
        description: 'Confira seu resultado',
      })

      navigate(`/simulados/${simulationId}/resultado?attemptId=${attempt.id}`)
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar simulado',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
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

  if (!simulation || !simulation.questions.length) {
    return (
      <MagicLayout title="Erro" description="Simulado não encontrado">
        <MagicCard>
          <p className="text-center text-muted-foreground">
            Nenhuma questão encontrada neste simulado.
          </p>
        </MagicCard>
      </MagicLayout>
    )
  }

  const question = simulation.questions[currentQ]
  const progress = ((currentQ + 1) / simulation.questions.length) * 100

  // Preparar questões para o cartão resposta
  const answerSheetQuestions: AnswerSheetQuestion[] = simulation.questions.map((q, idx) => ({
    id: q.id,
    number: q.question_number || (idx + 1),
    answer: answers[q.id],
    isAnswered: answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ''
  }))

  // Buscar texto de leitura relacionado à questão atual
  const currentReadingText = question.reading_text_id
    ? readingTexts.find(t => t.id === question.reading_text_id)
    : null

  return (
    <MagicLayout
      title={simulation.title}
      description={`Questão ${currentQ + 1} de ${simulation.questions.length} • Simulado`}
      showHeader={false}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Timer */}
        <MagicCard variant="premium" size="lg" className="sticky top-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {simulation.title}
                </h1>
                <p className="text-muted-foreground">
                  Questão {currentQ + 1} de {simulation.questions.length}
                </p>
              </div>
            </div>

            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-mono text-xl font-bold transition-all duration-300",
              timeLeft < 300 ? "bg-red-500/10 border-red-500/30 text-red-600 animate-pulse" : "bg-primary/10 border-primary/30 text-primary"
            )}>
              <Timer className="h-6 w-6" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </MagicCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Texto de Leitura */}
            {currentReadingText && (
              <ReadingTextDisplay text={currentReadingText} />
            )}

            {/* Instruções do Simulado (primeira questão) */}
            {currentQ === 0 && simulation.instructions && (
              <MagicCard variant="glass" size="lg">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-500 mt-1" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">Instruções</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {simulation.instructions}
                    </p>
                  </div>
                </div>
              </MagicCard>
            )}

            {/* Question Card */}
            <MagicCard variant="glass" size="lg">
              <div className="space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        Questão {question.question_number || currentQ + 1}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {question.points} {question.points === 1 ? 'ponto' : 'pontos'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <QuestionRenderer
                  question={question}
                  answer={answers[question.id]}
                  onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
                />
              </div>
            </MagicCard>

            {/* Navigation */}
            <MagicCard variant="premium" size="lg">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQ === 0}
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>

                {currentQ < simulation.questions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    Próxima
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={submitting}
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Finalizar e Enviar
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          Confirmar Envio?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Você respondeu {answerSheetQuestions.filter(q => q.isAnswered).length} de {simulation.questions.length} questões.
                          <br /><br />
                          Tem certeza que deseja finalizar e enviar suas respostas? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleFinish}
                          className="bg-gradient-to-r from-primary to-primary/80"
                        >
                          Confirmar e Enviar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </MagicCard>
          </div>

          {/* Coluna Lateral - Cartão Resposta */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <AnswerSheet
                questions={answerSheetQuestions}
                currentQuestionIndex={currentQ}
                onQuestionSelect={handleQuestionSelect}
              />
            </div>
          </div>
        </div>
      </div>
    </MagicLayout>
  )
}
