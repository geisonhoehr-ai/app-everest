import { useState, useEffect } from 'react'
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
  Brain,
  AlertTriangle,
  Trophy,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuestionRenderer } from '@/components/QuestionRenderer'
import {
  getSimulation,
  type Simulation,
  startSimulationAttempt,
  saveSimulationAnswer,
  submitSimulation
} from '@/services/simulationService'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export default function SimulationExamPage() {
  const { simulationId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (simulationId && user) {
      loadSimulation()
    }
  }, [simulationId, user])

  useEffect(() => {
    if (!simulation) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [simulation])

  const loadSimulation = async () => {
    try {
      setLoading(true)
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
      setTimeLeft((data.duration_minutes || 60) * 60)

      // Start attempt
      if (user) {
        const id = await startSimulationAttempt(simulationId!, user.id)
        setAttemptId(id)
      }
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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const handleAnswerChange = async (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }))

    if (attemptId) {
      try {
        await saveSimulationAnswer(attemptId, questionId, answer)
      } catch (error) {
        console.error('Failed to save answer', error)
      }
    }
  }

  const handleFinish = async () => {
    if (!attemptId) return

    try {
      setLoading(true)
      await submitSimulation(attemptId)
      toast({
        title: 'Simulado enviado!',
        description: 'Suas respostas foram salvas com sucesso.',
      })
      navigate(`/simulados/${simulationId}/resultado`)
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar o simulado. Tente novamente.',
        variant: 'destructive'
      })
      setLoading(false)
    }
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

  return (
    <MagicLayout
      title={simulation.title}
      description={`Questão ${currentQ + 1} de ${simulation.questions.length} • Simulado`}
      showHeader={false}
    >
      <div className="max-w-6xl mx-auto space-y-6">
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
              timeLeft < 300 ? "bg-red-500/10 border-red-500/30 text-red-600" : "bg-primary/10 border-primary/30 text-primary"
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

        {/* Question Card */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-8">
            {/* Question Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Questão {currentQ + 1}</h2>
                  <p className="text-sm text-muted-foreground">
                    {question.question_format === 'multiple_choice' && 'Múltipla Escolha'}
                    {question.question_format === 'true_false' && 'Verdadeiro/Falso'}
                    {question.question_format === 'essay' && 'Dissertativa'}
                    {question.question_format === 'fill_blank' && 'Preencher Lacuna'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {simulation.questions.length - currentQ - 1} restantes
                </span>
              </div>
            </div>

            {/* Question Content with QuestionRenderer */}
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
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              disabled={currentQ === 0}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              {simulation.questions.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300 cursor-pointer",
                    index === currentQ
                      ? "bg-primary scale-125"
                      : answers[simulation.questions[index].id]
                        ? "bg-green-500"
                        : "bg-muted/50"
                  )}
                  onClick={() => setCurrentQ(index)}
                />
              ))}
            </div>

            {currentQ < simulation.questions.length - 1 ? (
              <Button
                variant="outline"
                onClick={() => setCurrentQ((p) => p + 1)}
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
              >
                Próxima
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold transition-transform duration-300 hover:scale-105 hover:shadow-lg inline-flex items-center justify-center">
                    <Trophy className="mr-2 h-4 w-4" />
                    Finalizar Simulado
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Confirmar Envio?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Você tem certeza que deseja finalizar e enviar suas respostas?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleFinish}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
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
    </MagicLayout>
  )
}
