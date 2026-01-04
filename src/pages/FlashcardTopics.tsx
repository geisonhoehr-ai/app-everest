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
import { useStaggeredAnimation } from '@/hooks/useAnimations'
import { cn } from '@/lib/utils'

// Separate component to fix hooks rule violation
interface TopicCardProps {
  topic: TopicWithCardCount
  index: number
  delay: number
  onStudyClick: (topicId: string) => void
}

const TopicCard = ({ topic, index, delay, onStudyClick }: TopicCardProps) => {
  const cardCount = topic.flashcards?.[0]?.count || topic.flashcardCount || 0
  const [animatedCount, setAnimatedCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0
      const increment = cardCount / 50 // 50 steps for smooth animation
      const interval = setInterval(() => {
        current += increment
        if (current >= cardCount) {
          setAnimatedCount(cardCount)
          clearInterval(interval)
        } else {
          setAnimatedCount(Math.floor(current))
        }
      }, 20) // 20ms intervals for smooth animation

      return () => clearInterval(interval)
    }, delay + 500)

    return () => clearTimeout(timer)
  }, [cardCount, delay])

  return (
    <MagicCard
      key={topic.id}
      className="flex flex-col h-full bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
      led
      ledColor={index % 4 === 0 ? 'cyan' : index % 4 === 1 ? 'purple' : index % 4 === 2 ? 'orange' : 'green'}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-col h-full p-6">
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight min-h-[3rem] flex items-center">
              {topic.name}
            </h3>
            <Badge variant="outline" className="w-fit bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs">
              {animatedCount} cards
            </Badge>
          </div>

          <p className="text-[13px] text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed min-h-[4rem]">
            {topic.description || `Estude ${topic.name} com flashcards interativos`}
          </p>

          <div className="flex items-center gap-4 text-xs pt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">{animatedCount} flashcards</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Ativo</span>
            </div>
          </div>
        </div>

        {/* Button sempre na parte inferior com margem segura */}
        <div className="pt-6 mt-auto">
          <Button
            onClick={() => onStudyClick(topic.id)}
            className="w-full text-sm py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-lg dark:shadow-blue-500/25 transition-transform active:scale-95"
          >
            <Play className="h-4 w-4 mr-2" />
            Estudar Agora
          </Button>
        </div>
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

  const delays = useStaggeredAnimation(Math.max(topics.length, 1), 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
              className="group transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
            >
              <Link to="/flashcards">
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              </Link>
            </Button>
            <div>
              <h1 className={cn(
                "text-3xl font-bold text-slate-900 dark:text-slate-100",
                "animate-fade-in-up animation-delay-200"
              )}>
                {subject.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 animate-fade-in-up animation-delay-300">
                Selecione um tópico para começar a estudar.
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {topics.map((topic, index) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                index={index}
                delay={delays[index]?.delay || 0}
                onStudyClick={handleStudyClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
