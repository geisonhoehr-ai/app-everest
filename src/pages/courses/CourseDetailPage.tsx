import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, PlayCircle, Clock, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { SectionLoader } from '@/components/SectionLoader'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useAuth } from '@/hooks/use-auth'
import { courseService } from '@/services/courseService'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface LessonWithProgress {
  id: string
  title: string
  description: string | null
  order_index: number
  duration_seconds: number | null
  is_preview: boolean
  progress: number
  completed: boolean
  last_position: number
}

interface ModuleWithLessons {
  id: string
  name: string
  description: string | null
  order_index: number
  lessons: LessonWithProgress[]
}

interface CourseData {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  modules: ModuleWithLessons[]
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return ''
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  if (sec === 0) return `${min}min`
  return `${min}min ${sec}s`
}

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId || !user?.id) return

      try {
        setIsLoading(true)
        const data = await courseService.getCourseWithModulesAndProgress(courseId, user.id)
        if (data) {
          setCourse({
            id: data.id,
            name: data.name,
            description: data.description,
            thumbnail_url: data.thumbnail_url,
            modules: (data.modules || []).map((m: ModuleWithLessons) => ({
              id: m.id,
              name: m.name,
              description: m.description,
              order_index: m.order_index,
              lessons: (m.lessons || []).map((l: LessonWithProgress) => ({
                id: l.id,
                title: l.title,
                description: l.description,
                order_index: l.order_index,
                duration_seconds: l.duration_seconds,
                is_preview: l.is_preview,
                progress: l.progress || 0,
                completed: l.completed || false,
                last_position: l.last_position || 0,
              })),
            })),
          })
        }
      } catch (error) {
        logger.error('Error fetching course details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourseDetails()
  }, [courseId, user?.id])

  // Calculate stats
  const stats = useMemo(() => {
    if (!course) return { totalLessons: 0, completedLessons: 0, progressPercent: 0 }
    let totalLessons = 0
    let completedLessons = 0
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        totalLessons++
        if (lesson.completed) completedLessons++
      }
    }
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    return { totalLessons, completedLessons, progressPercent }
  }, [course])

  // Find first incomplete lesson for "continue where you left off"
  const firstIncompleteLesson = useMemo(() => {
    if (!course) return null
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (!lesson.completed) {
          return { moduleId: mod.id, lessonId: lesson.id, lessonTitle: lesson.title }
        }
      }
    }
    return null
  }, [course])

  // Default open accordion: the module containing the first incomplete lesson, or the first module
  const defaultOpenModule = useMemo(() => {
    if (firstIncompleteLesson) return [firstIncompleteLesson.moduleId]
    if (course?.modules?.[0]) return [course.modules[0].id]
    return []
  }, [firstIncompleteLesson, course])

  if (isLoading) {
    return <SectionLoader />
  }

  if (!course) {
    return (
      <MagicLayout
        title="Curso nao encontrado"
        description="O curso solicitado nao foi encontrado"
      >
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold mb-4">Curso nao encontrado</h2>
          <p className="text-muted-foreground mb-8">
            O curso que voce esta procurando nao existe ou nao esta disponivel.
          </p>
          <Link to="/courses">
            <Button>Voltar aos Cursos</Button>
          </Link>
        </div>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout showHeader={false}>
      <div className="max-w-5xl mx-auto space-y-6 pt-6">
        {/* Back button */}
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos Cursos
        </Link>

        {/* Course Header */}
        <MagicCard variant="glass" size="lg">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            {course.thumbnail_url && (
              <div className="flex-shrink-0 w-full md:w-64 h-40 rounded-xl overflow-hidden bg-muted">
                <img
                  src={course.thumbnail_url}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {course.name}
                </h1>
                {course.description && (
                  <p className="text-muted-foreground mt-1">{course.description}</p>
                )}
              </div>

              {/* Overall progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Progresso geral
                  </span>
                  <span className={cn(
                    'font-medium',
                    stats.progressPercent === 100 ? 'text-green-500' : 'text-primary'
                  )}>
                    {stats.progressPercent}% ({stats.completedLessons}/{stats.totalLessons} aulas)
                  </span>
                </div>
                <Progress
                  value={stats.progressPercent}
                  className={cn(
                    'h-3',
                    stats.progressPercent === 100 ? '[&>div]:bg-green-500' : ''
                  )}
                />
              </div>

              {/* Continue button */}
              {firstIncompleteLesson && (
                <Button
                  onClick={() => navigate(`/courses/${courseId}/lessons/${firstIncompleteLesson.lessonId}`)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Continuar de onde parou
                </Button>
              )}
            </div>
          </div>
        </MagicCard>

        {/* Modules Accordion */}
        <div className="space-y-2">
          <Accordion type="multiple" defaultValue={defaultOpenModule}>
            {course.modules.map((module) => {
              const completedInModule = module.lessons.filter(l => l.completed).length
              const totalInModule = module.lessons.length
              const allCompleted = totalInModule > 0 && completedInModule === totalInModule

              return (
                <AccordionItem
                  key={module.id}
                  value={module.id}
                  className="border border-border/50 rounded-xl overflow-hidden bg-card/50 mb-3"
                >
                  <AccordionTrigger className="px-5 py-4 hover:bg-muted/30 hover:no-underline transition-colors">
                    <div className="flex items-center justify-between w-full pr-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'flex-shrink-0 w-3 h-3 rounded-full',
                          allCompleted ? 'bg-green-500' : 'bg-primary/40'
                        )} />
                        <span className="font-semibold text-left truncate">
                          {module.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {totalInModule} aula{totalInModule !== 1 ? 's' : ''}
                        </span>
                        <span className={cn(
                          'text-xs font-medium whitespace-nowrap',
                          allCompleted ? 'text-green-500' : 'text-muted-foreground'
                        )}>
                          {allCompleted ? (
                            <CheckCircle2 className="h-4 w-4 inline-block mr-1" />
                          ) : null}
                          {completedInModule}/{totalInModule}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-3">
                    <div className="space-y-1">
                      {module.lessons.map((lesson) => {
                        const isFirstIncomplete = firstIncompleteLesson?.lessonId === lesson.id
                        const duration = formatDuration(lesson.duration_seconds)

                        return (
                          <Link
                            key={lesson.id}
                            to={`/courses/${courseId}/lessons/${lesson.id}`}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                              'hover:bg-muted/50',
                              isFirstIncomplete && 'bg-primary/5 border border-primary/20'
                            )}
                          >
                            {/* Status icon */}
                            <div className="flex-shrink-0">
                              {lesson.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : isFirstIncomplete ? (
                                <PlayCircle className="h-5 w-5 text-primary" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground/40" />
                              )}
                            </div>

                            {/* Title */}
                            <span className={cn(
                              'flex-1 text-sm',
                              lesson.completed
                                ? 'text-muted-foreground'
                                : isFirstIncomplete
                                  ? 'text-foreground font-medium'
                                  : 'text-foreground'
                            )}>
                              {lesson.title}
                            </span>

                            {/* Duration */}
                            {duration && (
                              <span className="flex-shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {duration}
                              </span>
                            )}

                            {/* Arrow for first incomplete */}
                            {isFirstIncomplete && (
                              <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      </div>
    </MagicLayout>
  )
}
