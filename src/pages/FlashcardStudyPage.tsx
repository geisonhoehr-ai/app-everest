import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ChevronLeft,
  Star,
  Link as LinkIcon,
  Expand,
  Settings,
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

type SessionResult = { cardId: string; result: 'correct' | 'incorrect' }

const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)
  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen().catch(console.error)
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

  const studyMode = searchParams.get('mode') || 'full'
  const cardCountParam = searchParams.get('count')

  const [topicData, setTopicData] = useState<TopicWithSubjectAndCards | null>(
    null,
  )
  const [studyDeck, setStudyDeck] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])

  useEffect(() => {
    if (!topicId || !subjectId) return

    setIsLoading(true)

    const fetchAndSetDeck = async () => {
      try {
        let fetchedCards: Flashcard[] = []
        if (studyMode === 'difficult_review') {
          fetchedCards = await getDifficultFlashcardsForTopic(topicId)
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
      } catch (error) {
        console.error('Failed to fetch study deck', error)
        toast({ title: 'Erro ao carregar cards', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAndSetDeck()
  }, [topicId, studyMode, cardCountParam, subjectId, navigate, toast])

  const finishSession = async () => {
    if (!topicData) return

    const correct = sessionResults.filter((r) => r.result === 'correct').length
    const incorrect = sessionResults.length - correct

    const sessionPayload: SaveSessionPayload = {
      topicId: topicData.id,
      mode: studyMode,
      totalCards: studyDeck.length,
      correct,
      incorrect,
    }

    const sessionId = await saveFlashcardSession(sessionPayload)
    navigate(`/flashcards/session/${sessionId}/result`)
  }

  const handleNext = () => {
    setIsFlipped(false)
    if (currentIndex < studyDeck.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      finishSession()
    }
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0))
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        setIsFlipped((f) => !f)
      }
      if (event.code === 'ArrowRight') handleNext()
      if (event.code === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, studyDeck])

  if (isLoading) {
    return <SectionLoader />
  }

  if (!topicData || studyDeck.length === 0) {
    return <div>Sessão de estudo não encontrada ou vazia.</div>
  }

  const currentCard = studyDeck[currentIndex]
  const progress = ((currentIndex + 1) / studyDeck.length) * 100

  const handleFlip = () => setIsFlipped(!isFlipped)

  const handleAnswer = async (quality: number) => {
    if (!isFlipped) {
      toast({
        title: 'Vire o card primeiro!',
        description: 'Veja a resposta antes de avaliar seu conhecimento.',
        variant: 'destructive',
      })
      return
    }
    try {
      await updateFlashcardProgress(currentCard.id, quality)
      const result: 'correct' | 'incorrect' =
        quality <= 2 ? 'incorrect' : 'correct'
      setSessionResults((prev) => [...prev, { cardId: currentCard.id, result }])
    } catch (error) {
      toast({
        title: 'Erro ao salvar progresso',
        variant: 'destructive',
      })
    }
    setTimeout(handleNext, 200)
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast({
      title: isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
    })
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 p-4 md:p-8 h-screen bg-background',
        isFullscreen && 'fixed inset-0 z-50',
      )}
    >
      <div className="w-full max-w-4xl flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate(`/flashcards/${subjectId}`)}
          className="self-start"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Sair da Sessão
        </Button>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                  <Expand className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tela Cheia</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configurações</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="w-full max-w-2xl flex-grow flex flex-col justify-center">
        <div className="relative">
          <div className="w-full h-80 perspective-1000" onClick={handleFlip}>
            <div
              className={cn(
                'relative w-full h-full transition-transform duration-700 transform-style-preserve-3d',
                { 'rotate-y-180': isFlipped },
              )}
            >
              <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-6">
                <CardContent className="text-2xl md:text-3xl font-semibold text-center">
                  {currentCard.question}
                </CardContent>
              </Card>
              <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 bg-muted">
                <CardContent className="text-xl md:text-2xl text-center flex-grow flex items-center justify-center">
                  {currentCard.answer}
                </CardContent>
                {currentCard.explanation && isFlipped && (
                  <div className="text-sm text-muted-foreground mt-4 border-t pt-4 w-full text-center">
                    <p>{currentCard.explanation}</p>
                  </div>
                )}
                {currentCard.external_resource_url && isFlipped && (
                  <div className="w-full pt-4 mt-4 border-t">
                    <Button asChild variant="outline" className="w-full">
                      <a
                        href={currentCard.external_resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Acessar Recurso
                      </a>
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full"
            onClick={toggleFavorite}
          >
            <Star
              className={cn(
                'h-5 w-5 text-muted-foreground',
                isFavorite && 'fill-yellow-400 text-yellow-400',
              )}
            />
          </Button>
        </div>
        <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
          <RotateCw className="mr-2 h-4 w-4" />
          Clique no card para virar ou use a barra de espaço
        </div>
      </div>
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {isFlipped ? (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
              onClick={() => handleAnswer(1)}
            >
              Difícil
            </Button>
            <Button
              variant="outline"
              className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900"
              onClick={() => handleAnswer(3)}
            >
              Médio
            </Button>
            <Button
              variant="outline"
              className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900"
              onClick={() => handleAnswer(5)}
            >
              Fácil
            </Button>
          </div>
        ) : (
          <div className="h-[40px]" />
        )}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-grow text-center">
            <p className="font-medium">
              {currentIndex + 1} / {studyDeck.length}
            </p>
            <Progress value={progress} className="mt-1" />
          </div>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
