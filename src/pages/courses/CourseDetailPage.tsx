import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  BookOpen,
  ChevronRight,
  LayoutGrid,
  List,
  Layers,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return ''
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  if (sec === 0) return `${min}min`
  return `${min}min ${sec}s`
}

function formatTotalDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0min'
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}min`
  return `${mins}min`
}

type ViewMode = 'card' | 'list'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('card')

  // ---- Data fetching ----
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

  // ---- Computed stats ----
  const stats = useMemo(() => {
    if (!course) return { totalLessons: 0, completedLessons: 0, progressPercent: 0, totalDuration: 0 }
    let totalLessons = 0
    let completedLessons = 0
    let totalDuration = 0
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        totalLessons++
        if (lesson.completed) completedLessons++
        if (lesson.duration_seconds) totalDuration += lesson.duration_seconds
      }
    }
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    return { totalLessons, completedLessons, progressPercent, totalDuration }
  }, [course])

  // ---- First incomplete lesson ----
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

  // ---- Default open accordion module ----
  const defaultOpenModule = useMemo(() => {
    if (firstIncompleteLesson) return [firstIncompleteLesson.moduleId]
    if (course?.modules?.[0]) return [course.modules[0].id]
    return []
  }, [firstIncompleteLesson, course])

  // ---- Loading state ----
  if (isLoading) {
    return <SectionLoader />
  }

  // ---- Course not found ----
  if (!course) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Curso não encontrado</h1>
          <p className="text-sm text-muted-foreground mt-1">O curso solicitado não foi encontrado</p>
        </div>
        <Card className="border-border shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Curso não encontrado</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              O curso que você está procurando não existe ou não está disponível.
            </p>
            <Link to="/courses">
              <Button>Voltar aos Cursos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompleted = stats.progressPercent === 100

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <div className="space-y-6">
        {/* ── Back button ── */}
        <div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Cursos
          </Link>
        </div>

        {/* ── Hero / Course Header ── */}
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="p-6 md:p-8 space-y-6">
            {/* Top row: thumbnail + info */}
            <div className="flex flex-col md:flex-row gap-6">
              {course.thumbnail_url && (
                <div className="flex-shrink-0 w-full md:w-80 rounded-xl overflow-hidden bg-muted self-stretch min-h-[180px]">
                  <img
                    src={course.thumbnail_url}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    {course.name}
                  </h1>
                  {course.description && (
                    <p className="text-muted-foreground mt-2 text-sm md:text-base leading-relaxed max-w-2xl">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <StatBadge icon={<BookOpen className="h-4 w-4" />} label={`${stats.totalLessons} aulas`} />
                  <StatBadge icon={<Layers className="h-4 w-4" />} label={`${course.modules.length} módulos`} />
                  {stats.totalDuration > 0 && (
                    <StatBadge icon={<Clock className="h-4 w-4" />} label={formatTotalDuration(stats.totalDuration)} />
                  )}
                  <StatBadge
                    icon={isCompleted ? <Trophy className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    label={`${stats.progressPercent}% concluído`}
                    highlight={isCompleted}
                  />
                </div>

                {/* Continue button */}
                {firstIncompleteLesson ? (
                  <Button
                    size="lg"
                    onClick={() =>
                      navigate(`/courses/${courseId}/lessons/${firstIncompleteLesson.lessonId}`)
                    }
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Continuar de onde parou
                  </Button>
                ) : isCompleted ? (
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-green-500">
                    <Trophy className="h-5 w-5" />
                    Curso concluído!
                  </div>
                ) : null}
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso geral</span>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    isCompleted ? 'text-green-500' : 'text-primary'
                  )}
                >
                  {stats.completedLessons}/{stats.totalLessons} aulas ({stats.progressPercent}%)
                </span>
              </div>
              <Progress
                value={stats.progressPercent}
                className="h-2.5 bg-muted [&>div]:bg-blue-500"
              />
            </div>
          </div>
        </section>

        {/* ── View Toggle + Section Title ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Módulos do curso</h2>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                viewMode === 'card'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>

        {/* ── Modules Content ── */}
        {viewMode === 'card' ? (
          <ModuleCardView
            course={course}
            courseId={courseId!}
            firstIncompleteLessonId={firstIncompleteLesson?.lessonId ?? null}
          />
        ) : (
          <ModuleListView
            course={course}
            courseId={courseId!}
            firstIncompleteLessonId={firstIncompleteLesson?.lessonId ?? null}
            defaultOpenModule={defaultOpenModule}
          />
        )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatBadge
// ---------------------------------------------------------------------------

function StatBadge({
  icon,
  label,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm cursor-default transition-all duration-200',
        highlight
          ? 'border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:border-green-500/50'
          : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary/40 hover:shadow-sm'
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ModuleCardView
// ---------------------------------------------------------------------------

function ModuleCardView({
  course,
  courseId,
  firstIncompleteLessonId,
}: {
  course: CourseData
  courseId: string
  firstIncompleteLessonId: string | null
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {course.modules.map((module, idx) => {
        const completedInModule = module.lessons.filter((l) => l.completed).length
        const totalInModule = module.lessons.length
        const allCompleted = totalInModule > 0 && completedInModule === totalInModule
        const moduleProgress =
          totalInModule > 0 ? Math.round((completedInModule / totalInModule) * 100) : 0
        const previewLessons = module.lessons.slice(0, 4)

        return (
          <div
            key={module.id}
            className={cn(
              'group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 shadow-sm',
              'hover:border-primary/30 hover:shadow-lg'
            )}
          >
            {/* Module number badge */}
            <div
              className={cn(
                'absolute -top-3 left-4 inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                allCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              Módulo {idx + 1}
            </div>

            {/* Module name */}
            <h3 className="mt-2 font-semibold text-foreground leading-snug line-clamp-2">
              {module.name}
            </h3>

            {/* Progress info */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {completedInModule}/{totalInModule} aulas
                </span>
                <span
                  className={cn(
                    'font-semibold',
                    allCompleted ? 'text-green-500' : 'text-foreground'
                  )}
                >
                  {moduleProgress}%
                </span>
              </div>
              <Progress
                value={moduleProgress}
                className="h-1.5 bg-muted [&>div]:bg-blue-500"
              />
            </div>

            {/* Lesson preview list */}
            <ul className="mt-4 flex-1 space-y-1.5">
              {previewLessons.map((lesson) => {
                const isHighlighted = lesson.id === firstIncompleteLessonId
                return (
                  <li key={lesson.id} className="flex items-center gap-2 min-w-0">
                    {lesson.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                    ) : isHighlighted ? (
                      <PlayCircle className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40" />
                    )}
                    <span
                      className={cn(
                        'truncate text-xs',
                        lesson.completed
                          ? 'text-muted-foreground line-through decoration-muted-foreground/40'
                          : isHighlighted
                            ? 'text-foreground font-medium'
                            : 'text-foreground'
                      )}
                    >
                      {lesson.title}
                    </span>
                  </li>
                )
              })}
              {module.lessons.length > 4 && (
                <li className="text-xs text-muted-foreground pl-5.5">
                  +{module.lessons.length - 4} aula{module.lessons.length - 4 !== 1 ? 's' : ''}
                </li>
              )}
            </ul>

            {/* View module link */}
            <Link
              to={`/courses/${courseId}/lessons/${module.lessons[0]?.id ?? ''}`}
              className={cn(
                'mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                'bg-primary text-primary-foreground hover:bg-green-600 hover:shadow-md'
              )}
            >
              Ver módulo
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ModuleListView (Accordion)
// ---------------------------------------------------------------------------

function ModuleListView({
  course,
  courseId,
  firstIncompleteLessonId,
  defaultOpenModule,
}: {
  course: CourseData
  courseId: string
  firstIncompleteLessonId: string | null
  defaultOpenModule: string[]
}) {
  return (
    <Accordion type="multiple" defaultValue={defaultOpenModule} className="space-y-3">
      {course.modules.map((module, idx) => {
        const completedInModule = module.lessons.filter((l) => l.completed).length
        const totalInModule = module.lessons.length
        const allCompleted = totalInModule > 0 && completedInModule === totalInModule
        const moduleProgress =
          totalInModule > 0 ? Math.round((completedInModule / totalInModule) * 100) : 0

        return (
          <AccordionItem
            key={module.id}
            value={module.id}
            className="border border-border rounded-xl overflow-hidden bg-card"
          >
            <AccordionTrigger className="px-5 py-4 hover:bg-muted/30 hover:no-underline transition-colors">
              <div className="flex items-center justify-between w-full pr-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Module number */}
                  <span
                    className={cn(
                      'flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                      allCompleted
                        ? 'bg-green-500/15 text-green-500'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-left truncate text-foreground">
                    {module.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  {/* Mini progress bar */}
                  <div className="hidden sm:flex items-center gap-2 w-24">
                    <Progress
                      value={moduleProgress}
                      className="h-1.5 bg-muted [&>div]:bg-blue-500"
                    />
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                      {moduleProgress}%
                    </span>
                  </div>
                  {/* Lesson count */}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {completedInModule}/{totalInModule} aula{totalInModule !== 1 ? 's' : ''}
                  </span>
                  {allCompleted && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-3 pb-3">
              <div className="space-y-0.5">
                {module.lessons.map((lesson, lessonIndex) => {
                  const isFirstIncomplete = lesson.id === firstIncompleteLessonId
                  const duration = formatDuration(lesson.duration_seconds)

                  return (
                    <Link
                      key={lesson.id}
                      to={`/courses/${courseId}/lessons/${lesson.id}`}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        'hover:bg-muted/50',
                        isFirstIncomplete ? 'bg-primary/5 border border-primary/20 shadow-sm' : lessonIndex % 2 === 1 && 'bg-muted/30'
                      )}
                    >
                      {/* Status icon */}
                      <div className="flex-shrink-0">
                        {lesson.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : isFirstIncomplete ? (
                          <PlayCircle className="h-5 w-5 text-primary animate-pulse" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>

                      {/* Title */}
                      <span
                        className={cn(
                          'flex-1 text-sm',
                          lesson.completed
                            ? 'text-muted-foreground line-through decoration-muted-foreground/30'
                            : isFirstIncomplete
                              ? 'text-foreground font-medium'
                              : 'text-foreground'
                        )}
                      >
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
  )
}
