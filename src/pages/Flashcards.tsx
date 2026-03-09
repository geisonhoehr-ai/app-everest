import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FlashcardsTutorial } from '@/components/flashcards/FlashcardsTutorial'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Play,
  ArrowRight,
  BookOpen,
  Brain,
  Lock,
  HelpCircle,
  PlusCircle,
  Target,
} from 'lucide-react'
import { getSubjectsWithProgress } from '@/services/subjectService'
import { SectionLoader } from '@/components/SectionLoader'
import { logger } from '@/lib/logger'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'

interface Subject {
  id: string
  name: string
  description: string
  image_url?: string
  topics?: Array<{
    id: string
    name: string
    flashcard_count?: number
  }>
  progress?: number
}

export default function FlashcardsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, isStudent, isAdmin, isTeacher } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [subjectList, setSubjectList] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('flashcards_tutorial_seen')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [])

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    localStorage.setItem('flashcards_tutorial_seen', 'true')
  }

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const subjects = await getSubjectsWithProgress(user?.id || null)
        setSubjectList(subjects)
      } catch (error) {
        logger.error('Error fetching subjects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubjects()
  }, [user?.id])

  if (permissionsLoading || isLoading) {
    return <SectionLoader />
  }

  if (isStudent && !hasFeature(FEATURE_KEYS.FLASHCARDS)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
          <p className="text-sm text-muted-foreground mt-1">Recurso bloqueado</p>
        </div>
        <Card className="border-border shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Recurso Bloqueado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              O sistema de flashcards não está disponível para sua turma. Entre em contato com seu professor ou administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalCards = subjectList.reduce(
    (total, subject) => total + (subject.topics?.reduce((sum, topic) => sum + (topic.flashcard_count || 0), 0) || 0),
    0,
  )
  const totalTopics = subjectList.reduce((total, subject) => total + (subject.topics?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Domine qualquer assunto com flashcards inteligentes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowTutorial(true)} className="gap-2 w-fit">
          <HelpCircle className="h-4 w-4" />
          Ajuda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{subjectList.length}</div>
            <div className="text-xs text-muted-foreground">Matérias</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 text-purple-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{totalTopics}</div>
            <div className="text-xs text-muted-foreground">Tópicos</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 text-center">
            <Brain className="h-5 w-5 text-green-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{totalCards}</div>
            <div className="text-xs text-muted-foreground">Cards</div>
          </CardContent>
        </Card>
      </div>

      {subjectList.length === 0 ? (
        <Card className="border-border shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhuma matéria encontrada</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Parece que não há flashcards disponíveis no momento.
            </p>
            {(isAdmin || isTeacher) && (
              <Button onClick={() => navigate('/admin/flashcards/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Primeiro Flashcard
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {subjectList
            .filter((s) => (s.topics?.reduce((sum, t) => sum + (t.flashcard_count || 0), 0) || 0) > 0)
            .map((subject) => {
            const subjectTopics = subject.topics?.length || 0
            const subjectCards = subject.topics?.reduce((sum, topic) => sum + (topic.flashcard_count || 0), 0) || 0
            const progress = subject.progress || 0

            return (
              <Link to={`/flashcards/${subject.id}`} key={subject.id} className="group block">
                <Card className="border-border shadow-sm overflow-hidden flex flex-col h-full transition-shadow duration-200 hover:shadow-md">
                  {/* Image */}
                  <div className="relative h-36 overflow-hidden bg-muted">
                    <img
                      src={
                        subject.name.toLowerCase().includes('português') ||
                        subject.name.toLowerCase().includes('portugues')
                          ? '/flashcard-cover.png'
                          : subject.image_url ||
                            `https://img.usecurling.com/p/600/300?q=${encodeURIComponent(subject.name)}`
                      }
                      alt={subject.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white text-lg font-bold line-clamp-1 drop-shadow">
                        {subject.name}
                      </h3>
                      <p className="text-white/80 text-xs line-clamp-1">
                        {subject.description || `Flashcards sobre ${subject.name}`}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="flex-1 flex flex-col p-4">
                    <div className="flex items-center justify-around gap-2 mb-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Target className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">{subjectTopics}</div>
                          <div className="text-xs text-muted-foreground">Tópicos</div>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Brain className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">{subjectCards}</div>
                          <div className="text-xs text-muted-foreground">Cards</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Progresso</span>
                        <span className={cn('text-xs font-semibold', progress === 100 ? 'text-green-600' : 'text-primary')}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    <Button className="w-full mt-auto" size="sm">
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Estudar Cards
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {showTutorial && <FlashcardsTutorial onClose={handleCloseTutorial} />}
    </div>
  )
}
