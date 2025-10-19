import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  PlayCircle,
  Clock,
  Mic,
  Headphones,
  Volume2,
  Star,
  TrendingUp,
  Award,
  Users,
  Zap,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import { SectionLoader } from '@/components/SectionLoader'
import { audioLessonService, type AudioLesson } from '@/services/audioLessonService'

export default function EvercastPage() {
  const { isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [audioLessons, setAudioLessons] = useState<AudioLesson[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAudioLessons()
  }, [])

  const loadAudioLessons = async () => {
    try {
      setIsLoading(true)
      const lessons = await audioLessonService.getAudioLessons()
      setAudioLessons(lessons)
    } catch (error) {
      console.error('Error loading audio lessons:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Verificação de permissões para alunos
  if (permissionsLoading || isLoading) {
    return <SectionLoader />
  }

  // Se for aluno e não tiver permissão, mostra página bloqueada
  if (isStudent && !hasFeature(FEATURE_KEYS.EVERCAST)) {
    return (
      <MagicLayout
        title="Evercast"
        description="Sistema de áudio-aulas bloqueado"
      >
        <MagicCard variant="glass" size="lg" className="text-center py-24">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Recurso Bloqueado
            </h3>
            <p className="text-muted-foreground mb-8">
              O Evercast (áudio-aulas) não está disponível para sua turma. Entre em contato com seu professor ou administrador para mais informações.
            </p>
          </div>
        </MagicCard>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title="Evercast"
      description="Suas aulas em áudio para ouvir onde e quando quiser"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Headphones className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Evercast
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-lg">
                    Aulas em áudio onde quiser
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Volume2 className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium">Áudio Premium</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Mic className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">{audioLessons.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Aulas</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {audioLessons.reduce((total, lesson) => total + (lesson.duration_minutes || 0), 0)}min
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <Star className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">
                  {audioLessons.length > 0
                    ? (audioLessons.reduce((sum, l) => sum + (l.rating || 0), 0) / audioLessons.length).toFixed(1)
                    : '0'}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Avaliação</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">
                  {audioLessons.reduce((total, lesson) => total + (lesson.listens_count || 0), 0)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Ouvintes</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Search and Filter */}
        <MagicCard variant="glass" size="lg">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search"
                placeholder="Buscar áudio-aulas..." 
                className="pl-10 bg-card/50 backdrop-blur-sm border-border/50"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" className="flex-1 md:flex-none bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80">
                <TrendingUp className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Populares</span>
                <span className="sm:hidden">Pop</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 md:flex-none bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80">
                <Award className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Recomendados</span>
                <span className="sm:hidden">Rec</span>
              </Button>
            </div>
          </div>
        </MagicCard>

        {/* Audio Classes Grid */}
        {audioLessons.length === 0 ? (
          <MagicCard variant="glass" size="lg" className="text-center py-24">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Headphones className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Nenhuma áudio-aula encontrada
              </h3>
              <p className="text-muted-foreground mb-8">
                Não há áudio-aulas disponíveis no momento. Volte em breve!
              </p>
            </div>
          </MagicCard>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {audioLessons.map((audio, index) => (
            <MagicCard
              key={audio.id}
              variant="premium"
              size="lg"
              className="h-[400px] flex flex-col overflow-hidden transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl cursor-pointer group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image Header */}
              <div className="relative h-48 overflow-hidden rounded-t-2xl">
                <img
                  src={audio.thumbnail_url}
                  alt={audio.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-white/20">
                    <span className="text-sm font-semibold text-gray-900">
                      {audio.duration_minutes ? `${audio.duration_minutes} min` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col p-6">
                <div className="flex-1 flex flex-col space-y-4">
                  {/* Series Badge */}
                  {audio.series && (
                    <Badge
                      variant="secondary"
                      className="w-fit bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-primary"
                    >
                      {audio.series}
                    </Badge>
                  )}

                  {/* Title */}
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {audio.title}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{audio.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{audio.listens_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <Button 
                    asChild
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white transition-all duration-300 ease-out py-3 text-sm font-semibold rounded-xl group-hover:scale-105"
                  >
                    <Link to={`/evercast/${audio.id}`}>
                      <div className="flex items-center justify-center gap-2">
                        <PlayCircle className="w-4 h-4" />
                        Ouvir Agora
                      </div>
                    </Link>
                  </Button>
                </div>
              </div>
            </MagicCard>
          ))}
          </div>
        )}

        {/* Features Section */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Por que escolher o Evercast?</h3>
              <p className="text-muted-foreground">
                Aprenda de forma mais eficiente com nossas aulas em áudio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Headphones className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Ouvir em Qualquer Lugar</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse suas aulas durante o trânsito, exercícios ou em casa
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Zap className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Aprendizado Acelerado</h4>
                <p className="text-sm text-muted-foreground">
                  Conteúdo condensado e direto ao ponto para máximo aproveitamento
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <Volume2 className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Áudio de Qualidade</h4>
                <p className="text-sm text-muted-foreground">
                  Gravações profissionais com clareza e nitidez excepcionais
                </p>
              </div>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
