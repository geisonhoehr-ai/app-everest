import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CheckCircle, Share2, XCircle, BookOpen, Trophy, Target, TrendingUp, Star } from 'lucide-react'
import { ShareResultsDialog } from '@/components/flashcards/ShareResultsDialog'
import {
  getFlashcardSessionDetails,
} from '@/services/flashcardService'

type FlashcardSession = {
  id: string
  cards_reviewed: number
  correct_answers: number
  incorrect_answers: number
  session_mode: string
  started_at: string
  ended_at: string
  topic_id: string
  user_id: string
  group_session_id: string
  topics: {
    id: string
    name: string
    description: string
    subjects: {
      id: string
      name: string
    }
  }
  topicTitle: string
  subjectId: string
  topicId: string
  totalCards: number
  correct: number
  incorrect: number
  details?: Array<{
    id: string
    question: string
    answer: string
    userAnswer: 'correct' | 'incorrect'
  }>
}
import { SectionLoader } from '@/components/SectionLoader'
import { MagicLayout } from '@/components/ui/magic-layout'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function FlashcardSessionResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<FlashcardSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isShareOpen, setIsShareOpen] = useState(false)

  useEffect(() => {
    if (sessionId) {
      logger.debug('🎯 Loading session result for:', sessionId)
      getFlashcardSessionDetails(sessionId)
        .then((data) => {
          if (!data) {
            logger.error('❌ No data returned for session:', sessionId)
            return
          }

          logger.debug('✅ Session data loaded:', {
            topicTitle: data.topics?.name,
            cardsReviewed: data.cards_reviewed,
            correct: data.correct_answers,
            incorrect: data.incorrect_answers
          })

          const transformedSession: FlashcardSession = {
            ...data,
            topicTitle: data.topics.name,
            subjectId: data.topics.subjects.id,
            topicId: data.topic_id,
            totalCards: data.cards_reviewed,
            correct: data.correct_answers,
            incorrect: data.incorrect_answers,
          }
          setSession(transformedSession)
        })
        .catch((error) => {
          logger.error('❌ Error loading session details:', error)
        })
        .finally(() => setIsLoading(false))
    }
  }, [sessionId])

  if (isLoading) {
    return <SectionLoader />
  }

  if (!session) {
    return <div>Sessão não encontrada.</div>
  }

  const percentage =
    session.totalCards > 0
      ? Math.round((session.correct / session.totalCards) * 100)
      : 0

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excepcional', color: 'text-purple-500', icon: Trophy }
    if (percentage >= 80) return { level: 'Excelente', color: 'text-green-500', icon: Star }
    if (percentage >= 70) return { level: 'Bom', color: 'text-blue-500', icon: Target }
    if (percentage >= 60) return { level: 'Regular', color: 'text-yellow-500', icon: TrendingUp }
    return { level: 'Precisa Melhorar', color: 'text-red-500', icon: Target }
  }

  const performance = getPerformanceLevel(percentage)
  const PerformanceIcon = performance.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ShareResultsDialog
          isOpen={isShareOpen}
          onOpenChange={setIsShareOpen}
          topicTitle={session.topicTitle}
          correct={session.correct}
          total={session.totalCards}
        />

        <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-6 mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium">Sessão Finalizada</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-slate-100">
            {percentage}%
          </h1>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <PerformanceIcon className={cn('h-6 w-6', performance.color)} />
              <span className={cn('text-xl font-bold', performance.color)}>
                {performance.level}
              </span>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400">{session.topicTitle}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{session.correct}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Acertos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center border border-red-200 dark:border-red-800">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{session.incorrect}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Erros</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{session.totalCards}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Visualization */}
        <Card className="bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Progresso da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-700 dark:text-slate-300">Precisão</span>
                <span className={performance.color}>{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{((session.correct / session.totalCards) * 100).toFixed(1)}%</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Taxa de Acerto</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{session.totalCards - session.incorrect}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Cards Dominados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Review */}
        {session.details && (
          <Card className="bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-lg mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Revisão Detalhada</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Analise cada flashcard e veja onde pode melhorar
                  </CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0">
                  {session.details.length} cards
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {session.details.map((card, index) => (
                  <AccordionItem
                    value={`item-${index}`}
                    key={card.id}
                    className="border rounded-lg px-4 data-[state=open]:bg-muted/50"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          card.userAnswer === 'correct'
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        )}>
                          {card.userAnswer === 'correct' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{card.question}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "mt-1 text-xs",
                              card.userAnswer === 'correct'
                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                : "bg-red-500/10 text-red-600 border-red-500/20"
                            )}
                          >
                            {card.userAnswer === 'correct' ? 'Acerto' : 'Erro'}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <div className="grid gap-4 p-4 bg-card rounded-lg border">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Pergunta</p>
                          <p className="text-sm">{card.question}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Resposta Correta</p>
                          <p className="text-sm font-medium">{card.answer}</p>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            card.userAnswer === 'correct' ? "bg-green-500" : "bg-red-500"
                          )} />
                          <span className="text-sm font-medium">
                            Seu resultado:
                            <span className={cn(
                              "ml-1",
                              card.userAnswer === 'correct' ? "text-green-600" : "text-red-600"
                            )}>
                              {card.userAnswer === 'correct' ? 'Correto' : 'Incorreto'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button
            size="lg"
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-lg dark:shadow-blue-500/25"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="mr-2 h-5 w-5" />
            Compartilhar Resultado
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            asChild
          >
            <Link to="/progresso/historico-flashcards">
              <BookOpen className="mr-2 h-5 w-5" />
              Ver Histórico
            </Link>
          </Button>
        </div>

        {/* Next Steps */}
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Continue Aprendendo</h3>
              <p className="text-slate-600 dark:text-slate-400">
                {percentage >= 80
                  ? "Excelente trabalho! Que tal tentar um novo tópico?"
                  : "Continue praticando para dominar este tópico!"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  asChild
                >
                  <Link to={`/flashcards/${session.subjectId}/${session.topicId}/study?mode=difficult_review`}>
                    Revisar Difíceis
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  asChild
                >
                  <Link to={`/flashcards/${session.subjectId}`}>
                    Escolher Novo Tópico
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
