import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Layers, Play } from 'lucide-react'
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
          Selecione um tópico para começar a estudar
        </p>
      </div>

      {/* Topics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => {
          const cardCount = topic.flashcards?.[0]?.count || topic.flashcardCount || 0

          return (
            <Card key={topic.id} className="border-border shadow-sm flex flex-col h-full transition-shadow duration-200 hover:shadow-md">
              <CardContent className="flex flex-col h-full p-5">
                <div className="flex-1 space-y-3">
                  <h3 className="text-base font-semibold text-foreground line-clamp-2 leading-tight">
                    {topic.name}
                  </h3>
                  <Badge variant="outline" className="w-fit text-xs">
                    {cardCount} cards
                  </Badge>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {topic.description || `Estude ${topic.name} com flashcards interativos`}
                  </p>
                </div>

                <div className="pt-4 mt-auto">
                  <Button onClick={() => handleStudyClick(topic.id)} className="w-full" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Estudar Agora
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
