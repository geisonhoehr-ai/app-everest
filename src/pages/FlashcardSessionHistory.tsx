import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { logger } from '@/lib/logger'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Calendar, TrendingUp, BookOpen, Clock, Trophy, Target, Star, Zap } from 'lucide-react'
import {
  getFlashcardSessionHistory,
  type FlashcardSession,
} from '@/services/flashcardService'
import { SectionLoader } from '@/components/SectionLoader'
import { MagicLayout } from '@/components/ui/magic-layout'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-provider'

const getModeDetails = (mode: string) => {
  switch (mode) {
    case 'full':
      return { name: 'Sessão Completa', icon: BookOpen, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
    case 'difficult_review':
      return { name: 'Revisão Difíceis', icon: Target, color: 'bg-red-500/10 text-red-600 border-red-500/20' }
    case 'lightning':
      return { name: 'Relâmpago', icon: Zap, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' }
    case 'test':
      return { name: 'Modo Teste', icon: Clock, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' }
    case 'free':
      return { name: 'Estudo Livre', icon: Star, color: 'bg-green-500/10 text-green-600 border-green-500/20' }
    default:
      return { name: mode, icon: BookOpen, color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' }
  }
}

const getPerformanceColor = (percentage: number) => {
  if (percentage >= 90) return 'text-purple-500'
  if (percentage >= 80) return 'text-green-500'
  if (percentage >= 70) return 'text-blue-500'
  if (percentage >= 60) return 'text-yellow-500'
  return 'text-red-500'
}

export default function FlashcardSessionHistoryPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState<FlashcardSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      logger.debug('⚠️ No user ID, skipping history fetch')
      setIsLoading(false)
      return
    }

    logger.debug('📜 Fetching flashcard session history for user:', user.id)
    getFlashcardSessionHistory(user.id)
      .then((data) => {
        logger.debug('✅ History loaded:', data.length, 'sessions')
        data.forEach((session, idx) => {
          logger.debug(`  Session ${idx + 1}: ${session.topicTitle} - ${session.correct}/${session.totalCards}`)
        })
        setHistory(data)
      })
      .catch((error) => {
        logger.error('❌ Error loading history:', error)
      })
      .finally(() => setIsLoading(false))
  }, [user?.id])

  if (isLoading) {
    return <SectionLoader />
  }

  // Calculate stats
  const totalSessions = history.length
  const totalCards = history.reduce((sum, session) => sum + session.totalCards, 0)
  const totalCorrect = history.reduce((sum, session) => sum + session.correct, 0)
  const averageAccuracy = totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0

  return (
    <MagicLayout
      title="Histórico de Sessões"
      description="Acompanhe seu progresso e desempenho em todas as sessões de flashcards"
    >
      <div className="space-y-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in-up">
          <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-cyan-500/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-primary">{totalSessions}</p>
                <p className="text-sm text-muted-foreground">Sessões Realizadas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-green-500">{averageAccuracy}%</p>
                <p className="text-sm text-muted-foreground">Precisão Média</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-purple-500/10 border-blue-500/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-blue-500">{totalCards}</p>
                <p className="text-sm text-muted-foreground">Total de Cards</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Histórico Detalhado
                </CardTitle>
                <CardDescription>
                  Revise seu desempenho em sessões de estudo anteriores
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {totalSessions} sessões
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/20 via-purple-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Nenhuma sessão encontrada</h3>
                <p className="text-muted-foreground mb-6">
                  Você ainda não realizou nenhuma sessão de flashcards.
                </p>
                <Button asChild>
                  <Link to="/flashcards">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Começar a Estudar
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((session, index) => {
                  const percentage = Math.round((session.correct / session.totalCards) * 100)
                  const modeDetails = getModeDetails(session.mode)
                  const ModeIcon = modeDetails.icon

                  return (
                    <div
                      key={session.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${300 + index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{session.topicTitle}</h3>
                              <p className="text-sm text-muted-foreground">{session.subjectName}</p>
                            </div>
                            <div className="text-right">
                              <p className={cn('text-2xl font-bold', getPerformanceColor(percentage))}>
                                {percentage}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {session.correct}/{session.totalCards}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className={modeDetails.color}>
                              <ModeIcon className="mr-1 h-3 w-3" />
                              {modeDetails.name}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(session.date), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progresso</span>
                              <span className={getPerformanceColor(percentage)}>{percentage}%</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        </div>

                        <div className="ml-6">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/flashcards/session/${session.id}/result`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MagicLayout>
  )
}
