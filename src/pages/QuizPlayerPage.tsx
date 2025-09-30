import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { quizData } from '@/lib/data'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  HelpCircle,
  Trophy,
  Target,
  Brain,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function QuizPlayerPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()

  // Mock finding the quiz based on ID. In a real app, this would be a fetch.
  const topic = quizData[0].topics[0]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({})

  if (!topic) {
    return (
      <MagicLayout title="Quiz não encontrado">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧩</div>
          <h2 className="text-2xl font-bold mb-2">Quiz não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O quiz que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/quizzes')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar aos Quizzes
          </Button>
        </div>
      </MagicLayout>
    )
  }

  const { questions } = topic
  const progress = ((currentIndex + 1) / questions.length) * 100
  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      navigate(`/quiz/${quizId}/results`, {
        state: { answers: selectedAnswers, topic },
      })
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  return (
    <MagicLayout 
      title={topic.title}
      description={`Questão ${currentIndex + 1} de ${questions.length} • Teste seus conhecimentos`}
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
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {topic.title}
                  </h1>
                  <p className="text-muted-foreground">
                    Questão {currentIndex + 1} de {questions.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Quiz Interativo</span>
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Progresso do Quiz</h3>
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
                    {questions.length - currentIndex - 1} restantes
                  </span>
                </div>
              </div>
            </div>

            {/* Quiz Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{currentIndex}</div>
                <div className="text-sm text-muted-foreground">Respondidas</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">15min</div>
                <div className="text-sm text-muted-foreground">Tempo médio</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <Trophy className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">85%</div>
                <div className="text-sm text-muted-foreground">Taxa de acerto</div>
              </div>
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
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Questão {currentIndex + 1}</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sem limite de tempo</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
              <p className="text-lg font-medium leading-relaxed">
                {currentQuestion.question}
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
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
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
                        : index < currentIndex 
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
                  "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                  "text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg",
                  !selectedAnswers[currentQuestion.id] && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLastQuestion ? (
                  <>
                    <Trophy className="mr-2 h-4 w-4" />
                    Finalizar Quiz
                  </>
                ) : (
                  <>
                    Próxima
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
