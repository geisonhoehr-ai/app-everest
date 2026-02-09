import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { useAuth } from '@/contexts/auth-provider'
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ChevronLeft,
  Star,
  Link as LinkIcon,
  Expand,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Share2,
  Eye,
  EyeOff,
  Brain,
  Target,
  Zap,
  BookOpen,
  TrendingUp
} from 'lucide-react'
import {
  getTopicWithCards,
  saveFlashcardSession,
  updateFlashcardProgress,
  getDifficultFlashcardsForTopic,
  type Flashcard,
  type TopicWithSubjectAndCards,
  type SaveSessionPayload,
} from '@/services/flashcardService'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SectionLoader } from '@/components/SectionLoader'
import { useActivityScoring } from '@/hooks/useAchievements'
import { LevelBadge } from '@/components/gamification/LevelBadge'
import { FlashcardInstructionsDialog } from '@/components/flashcards/FlashcardInstructionsDialog'
import { logger } from '@/lib/logger'

type SessionResult = { cardId: string; result: 'correct' | 'incorrect' }
type StudyState = 'question' | 'answer' | 'result'

const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)
  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => logger.error('Fullscreen error:', err))
    } else {
      document.exitFullscreen().catch((err) => logger.error('Exit fullscreen error:', err))
    }
  }
  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])
  return { isFullscreen, toggle: toggle }
}

export default function FlashcardStudyPage() {
  const { subjectId, topicId } = useParams<{
    subjectId: string
    topicId: string
  }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const { user } = useAuth()
  const { scoreFlashcardActivity } = useActivityScoring()

  const studyMode = searchParams.get('mode') || 'full'
  const cardCountParam = searchParams.get('count')

  const [topicData, setTopicData] = useState<TopicWithSubjectAndCards | null>(
    null,
  )
  const [studyDeck, setStudyDeck] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [studyState, setStudyState] = useState<StudyState>('question')
  const [isFavorite, setIsFavorite] = useState(false)
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const [cardTransition, setCardTransition] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<'correct' | 'incorrect' | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)

  // useRef para evitar stale closure bug
  const sessionResultsRef = useRef<SessionResult[]>([])

  // Manter ref sincronizada com state
  useEffect(() => {
    sessionResultsRef.current = sessionResults
  }, [sessionResults])

  useEffect(() => {
    if (!topicId || !subjectId) return

    setIsLoading(true)

    const fetchAndSetDeck = async () => {
      try {
        let fetchedCards: Flashcard[] = []
        if (studyMode === 'difficult_review') {
          if (!user?.id) {
            throw new Error('Usuário não autenticado')
          }
          fetchedCards = await getDifficultFlashcardsForTopic(user.id, topicId)
          if (fetchedCards.length === 0) {
            toast({
              title: 'Nenhum card difícil!',
              description:
                'Você não marcou nenhum card como difícil neste tópico. Continue estudando!',
            })
            navigate(`/flashcards/${subjectId}`)
            return
          }
        } else {
          const data = await getTopicWithCards(topicId)
          if (data) {
            setTopicData(data)
            fetchedCards = data.flashcards
          }
        }

        let deck = [...fetchedCards].sort(() => 0.5 - Math.random())
        if (
          cardCountParam &&
          cardCountParam !== 'all' &&
          studyMode !== 'difficult_review'
        ) {
          const count = parseInt(cardCountParam, 10)
          if (count > 0 && count < deck.length) {
            deck = deck.slice(0, count)
          }
        }
        setStudyDeck(deck)
        setCurrentIndex(0)
        setSessionResults([])
        setStudyState('question')
        setShowAnswer(false)
        setLastAnswer(null)
      } catch (error) {
        logger.error('Failed to fetch study deck:', error)
        toast({ title: 'Erro ao carregar cards', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAndSetDeck()
  }, [topicId, studyMode, cardCountParam, subjectId, navigate, toast, user])

  const finishSession = useCallback(async () => {
    if (!topicData || !user?.id) return

    // 🔧 FIX: Usar sessionResultsRef.current para evitar stale closure
    const results = sessionResultsRef.current
    const correct = results.filter((r) => r.result === 'correct').length
    const incorrect = results.length - correct

    logger.debug('✅ Finishing session with results:', {
      results,
      total: results.length,
      correct,
      incorrect,
      deckLength: studyDeck.length
    })

    const sessionPayload: SaveSessionPayload = {
      topicId: topicData.id,
      sessionMode: studyMode,
      cardsReviewed: results.length, // ✅ Agora sempre terá o valor correto (10)
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      durationSeconds: 0, // TODO: Track actual duration
    }

    logger.debug('💾 Saving session payload:', sessionPayload)

    const sessionId = await saveFlashcardSession(user.id, sessionPayload)

    if (!sessionId) {
      logger.error('❌ Failed to save session')
      toast({
        title: 'Erro ao salvar sessão',
        description: 'Não foi possível salvar o resultado da sessão.',
        variant: 'destructive',
      })
      navigate(`/flashcards/${subjectId}`)
      return
    }

    logger.success('✅ Session saved successfully:', sessionId)

    // Adicionar pontuação baseada na performance
    await scoreFlashcardActivity(correct, studyDeck.length, sessionId)

    navigate(`/flashcards/session/${sessionId}/result`)
  }, [topicData, user, studyMode, studyDeck.length, navigate, scoreFlashcardActivity, toast, subjectId])

  const handleNext = useCallback(() => {
    setCardTransition(true)
    setShowAnswer(false)
    setLastAnswer(null)

    setTimeout(() => {
      if (currentIndex < studyDeck.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setStudyState('question')
      } else {
        finishSession()
      }
      setCardTransition(false)
    }, 300)
  }, [currentIndex, studyDeck.length, finishSession])

  const handlePrev = useCallback(() => {
    setCardTransition(true)
    setShowAnswer(false)
    setLastAnswer(null)

    setTimeout(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0))
      setStudyState('question')
      setCardTransition(false)
    }, 300)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        if (studyState === 'question') {
          setShowAnswer(true)
          setStudyState('answer')
        } else if (studyState === 'answer') {
          setShowAnswer(false)
          setStudyState('question')
        }
      }
      if (event.code === 'ArrowRight') handleNext()
      if (event.code === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [studyState, currentIndex, studyDeck, handleNext, handlePrev])

  if (isLoading) {
    return <SectionLoader />
  }

  if (!topicData || studyDeck.length === 0) {
    return <div>Sessão de estudo não encontrada ou vazia.</div>
  }

  const currentCard = studyDeck[currentIndex]
  const progress = ((currentIndex + 1) / studyDeck.length) * 100

  const handleShowAnswer = () => {
    setShowAnswer(true)
    setStudyState('answer')
  }

  const handleAnswer = async (quality: number) => {
    if (studyState !== 'answer') {
      toast({
        title: 'Veja a resposta primeiro!',
        description: 'Clique em "Mostrar Resposta" antes de avaliar.',
        variant: 'destructive',
      })
      return
    }
    
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }
      
      await updateFlashcardProgress(user.id, currentCard.id, quality)
      const result: 'correct' | 'incorrect' =
        quality <= 2 ? 'incorrect' : 'correct'

      const newResult = { cardId: currentCard.id, result }

      logger.debug('💯 Answer recorded:', {
        cardId: currentCard.id,
        quality,
        result,
        cardIndex: currentIndex,
        currentResultsCount: sessionResultsRef.current.length,
        newResultsCount: sessionResultsRef.current.length + 1
      })

      setSessionResults((prev) => {
        const updated = [...prev, newResult]
        logger.debug('📊 Session results updated:', {
          previousCount: prev.length,
          newCount: updated.length,
          totalCards: studyDeck.length
        })
        return updated
      })
      setLastAnswer(result)
      
      // Mostrar feedback visual
      if (result === 'correct') {
        toast({
          title: 'Correto! 🎉',
          description: 'Parabéns! Continue assim!',
        })
      } else {
        toast({
          title: 'Continue tentando! 💪',
          description: 'Não desista, você vai conseguir!',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro ao salvar progresso',
        variant: 'destructive',
      })
    }
    
    setTimeout(handleNext, 1500)
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast({
      title: isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
    })
  }

  return (
    <>
      <FlashcardInstructionsDialog
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      <MagicLayout 
      title={topicData?.name || 'Estudo de Flashcards'}
      description={`${topicData?.subject?.name} • Card ${currentIndex + 1} de ${studyDeck.length}`}
      showHeader={false}
    >
      <div className={cn(
        'max-w-7xl mx-auto space-y-8',
        isFullscreen && 'fixed inset-0 z-50 bg-background p-6'
      )}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/flashcards/${subjectId}`)}
            className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors duration-300"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> 
            Voltar aos Tópicos
          </Button>
          
          <LevelBadge variant="compact" />
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {topicData?.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {topicData?.subject?.name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={toggleFullscreen}
                      className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors duration-300"
                    >
                      <Expand className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tela Cheia</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors duration-300"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configurações</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Progresso da Sessão</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {currentIndex + 1} de {studyDeck.length}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Progress value={progress} className="h-3 bg-muted/50" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {progress.toFixed(0)}% concluído
                </span>
                <span className="font-medium text-primary">
                  {studyDeck.length - currentIndex - 1} restantes
                </span>
              </div>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {sessionResults.filter(r => r.result === 'correct').length}
                </div>
                <div className="text-sm text-muted-foreground">Corretas</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
                <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {sessionResults.filter(r => r.result === 'incorrect').length}
                </div>
                <div className="text-sm text-muted-foreground">Incorretas</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">5min</div>
                <div className="text-sm text-muted-foreground">Tempo</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Main Study Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Flashcard */}
          <div className="lg:col-span-2">
            <MagicCard 
              variant="glass" 
              size="lg" 
              className={cn(
                "h-96 transition-all duration-500",
                cardTransition && "scale-95 opacity-50",
                lastAnswer === 'correct' && "ring-2 ring-green-500/50 bg-green-50/50 dark:bg-green-950/20",
                lastAnswer === 'incorrect' && "ring-2 ring-red-500/50 bg-red-50/50 dark:bg-red-950/20"
              )}
            >
              <div className="h-full flex flex-col p-8">
                {studyState === 'question' ? (
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <Badge className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20 text-blue-600">
                        Pergunta
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFavorite}
                        className="hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors"
                      >
                        <Star
                          className={cn(
                            'h-5 w-5 text-muted-foreground transition-colors',
                            isFavorite && 'fill-yellow-400 text-yellow-400',
                          )}
                        />
                      </Button>
                    </div>
                    
                    <div className="flex-grow flex items-center justify-center">
                      <h2 className="text-2xl md:text-3xl font-bold text-center leading-relaxed bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        {currentCard.question}
                      </h2>
                    </div>
                    
                    <div className="mt-6">
                      <Button 
                        onClick={handleShowAnswer}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 rounded-xl transition-transform duration-300 hover:scale-105 hover:shadow-lg inline-flex items-center justify-center"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Mostrar Resposta
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <Badge className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20 text-green-600">
                        Resposta
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFavorite}
                        className="hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors"
                      >
                        <Star
                          className={cn(
                            'h-5 w-5 text-muted-foreground transition-colors',
                            isFavorite && 'fill-yellow-400 text-yellow-400',
                          )}
                        />
                      </Button>
                    </div>
                    
                    <div className="flex-grow flex items-center justify-center mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold text-center leading-relaxed bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        {currentCard.answer}
                      </h2>
                    </div>
                    
                    {currentCard.explanation && (
                      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                          Explicação:
                        </h3>
                        <p className="text-sm">
                          {currentCard.explanation}
                        </p>
                      </div>
                    )}
                    
                    {currentCard.external_resource_url && (
                      <div className="mb-6">
                        <Button 
                          asChild 
                          variant="outline" 
                          className="w-full bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors duration-300"
                        >
                          <a
                            href={currentCard.external_resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Acessar Recurso Externo
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </MagicCard>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {studyState === 'answer' && (
              <MagicCard variant="premium" size="lg">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Como você se saiu?</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleAnswer(1)}
                      className="w-full bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/20 text-red-600 hover:from-red-500/20 hover:to-red-600/20 transition-colors duration-300"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Difícil
                    </Button>
                    <Button
                      onClick={() => handleAnswer(3)}
                      className="w-full bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/20 text-yellow-600 hover:from-yellow-500/20 hover:to-yellow-600/20 transition-colors duration-300"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Médio
                    </Button>
                    <Button
                      onClick={() => handleAnswer(5)}
                      className="w-full bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20 text-green-600 hover:from-green-500/20 hover:to-green-600/20 transition-colors duration-300"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Fácil
                    </Button>
                  </div>
                </div>
              </MagicCard>
            )}

            {/* Navigation */}
            <MagicCard variant="glass" size="lg">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Navegação</h3>
                </div>
                
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="w-full bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors duration-300"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    className="w-full bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors duration-300"
                  >
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RotateCw className="h-4 w-4" />
                    <span>Use a barra de espaço para alternar entre pergunta e resposta</span>
                  </div>
                </div>
              </div>
            </MagicCard>
          </div>
        </div>
      </div>
    </MagicLayout>
    </>
  )
}
