import { useState, useEffect } from 'react'
import {
  Play,
  Headphones,
  Pause,
  Lock,
  Disc3,
  Music,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
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
  const [evercastCourses, setEvercastCourses] = useState<EvercastCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTrack, setCurrentTrack] = useState<AudioLesson | null>(null)
  const [allLessons, setAllLessons] = useState<AudioLesson[]>([])

  useEffect(() => {
    if (!user) return
    loadCourses()
  }, [user])

  const loadCourses = async () => {
    try {
      setIsLoading(true)
      const courses = await audioLessonService.getEvercastCourses(user!.id, !isStudent)
      setEvercastCourses(courses)
      setAllLessons(courses.flatMap(c => c.modules.flatMap(m => m.lessons)))
    } catch (error) {
      console.error('Error loading evercast courses:', error)
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
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row gap-8 items-end p-8 bg-gradient-to-b from-emerald-900/30 via-cyan-900/10 to-background/0">
        <div className="w-52 h-52 shadow-2xl rounded-md bg-gradient-to-br from-emerald-500 to-cyan-700 flex items-center justify-center shrink-0">
          <Headphones className="w-24 h-24 text-white" />
        </div>
        <div className="flex flex-col gap-4">
          <span className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Seus Cursos em Audio</span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">Evercast</h1>
          <p className="text-muted-foreground max-w-2xl">
            Suas aulas em formato de audio para estudar em qualquer lugar.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-medium">{evercastCourses.length} {evercastCourses.length === 1 ? 'curso' : 'cursos'}</span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              {allLessons.length} aulas
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 px-4 md:px-8">
        {/* Course Albums */}
        {evercastCourses.length > 0 ? (
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
                    className="absolute bottom-2 right-2 rounded-full w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all"
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
        ) : (
          <div className="text-center py-16">
            <Music className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum curso disponível no Evercast ainda.</p>
          </div>
        )}
      </div>

      {/* Persistent Audio Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        playlist={allLessons}
        onTrackChange={setCurrentTrack}
      />
    </MagicLayout >
  )
}

