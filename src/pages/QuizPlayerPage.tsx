import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  HelpCircle,
  Trophy,
  Target,
  Brain,
  ArrowRight,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { quizService, type Quiz } from '@/services/quizService'
import { useAuth } from '@/contexts/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { SectionLoader } from '@/components/SectionLoader'
import { useActivityScoring } from '@/hooks/useAchievements'

export default function QuizPlayerPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { scoreQuizActivity } = useActivityScoring()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [startTime] = useState(Date.now())

  useEffect(() => {
    if (!quizId) return

    const loadQuiz = async () => {
      try {
        setIsLoading(true)
        const quizData = await quizService.getQuizById(quizId)

        if (!quizData) {
          toast({
            title: 'Quiz não encontrado',
            description: 'O quiz que você está procurando não existe.',
            variant: 'destructive',
          })
          navigate('/quizzes')
          return
        }

        // Filtrar apenas quizzes tipo 'quiz', não simulados
        if (quizData.type && quizData.type !== 'quiz') {
          toast({
            title: 'Tipo incorreto',
            description: 'Este não é um quiz. Você foi redirecionado.',
            variant: 'destructive',
          })
          navigate('/quizzes')
          return
        }

        setQuiz(quizData)
      } catch (error) {
        console.error('Erro ao carregar quiz:', error)
        toast({
          title: 'Erro ao carregar quiz',
          description: 'Não foi possível carregar o quiz.',
          variant: 'destructive',
        })
        navigate('/quizzes')
      } finally {
        setIsLoading(false)
      }
    }

    loadQuiz()
  }, [quizId, navigate, toast])

  const handleAnswerSelect = (answer: string) => {
    if (!quiz?.questions[currentIndex]) return
    const questionId = quiz.questions[currentIndex].id
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleFinish = useCallback(async () => {
    if (!quiz || !user?.id) return

    try {
      const endTime = Date.now()
      const durationSeconds = Math.floor((endTime - startTime) / 1000)

      // Calcular pontuação
      let correctCount = 0
      quiz.questions.forEach((question) => {
        if (selectedAnswers[question.id] === question.correct_answer) {
          correctCount++
        }
      })

      const totalQuestions = quiz.questions.length
      const percentage = totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0

      console.log('📊 Quiz Results:', {
        quizId: quiz.id,
        totalQuestions,
        correctCount,
        percentage,
        durationSeconds
      })

      // Salvar tentativa no banco de dados
      const attemptId = await quizService.saveQuizAttempt(
        user.id,
        quiz.id,
        selectedAnswers,
        correctCount,
        durationSeconds
      )

      if (!attemptId) {
        toast({
          title: 'Erro ao salvar resultado',
          description: 'Não foi possível salvar seu resultado. Tente novamente.',
          variant: 'destructive',
        })
        return
      }

      // Adicionar pontuação XP e atualizar ranking
      await scoreQuizActivity(
        correctCount,
        totalQuestions,
        durationSeconds,
        quiz.id
      )

      console.log('✅ Quiz attempt saved:', attemptId)
      console.log('🏆 XP scored and ranking updated')

      // Navegar para página de resultados
      navigate(`/quiz/${quizId}/results`, {
        state: {
          attemptId,
          answers: selectedAnswers,
          quiz,
          correctCount,
          totalQuestions,
          percentage,
          durationSeconds
        },
      })
    } catch (error) {
      console.error('Erro ao finalizar quiz:', error)
      toast({
        title: 'Erro ao finalizar quiz',
        description: 'Ocorreu um erro ao salvar seus resultados.',
        variant: 'destructive',
      })
    }
  }, [quiz, user, selectedAnswers, startTime, navigate, quizId, scoreQuizActivity, toast])

  const handleNext = () => {
    if (!quiz) return

    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      handleFinish()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  if (isLoading) {
    return <SectionLoader />
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <MagicLayout title="Quiz não encontrado">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧩</div>
          <h2 className="text-2xl font-bold mb-2">Quiz não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O quiz que você está procurando não existe ou não possui questões.
          </p>
          <Button onClick={() => navigate('/quizzes')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar aos Quizzes
          </Button>
        </div>
      </MagicLayout>
    )
  }

  const questions = quiz.questions
  const progress = ((currentIndex + 1) / questions.length) * 100
  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const answeredCount = Object.keys(selectedAnswers).length

  return (
    <MagicLayout
      title={quiz.title}
      description={`Questão ${currentIndex + 1} de ${questions.length}`}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Quiz Header */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{quiz.title}</h1>
                  <p className="text-muted-foreground">
                    Questão {currentIndex + 1} de {questions.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Quiz</span>
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Progresso</h3>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} de {questions.length} questões
                </span>
              </div>
              <div className="space-y-2">
                <Progress
                  value={progress}
                  className="h-3 bg-muted/50"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progress.toFixed(0)}% concluído
                  </span>
                  <span className="font-medium text-primary">
                    {answeredCount} respondidas
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{answeredCount}</div>
                <div className="text-sm text-muted-foreground">Respondidas</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{questions.length - answeredCount}</div>
                <div className="text-sm text-muted-foreground">Restantes</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <Trophy className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{questions.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Question Area */}
        <div className={cn(
          "grid gap-6 transition-all",
          currentQuestion.reading_text ? "lg:grid-cols-2" : "grid-cols-1"
        )}>

          {/* Base Text Column (Only if exists) */}
          {currentQuestion.reading_text && (
            <MagicCard variant="glass" size="lg" className="h-full max-h-[600px] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10 w-full">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">{currentQuestion.reading_text.title || 'Texto de Apoio'}</h3>
                </div>
                <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.reading_text.content}
                </div>
              </div>
            </MagicCard>
          )}

          {/* Question Card */}
          <MagicCard variant="glass" size="lg" className="h-full">
            <div className="space-y-8">
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Questão {currentIndex + 1}</h2>
                </div>
              </div>

              {/* Question Text */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
                <p className="text-lg font-medium leading-relaxed">
                  {currentQuestion.question_text}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Selecione sua resposta:</h3>
                <RadioGroup
                  value={selectedAnswers[currentQuestion.id] || ''}
                  onValueChange={handleAnswerSelect}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={cn(
                        "group relative flex items-center space-x-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer",
                        "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10",
                        "hover:border-primary/30 hover:scale-[1.02] hover:shadow-lg",
                        "has-[:checked]:bg-gradient-to-r has-[:checked]:from-primary/10 has-[:checked]:to-primary/5",
                        "has-[:checked]:border-primary/50 has-[:checked]:shadow-primary/20"
                      )}
                    >
                      <RadioGroupItem
                        value={option}
                        id={`option-${index}`}
                        className="text-primary border-2"
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className="cursor-pointer flex-1 text-base font-medium group-hover:text-primary transition-colors"
                      >
                        {option}
                      </Label>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-2">
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all duration-300",
                        index === currentIndex
                          ? "bg-primary scale-125"
                          : selectedAnswers[questions[index].id]
                            ? "bg-green-500"
                            : "bg-muted/50"
                      )}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!selectedAnswers[currentQuestion.id]}
                  className={cn(
                    "bg-gradient-to-r from-primary to-primary/80",
                    !selectedAnswers[currentQuestion.id] && "opacity-50"
                  )}
                >
                  {isLastQuestion ? 'Finalizar' : 'Próxima'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </MagicCard>
        </div>
      </div>
    </MagicLayout>
  )
}
