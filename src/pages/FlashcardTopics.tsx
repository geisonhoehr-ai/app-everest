import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Layers, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StudyModeDialog } from '@/components/flashcards/StudyModeDialog'
import {
  getSubjectById,
  getTopicsBySubjectId,
  type Subject,
  type TopicWithCardCount,
} from '@/services/flashcardService'
import { SectionLoader } from '@/components/SectionLoader'
import { useStaggeredAnimation, useCountAnimation } from '@/hooks/useAnimations'
import { cn } from '@/lib/utils'

// Separate component to fix hooks rule violation
interface TopicCardProps {
  topic: TopicWithCardCount
  index: number
  delay: number
  onStudyClick: (topicId: string) => void
}

const TopicCard = ({ topic, index, delay, onStudyClick }: TopicCardProps) => {
  const { count, startAnimation } = useCountAnimation(
    topic.flashcards[0]?.count || 0,
    1000
  )

  useEffect(() => {
    const timer = setTimeout(startAnimation, delay + 500)
    return () => clearTimeout(timer)
  }, [delay, startAnimation])

  return (
    <MagicCard
      key={topic.id}
      className="h-full flex flex-col"
      led
      ledColor={index % 4 === 0 ? 'cyan' : index % 4 === 1 ? 'purple' : index % 4 === 2 ? 'orange' : 'green'}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex-grow flex flex-col p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">
              {topic.name}
            </h3>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              {count} cards
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {topic.description || `Estude ${topic.name} com flashcards interativos`}
          </p>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">{count} flashcards</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">Ativo</span>
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => onStudyClick(topic.id)}
          className="w-full mt-4 text-sm py-2.5"
        >
          <Play className="h-4 w-4 mr-2" />
          Estudar Agora
        </Button>
      </div>
    </MagicCard>
  )
}

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
        console.error('Failed to fetch flashcard topics data', error)
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
      <div className="text-center">
        <h2 className="text-2xl font-bold">Matéria não encontrada</h2>
        <Button onClick={() => navigate('/flashcards')} className="mt-4">
          Voltar para Matérias
        </Button>
      </div>
    )
  }

  const handleStudyClick = (topicId: string) => {
    setSelectedTopicId(topicId)
    setIsModalOpen(true)
  }

  const delays = useStaggeredAnimation(topics.length, 100)

  return (
    <>
      {selectedTopicId && subjectId && (
        <StudyModeDialog
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          subjectId={subjectId}
          topicId={selectedTopicId}
        />
      )}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 animate-fade-in-up">
          <Button 
            variant="outline" 
            size="icon" 
            asChild
            className="group transition-all duration-300 hover:bg-primary/5"
          >
            <Link to="/flashcards">
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            </Link>
          </Button>
          <div>
            <h1 className={cn(
              "text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent",
              "animate-fade-in-up animation-delay-200"
            )}>
              {subject.name}
            </h1>
            <p className="text-muted-foreground animate-fade-in-up animation-delay-300">
              Selecione um tópico para começar a estudar.
            </p>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {topics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              index={index}
              delay={delays[index].delay}
              onStudyClick={handleStudyClick}
            />
          ))}
        </div>
      </div>
    </>
  )
}
