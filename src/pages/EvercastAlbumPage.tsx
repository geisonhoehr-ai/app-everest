import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Clock, ChevronLeft, Disc3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { SectionLoader } from '@/components/SectionLoader'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import { audioLessonService, type AudioLesson, type EvercastCourse } from '@/services/audioLessonService'
import { AudioPlayer } from '@/components/AudioPlayer'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function EvercastAlbumPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user, isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [course, setCourse] = useState<EvercastCourse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTrack, setCurrentTrack] = useState<AudioLesson | null>(null)
  const [allLessons, setAllLessons] = useState<AudioLesson[]>([])

  useEffect(() => {
    if (!user || !courseId) return
    loadCourse()
  }, [user, courseId])

  const loadCourse = async () => {
    try {
      setIsLoading(true)
      const courses = await audioLessonService.getEvercastCourses(user!.id, !isStudent)
      const found = courses.find(c => c.id === courseId)
      if (found) {
        setCourse(found)
        setAllLessons(found.modules.flatMap(m => m.lessons))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlay = (lesson: AudioLesson) => setCurrentTrack(lesson)

  const handlePlayAll = () => {
    if (allLessons.length > 0) handlePlay(allLessons[0])
  }

  if (permissionsLoading || isLoading) return <SectionLoader />

  if (isStudent && !hasFeature(FEATURE_KEYS.EVERCAST)) {
    navigate('/evercast')
    return null
  }

  if (!course) {
    return (
      <MagicLayout title="Curso nao encontrado" description="">
        <div className="text-center py-24">
          <p className="text-muted-foreground mb-4">Este curso nao esta disponivel no Evercast.</p>
          <Button variant="outline" onClick={() => navigate('/evercast')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar ao Evercast
          </Button>
        </div>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title={course.name}
      description=""
      showHeader={false}
      className={cn("pb-32", currentTrack ? "mb-20" : "")}
    >
      {/* Back button */}
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/evercast')}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao Evercast
        </Button>
      </div>

      {/* Album Header — full bleed over container padding */}
      <div className="-mx-6 flex flex-col items-center md:flex-row md:items-end gap-6 md:gap-8 p-6 md:p-8 bg-gradient-to-b from-emerald-900/30 via-cyan-900/10 to-background/0">
        <div className="w-44 h-44 md:w-52 md:h-52 shadow-2xl rounded-md overflow-hidden shrink-0">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-cyan-700 flex items-center justify-center">
              <Disc3 className="w-24 h-24 text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 text-center md:text-left">
          <span className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Curso em Audio</span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{course.name}</h1>
          {course.description && (
            <p className="text-muted-foreground max-w-2xl">{course.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm font-medium">{course.total_lessons} aulas</span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              {Math.floor(course.total_duration_minutes / 60)}h {course.total_duration_minutes % 60}min
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        {/* Play All */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg hover:scale-105 transition-transform"
            onClick={handlePlayAll}
          >
            <Play className="h-6 w-6 ml-1 fill-black" />
          </Button>
          <span className="text-sm text-muted-foreground">Reproduzir tudo</span>
        </div>

        {/* Modules Accordion */}
        <Accordion type="multiple" defaultValue={course.modules.map(m => m.id)} className="space-y-2">
          {course.modules.map((mod, modIndex) => (
            <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Modulo {modIndex + 1}</span>
                  <span className="font-semibold">{mod.name}</span>
                  <span className="text-xs text-muted-foreground">({mod.lessons.length} aulas)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pb-2">
                  {mod.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-md cursor-pointer hover:bg-white/5 transition-colors group",
                        currentTrack?.id === lesson.id ? "bg-emerald-500/10 border border-emerald-500/20" : ""
                      )}
                      onClick={() => handlePlay(lesson)}
                    >
                      <span className={cn(
                        "w-6 text-center text-sm",
                        currentTrack?.id === lesson.id ? "text-emerald-400" : "text-muted-foreground"
                      )}>
                        {currentTrack?.id === lesson.id ? (
                          <div className="w-4 h-4 mx-auto flex items-end justify-between gap-[2px]">
                            <div className="w-1 bg-emerald-400 animate-[music-bar_0.6s_ease-in-out_infinite] h-full" />
                            <div className="w-1 bg-emerald-400 animate-[music-bar_0.8s_ease-in-out_infinite_0.1s] h-2/3" />
                            <div className="w-1 bg-emerald-400 animate-[music-bar_1.0s_ease-in-out_infinite_0.2s] h-1/2" />
                          </div>
                        ) : (
                          <>
                            <span className="group-hover:hidden">{lessonIndex + 1}</span>
                            <Play className="h-4 w-4 mx-auto hidden group-hover:block fill-white" />
                          </>
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate",
                          currentTrack?.id === lesson.id ? "text-emerald-400" : ""
                        )}>
                          {lesson.title}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {lesson.duration_minutes ? `${lesson.duration_minutes} min` : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Persistent Audio Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        playlist={allLessons}
        onTrackChange={setCurrentTrack}
      />
    </MagicLayout>
  )
}
