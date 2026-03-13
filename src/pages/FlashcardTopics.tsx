import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn, getCategoryColor } from '@/lib/utils'
import { ArrowLeft, Brain, ChevronRight, Play } from 'lucide-react'
import { StudyModeDialog } from '@/components/flashcards/StudyModeDialog'
import {
  getSubjectById,
  getTopicsBySubjectId,
  type Subject,
  type TopicWithCardCount,
} from '@/services/flashcardService'
import { SectionLoader } from '@/components/SectionLoader'
import { logger } from '@/lib/logger'

export default function FlashcardTopicsPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<TopicWithCardCount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!subjectId) {
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [subjectData, topicsData] = await Promise.all([
          getSubjectById(subjectId),
          getTopicsBySubjectId(subjectId),
        ])
        setSubject(subjectData)
        setTopics(topicsData)
      } catch (error) {
        logger.error('Failed to fetch flashcard topics data', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [subjectId])

  if (isLoading) {
    return <SectionLoader />
  }

  if (!subject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matéria não encontrada</h1>
          <p className="text-sm text-muted-foreground mt-1">A matéria solicitada não foi encontrada</p>
        </div>
        <Button onClick={() => navigate('/flashcards')}>Voltar para Matérias</Button>
      </div>
    )
  }

  const handleStudyClick = (topicId: string) => {
    setSelectedTopicId(topicId)
    setIsModalOpen(true)
  }

  const totalCards = topics.reduce((sum, t) => sum + (t.flashcards?.[0]?.count || t.flashcardCount || 0), 0)

  return (
    <div className="space-y-6">
      {selectedTopicId && subjectId && (
        <StudyModeDialog
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          subjectId={subjectId}
          topicId={selectedTopicId}
        />
      )}

      {/* Back + Header */}
      <div>
        <Link
          to="/flashcards"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Matérias
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {topics.length} tópicos · {totalCards} cards disponíveis
        </p>
      </div>

      {/* Topics Accordion */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <Accordion type="multiple" defaultValue={topics.length > 0 ? [topics[0].id] : []} className="space-y-4">
            {topics.map((topic, idx) => {
              const cardCount = topic.flashcards?.[0]?.count || topic.flashcardCount || 0
              const colors = getCategoryColor(idx)

              return (
                <AccordionItem
                  value={topic.id}
                  key={topic.id}
                  className={cn('border rounded-xl overflow-hidden', colors.border)}
                >
                  <AccordionTrigger className="font-semibold px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <div className={cn('p-2 rounded-lg', colors.bg)}>
                          <span className={cn('text-sm font-bold', colors.text)}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-lg">{topic.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Brain className={cn('h-3.5 w-3.5', colors.text)} />
                            <span className="text-xs text-muted-foreground">
                              {cardCount} cards
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {topic.description || `Estude ${topic.name} com flashcards interativos e domine o conteúdo.`}
                      </p>
                      <button
                        onClick={() => handleStudyClick(topic.id)}
                        className={cn(
                          'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 text-white hover:shadow-md',
                          colors.btn
                        )}
                      >
                        <Play className="h-4 w-4" />
                        Estudar Agora
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
