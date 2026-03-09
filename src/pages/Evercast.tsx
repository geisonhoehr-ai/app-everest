import { useState, useEffect } from 'react'
import {
  Search,
  Play,
  Headphones,
  Pause,
  Lock,
  Disc3,
  Music,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import { SectionLoader } from '@/components/SectionLoader'
import { audioLessonService, type AudioLesson, type EvercastCourse } from '@/services/audioLessonService'
import { AudioPlayer } from '@/components/AudioPlayer'

export default function EvercastPage() {
  const { isStudent, user } = useAuth()
  const navigate = useNavigate()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [audioLessons, setAudioLessons] = useState<AudioLesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<AudioLesson[]>([])
  const [evercastCourses, setEvercastCourses] = useState<EvercastCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTrack, setCurrentTrack] = useState<AudioLesson | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAudioLessons()
  }, [user])

  useEffect(() => {
    if (searchTerm) {
      setFilteredLessons(
        audioLessons.filter(lesson =>
          lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.series?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredLessons(audioLessons)
    }
  }, [searchTerm, audioLessons])

  const loadAudioLessons = async () => {
    try {
      setIsLoading(true)
      const [lessons, courseLessons] = await Promise.all([
        audioLessonService.getAudioLessons(),
        user ? audioLessonService.getEvercastCourseFlatLessons(user.id, !isStudent) : Promise.resolve([]),
      ])
      const allLessons = [...lessons, ...courseLessons]
      setAudioLessons(allLessons)
      setFilteredLessons(allLessons)

      if (user) {
        const courses = await audioLessonService.getEvercastCourses(user.id, !isStudent)
        setEvercastCourses(courses)
      }
    } catch (error) {
      console.error('Error loading audio lessons:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlay = (lesson: AudioLesson) => {
    setCurrentTrack(lesson)
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
      showHeader={false}
      className={cn("pb-32", currentTrack ? "mb-20" : "")} // Add padding for player
    >
      {/* Hero Section (Spotify Header Style) */}
      <div className="flex flex-col md:flex-row gap-8 items-end p-8 bg-gradient-to-b from-emerald-900/30 via-cyan-900/10 to-background/0">
        <div className="w-52 h-52 shadow-2xl rounded-md bg-gradient-to-br from-emerald-500 to-cyan-700 flex items-center justify-center shrink-0">
          <Headphones className="w-24 h-24 text-white" />
        </div>
        <div className="flex flex-col gap-4">
          <span className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Playlist Oficial</span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">Evercast</h1>
          <p className="text-muted-foreground max-w-2xl">
            Todas as suas aulas em áudio, podcasts exclusivos e conteúdos complementares para você estudar em qualquer lugar.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-medium">{audioLessons.length} episódios</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              {Math.floor(audioLessons.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / 60)}h {audioLessons.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) % 60}min
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 px-4 md:px-8">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button
              size="lg"
              className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 text-black shadow-lg hover:scale-105 transition-transform"
              onClick={() => filteredLessons.length > 0 && handlePlay(filteredLessons[0])}
            >
              {currentTrack && filteredLessons[0]?.id === currentTrack.id ? <Pause className="h-6 w-6 ml-0.5 fill-black" /> : <Play className="h-6 w-6 ml-1 fill-black" />}
            </Button>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar episódios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-none rounded-full"
            />
          </div>
        </div>

        {/* Course Albums */}
        {evercastCourses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Cursos em Audio</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {evercastCourses.map(course => (
                <div
                  key={course.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/evercast/curso/${course.id}`)}
                >
                  <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-3 shadow-lg">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-cyan-700 flex items-center justify-center">
                        <Disc3 className="w-16 h-16 text-white/80" />
                      </div>
                    )}
                    <Button
                      size="icon"
                      className="absolute bottom-2 right-2 rounded-full w-12 h-12 bg-green-500 hover:bg-green-600 text-black shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        const firstLesson = course.modules[0]?.lessons[0]
                        if (firstLesson) handlePlay(firstLesson)
                      }}
                    >
                      <Play className="h-5 w-5 ml-0.5 fill-black" />
                    </Button>
                  </div>
                  <p className="font-medium text-sm truncate">{course.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.total_lessons} aulas · {Math.floor(course.total_duration_minutes / 60)}h {course.total_duration_minutes % 60}min
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracks List */}
        {filteredLessons.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Todos os Episodios</h2>
            <div className="space-y-1">
              {filteredLessons.map((lesson, index) => {
                const isActive = currentTrack?.id === lesson.id
                return (
                  <div
                    key={lesson.id}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20"
                        : "hover:bg-white/5"
                    )}
                    onClick={() => handlePlay(lesson)}
                  >
                    {/* Number / Play / Equalizer */}
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      {isActive ? (
                        <div className="w-4 h-4 flex items-end justify-between gap-[2px]">
                          <div className="w-1 bg-emerald-400 animate-[music-bar_0.6s_ease-in-out_infinite] h-full rounded-full" />
                          <div className="w-1 bg-emerald-400 animate-[music-bar_0.8s_ease-in-out_infinite_0.1s] h-2/3 rounded-full" />
                          <div className="w-1 bg-emerald-400 animate-[music-bar_1.0s_ease-in-out_infinite_0.2s] h-1/2 rounded-full" />
                        </div>
                      ) : (
                        <>
                          <span className="text-sm text-muted-foreground group-hover:hidden">{index + 1}</span>
                          <Play className="h-4 w-4 hidden group-hover:block fill-white text-white" />
                        </>
                      )}
                    </div>

                    {/* Thumbnail */}
                    <div className="relative h-11 w-11 rounded-md overflow-hidden shadow-sm shrink-0">
                      {lesson.thumbnail_url ? (
                        <img src={lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center">
                          <Music className="h-4 w-4 text-white/70" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        isActive ? "text-emerald-400" : "text-foreground"
                      )}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lesson.series || 'Evercast'}
                      </p>
                    </div>

                    {/* Duration */}
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {lesson.duration_minutes ? `${lesson.duration_minutes} min` : '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {filteredLessons.length === 0 && (
          <div className="text-center py-16">
            <Music className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum episodio encontrado.</p>
          </div>
        )}
      </div>

      {/* Persistent Audio Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        playlist={filteredLessons}
        onTrackChange={setCurrentTrack}
      />
    </MagicLayout >
  )
}

