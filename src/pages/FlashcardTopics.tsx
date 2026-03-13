import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
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

      {/* Topics Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, idx) => {
          const cardCount = topic.flashcards?.[0]?.count || topic.flashcardCount || 0
          const colors = getCategoryColor(idx)

          return (
            <div
              key={topic.id}
              className={cn(
                'group relative flex flex-col rounded-xl border bg-card p-5 transition-all duration-200 shadow-sm hover:shadow-lg',
                colors.border, colors.hoverBorder
              )}
            >
              {/* Badge flutuante */}
              <div className={cn('absolute -top-3 left-4 inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white', colors.badge)}>
                Tópico {idx + 1}
              </div>

              {/* Título */}
              <h3 className="mt-2 font-semibold text-foreground leading-snug line-clamp-2">
                {topic.name}
              </h3>

              {/* Info */}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Brain className={cn('h-3.5 w-3.5', colors.text)} />
                <span>{cardCount} cards disponíveis</span>
              </div>

              {/* Descrição */}
              <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-2">
                {topic.description || `Estude ${topic.name} com flashcards interativos`}
              </p>

              {/* Botão */}
              <button
                onClick={() => handleStudyClick(topic.id)}
                className={cn(
                  'mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 text-white hover:shadow-md',
                  colors.btn
                )}
              >
                <Play className="h-4 w-4" />
                Estudar Agora
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
