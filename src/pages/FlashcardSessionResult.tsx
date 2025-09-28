import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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
import { CheckCircle, Share2, XCircle, BookOpen } from 'lucide-react'
import { ShareResultsDialog } from '@/components/flashcards/ShareResultsDialog'
import {
  getFlashcardSessionDetails,
  type FlashcardSession,
} from '@/services/flashcardService'
import { SectionLoader } from '@/components/SectionLoader'
import { cn } from '@/lib/utils'

export default function FlashcardSessionResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<FlashcardSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isShareOpen, setIsShareOpen] = useState(false)

  useEffect(() => {
    if (sessionId) {
      getFlashcardSessionDetails(sessionId)
        .then(setSession)
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

  return (
    <>
      <ShareResultsDialog
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        topicTitle={session.topicTitle}
        correct={session.correct}
        total={session.totalCards}
      />
      <div className="flex flex-col items-center gap-6 text-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl">Sessão Concluída!</CardTitle>
            <CardDescription>{session.topicTitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-lg">Seu desempenho foi de</p>
              <p className="text-6xl font-bold text-primary my-2">
                {percentage}%
              </p>
            </div>
            <div className="flex justify-around items-center pt-4 border-t">
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-muted-foreground">ACERTOS</p>
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-2xl font-bold">{session.correct}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-muted-foreground">ERROS</p>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-6 w-6" />
                  <span className="text-2xl font-bold">
                    {session.incorrect}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {session.details && (
          <Card className="w-full max-w-2xl text-left">
            <CardHeader>
              <CardTitle>Revisão da Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {session.details.map((card, index) => (
                  <AccordionItem value={`item-${index}`} key={card.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        {card.userAnswer === 'correct' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="truncate">{card.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>
                        <strong>Sua resposta:</strong>{' '}
                        <span
                          className={cn(
                            card.userAnswer === 'correct'
                              ? 'text-green-600'
                              : 'text-red-600',
                          )}
                        >
                          {card.userAnswer === 'correct'
                            ? 'Correta'
                            : 'Incorreta'}
                        </span>
                      </p>
                      <p>
                        <strong>Resposta correta:</strong> {card.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
          <Button
            size="lg"
            className="flex-1"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar Resultado
          </Button>
          <Button size="lg" variant="outline" className="flex-1" asChild>
            <Link to="/progresso/historico-flashcards">
              <BookOpen className="mr-2 h-4 w-4" />
              Ver Histórico
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}
