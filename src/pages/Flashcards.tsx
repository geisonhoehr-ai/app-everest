import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStaggeredAnimation } from '@/hooks/useAnimations'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { FlashcardsTutorial } from '@/components/flashcards/FlashcardsTutorial'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Play,
  ArrowRight,
  BookOpen,
  Brain,
  Star,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Award,
  Users,
  Lock,
  HelpCircle,
  PlusCircle
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

  // Se for aluno e não tiver permissão, mostra página bloqueada
  if (isStudent && !hasFeature(FEATURE_KEYS.FLASHCARDS)) {
    return (
      <MagicLayout
        title="Flashcards"
        description="Sistema de flashcards bloqueado"
      >
        <MagicCard variant="glass" size="lg" className="text-center py-24">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Recurso Bloqueado
            </h3>
            <p className="text-muted-foreground mb-8">
              O sistema de flashcards não está disponível para sua turma. Entre em contato com seu professor ou administrador para mais informações.
            </p>
          </div>
        </MagicCard>
      </MagicLayout>
    )
  }

  const delays = useStaggeredAnimation(subjectList.length, 100)

  return (
    <MagicLayout
      title="Flashcards"
      description="Domine qualquer assunto com nossos flashcards inteligentes e interativos"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Sistema de Flashcards
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                    Domine qualquer assunto com nossos flashcards inteligentes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTutorial(true)}
                  className="gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden md:inline">Ajuda</span>
                </Button>
                <div className="hidden md:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <Star className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  <span className="text-xs md:text-sm font-medium">Sistema Inteligente</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">{subjectList.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Matérias</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Brain className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {subjectList.reduce((total, subject) =>
                    total + (subject.topics?.reduce((sum, topic) => sum + (topic.flashcard_count || 0), 0) || 0), 0)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Cards</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <Target className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">
                  {subjectList.reduce((total, subject) => total + (subject.topics?.length || 0), 0)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Tópicos</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">-</div>
                <div className="text-xs md:text-sm text-muted-foreground">Eficácia</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {subjectList.length === 0 ? (
          <MagicCard variant="glass" size="lg" className="text-center py-24">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Nenhuma matéria encontrada
              </h3>
              <p className="text-muted-foreground mb-8">
                Parece que não há flashcards disponíveis no momento. Que tal criar um novo?
              </p>
              <Button
                onClick={() => {
                  if (isAdmin || isTeacher) {
                    navigate('/admin/flashcards/new')
                  } else {
                    toast({
                      title: 'Acesso Restrito',
                      description: 'Apenas professores e administradores podem criar novos flashcards.',
                      variant: 'default',
                    })
                  }
                }}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 rounded-2xl font-medium transition-transform duration-300 hover:scale-105 hover:shadow-lg inline-flex items-center justify-center"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Criar Primeiro Flashcard
              </Button>
            </div>
          </MagicCard>
        ) : (
          <div className="space-y-8">
            {/* Category Header */}
            <MagicCard variant="glass" size="lg">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Matérias de Flashcards</h2>
                  <p className="text-muted-foreground">
                    {subjectList.length} matérias disponíveis
                  </p>
                </div>
              </div>
            </MagicCard>

            {/* Subjects Grid */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {subjectList
                .filter(subject => !subject.name.includes('Regulamentos Militares'))
                .map((subject, index) => {
                  const totalTopics = subject.topics?.length || 0
                  const totalFlashcards = subject.topics?.reduce((sum, topic) => sum + (topic.flashcard_count || 0), 0) || 0
                  const progress = subject.progress || 0

                  return (
                    <Link
                      to={`/flashcards/${subject.id}`}
                      key={subject.id}
                      className="group block"
                    >
                      <MagicCard
                        variant="premium"
                        size="lg"
                        className="flex flex-col overflow-hidden transition-colors duration-300 hover:scale-[1.02] hover:shadow-2xl h-full"
                        style={{ animationDelay: `${delays[index]}ms` }}
                      >
                        {/* Image Header - Reduzida e mais proporcionada */}
                        <div className="relative h-36 sm:h-40 overflow-hidden">
                          <img
                            src={
                              subject.name.toLowerCase().includes('português') ||
                                subject.name.toLowerCase().includes('portugues')
                                ? '/flashcard-cover.png'
                                : subject.image_url ||
                                `https://img.usecurling.com/p/600/300?q=${encodeURIComponent(
                                  subject.name,
                                )}`
                            }
                            alt={subject.name}
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                          />

                          {/* Overlay com gradiente mais suave */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                          {/* Progress Badge - Mais discreto */}
                          <div className="absolute top-3 right-3">
                            <div className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm shadow-lg">
                              <span className="text-xs font-bold text-gray-900">{Math.round(progress)}%</span>
                            </div>
                          </div>

                          {/* Title - Mais limpo */}
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white text-lg font-bold mb-0.5 drop-shadow-lg line-clamp-1">
                              {subject.name}
                            </h3>
                            <p className="text-white/90 text-xs line-clamp-1">
                              {subject.description || `Flashcards sobre ${subject.name}`}
                            </p>
                          </div>
                        </div>

                        {/* Content - Mais compacto */}
                        <div className="flex-1 flex flex-col p-4">
                          {/* Stats - Inline para economizar espaço */}
                          <div className="flex items-center justify-around gap-2 mb-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Target className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-blue-600">{totalTopics}</div>
                                <div className="text-xs text-muted-foreground">Tópicos</div>
                              </div>
                            </div>

                            <div className="w-px h-10 bg-border" />

                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <Brain className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-green-600">{totalFlashcards}</div>
                                <div className="text-xs text-muted-foreground">Cards</div>
                              </div>
                            </div>
                          </div>

                          {/* Progress - Mais limpo */}
                          <div className="space-y-1.5 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground font-medium">Progresso</span>
                              <span className="text-xs font-bold text-orange-600">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Action Button - Mais destacado */}
                          <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-colors duration-300 py-2.5 text-sm font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40">
                            <div className="flex items-center justify-center gap-2">
                              <Play className="w-4 h-4 fill-current" />
                              Estudar Cards
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </Button>
                        </div>
                      </MagicCard>
                    </Link>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* Tutorial */}
      {showTutorial && <FlashcardsTutorial onClose={handleCloseTutorial} />}
    </MagicLayout>
  )
}