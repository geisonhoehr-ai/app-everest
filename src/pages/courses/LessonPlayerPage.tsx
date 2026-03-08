import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { courseService } from '@/services/courseService'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { SectionLoader } from '@/components/SectionLoader'
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Play,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Download,
  FileText,
  MessageSquare,
  Paperclip,
  Clock,
  Menu,
  X,
  SkipBack,
  SkipForward,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LessonData {
  id: string
  title: string
  description: string | null
  duration_seconds?: number
  video_source_type?: string
  video_source_id?: string
  completed?: boolean
  progress?: number
  last_position?: number
}

interface ModuleData {
  id: string
  name: string
  order_index: number
  lessons: Array<{
    id: string
    title: string
    duration_seconds?: number
    order_index: number
    completed?: boolean
    is_preview?: boolean
  }>
}

interface CourseData {
  id: string
  name: string
  description: string
  modules: ModuleData[]
}

interface Attachment {
  id: string
  file_name: string
  file_type: string | null
  file_url: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return <FileText className="h-4 w-4" />
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
  if (fileType.includes('image')) return <FileText className="h-4 w-4 text-blue-500" />
  if (fileType.includes('video')) return <Play className="h-4 w-4 text-purple-500" />
  return <FileText className="h-4 w-4" />
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [lessonData, setLessonData] = useState<LessonData | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [showComments, setShowComments] = useState(false)
  const [showResources, setShowResources] = useState(false)

  const currentLessonRef = useRef<HTMLAnchorElement>(null)

  /* ---- flat lesson list for prev / next ---- */
  const flatLessons = useMemo(() => {
    if (!courseData) return []
    return courseData.modules
      .sort((a, b) => a.order_index - b.order_index)
      .flatMap((m) =>
        [...m.lessons].sort((a, b) => a.order_index - b.order_index),
      )
  }, [courseData])

  const currentIndex = useMemo(
    () => flatLessons.findIndex((l) => l.id === lessonId),
    [flatLessons, lessonId],
  )
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null

  /* ---- completed / total stats ---- */
  const completedCount = useMemo(
    () => flatLessons.filter((l) => l.completed).length,
    [flatLessons],
  )
  const totalCount = flatLessons.length

  /* ---- fetch course + lesson data ---- */
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !courseId || !lessonId) return
      try {
        setIsLoading(true)

        const course = await courseService.getCourseWithModulesAndProgress(
          courseId,
          user.id,
        )
        if (!course) {
          toast({
            title: 'Curso nao encontrado',
            description: 'O curso que voce esta procurando nao existe.',
            variant: 'destructive',
          })
          navigate('/courses')
          return
        }

        setCourseData(course as CourseData)

        // expand all modules by default
        setExpandedModules(
          new Set((course.modules || []).map((m: ModuleData) => m.id)),
        )

        // find lesson
        let foundLesson: LessonData | null = null
        for (const mod of course.modules) {
          const lesson = (mod.lessons as LessonData[]).find(
            (l) => l.id === lessonId,
          )
          if (lesson) {
            foundLesson = lesson
            break
          }
        }

        if (!foundLesson) {
          toast({
            title: 'Aula nao encontrada',
            description: 'A aula que voce esta procurando nao existe.',
            variant: 'destructive',
          })
          navigate(`/courses/${courseId}`)
          return
        }

        setLessonData(foundLesson)

        // fetch attachments
        const { data: attData } = await supabase
          .from('lesson_attachments')
          .select('*')
          .eq('lesson_id', lessonId)

        setAttachments((attData as Attachment[]) || [])
      } catch (error) {
        console.error('Error fetching lesson data:', error)
        toast({
          title: 'Erro ao carregar aula',
          description: 'Ocorreu um erro ao carregar os dados da aula.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [courseId, lessonId, user?.id, navigate, toast])

  /* ---- auto-scroll sidebar to current lesson ---- */
  useEffect(() => {
    if (!isLoading && currentLessonRef.current) {
      currentLessonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [isLoading, lessonId])

  /* ---- mark complete ---- */
  const handleMarkComplete = useCallback(async () => {
    if (!user?.id || !lessonId || !lessonData) return
    try {
      const { error } = await supabase.from('video_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        last_position_seconds: lessonData.duration_seconds || 0,
      })
      if (error) throw error

      setLessonData({ ...lessonData, completed: true, progress: 100 })

      // update in courseData too
      setCourseData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          modules: prev.modules.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === lessonId ? { ...l, completed: true } : l,
            ),
          })),
        }
      })

      toast({
        title: 'Aula concluida!',
        description: 'Parabens! Continue seu progresso.',
      })
    } catch (error) {
      console.error('Error marking lesson as complete:', error)
      toast({
        title: 'Erro',
        description: 'Nao foi possivel marcar a aula como concluida.',
        variant: 'destructive',
      })
    }
  }, [user?.id, lessonId, lessonData, toast])

  /* ---- toggle module ---- */
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  /* ---- video embed URL ---- */
  const videoEmbedUrl = useMemo(() => {
    if (!lessonData) return ''
    const { video_source_type, video_source_id } = lessonData
    if (video_source_type === 'panda_video' && video_source_id)
      return `https://player-vz-e9d62059-4a4.tv.pandavideo.com.br/embed/?v=${video_source_id}`
    if (video_source_type === 'youtube' && video_source_id)
      return `https://www.youtube.com/embed/${video_source_id}`
    if (video_source_type === 'vimeo' && video_source_id)
      return `https://player.vimeo.com/video/${video_source_id}`
    return ''
  }, [lessonData])

  /* ---------------------------------------------------------------- */
  /*  Loading / Error states                                           */
  /* ---------------------------------------------------------------- */

  if (isLoading) return <SectionLoader />

  if (!lessonData || !courseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-6xl">📚</div>
        <h2 className="text-2xl font-bold">Aula nao encontrada</h2>
        <p className="text-muted-foreground">
          A aula que voce esta procurando nao existe ou foi removida.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(`/courses/${courseId}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar ao Curso
        </Button>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Sidebar content (shared between desktop & mobile)                */
  /* ---------------------------------------------------------------- */

  const sanitizedDescription = lessonData.description
    ? DOMPurify.sanitize(lessonData.description)
    : ''

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Conteudo do Curso</h3>
          {/* Mobile close */}
          <button
            className="lg:hidden p-1 rounded hover:bg-muted/50"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {completedCount}/{totalCount} aulas concluidas
        </p>
      </div>

      {/* Modules */}
      <div className="flex-1 overflow-y-auto">
        {courseData.modules
          .sort((a, b) => a.order_index - b.order_index)
          .map((mod) => {
            const isExpanded = expandedModules.has(mod.id)
            const modCompleted = mod.lessons.filter((l) => l.completed).length
            const modTotal = mod.lessons.length

            return (
              <div key={mod.id} className="border-b border-border/50">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="text-left">
                      <div className="font-semibold text-sm">{mod.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {modCompleted}/{modTotal} aula
                        {modTotal !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-muted/20">
                    {[...mod.lessons]
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((lesson) => {
                        const isCurrent = lesson.id === lessonId
                        return (
                          <Link
                            key={lesson.id}
                            ref={isCurrent ? currentLessonRef : undefined}
                            to={`/courses/${courseId}/lessons/${lesson.id}`}
                            onClick={() => setIsSidebarOpen(false)}
                            className={cn(
                              'flex items-start gap-3 p-3 pl-12 hover:bg-muted/50 transition-colors border-l-2',
                              isCurrent
                                ? 'bg-primary/10 border-l-primary'
                                : 'border-l-transparent',
                            )}
                          >
                            <div className="mt-0.5 shrink-0">
                              {lesson.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : isCurrent ? (
                                <Play className="h-4 w-4 text-primary" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  'text-sm font-medium truncate',
                                  isCurrent && 'text-primary',
                                  lesson.completed && 'text-green-600',
                                )}
                              >
                                {lesson.title}
                              </div>
                              {lesson.duration_seconds != null &&
                                lesson.duration_seconds > 0 && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(lesson.duration_seconds)}
                                  </div>
                                )}
                            </div>
                          </Link>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {/* Progress footer */}
      <div className="p-4 border-t border-border/50 bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso Total</span>
          <span className="text-sm font-bold text-primary">
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
            style={{
              width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  )

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ---- Top bar ---- */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/courses/${courseId}`)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-sm font-semibold truncate flex-1">
          {courseData.name}
        </h1>
        {/* Mobile sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* ---- Main layout ---- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left / Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            {/* Video player */}
            {videoEmbedUrl ? (
              <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={videoEmbedUrl}
                  title={lessonData.title}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : (
              <div className="relative w-full rounded-xl overflow-hidden bg-muted flex items-center justify-center" style={{ paddingBottom: '56.25%' }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Play className="h-12 w-12 mb-2" />
                  <p className="text-sm">Video nao disponivel</p>
                </div>
              </div>
            )}

            {/* Lesson title + description */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">{lessonData.title}</h2>
              {sanitizedDescription && (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: sanitizedDescription,
                  }}
                />
              )}
            </div>

            {/* Mark as complete + prev/next */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Button
                onClick={handleMarkComplete}
                disabled={lessonData.completed}
                className={cn(
                  'transition-all duration-300',
                  lessonData.completed
                    ? 'bg-green-600 hover:bg-green-600 text-white cursor-default'
                    : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white hover:scale-105 hover:shadow-lg',
                )}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {lessonData.completed
                  ? 'Aula Concluida'
                  : 'Marcar como Concluida'}
              </Button>

              <div className="flex items-center gap-2">
                {prevLesson && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/courses/${courseId}/lessons/${prevLesson.id}`}>
                      <SkipBack className="mr-1 h-4 w-4" />
                      Anterior
                    </Link>
                  </Button>
                )}
                {nextLesson && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                      Proxima
                      <SkipForward className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Expandable sections */}
            <div className="space-y-3">
              {/* Comments */}
              <div className="border border-border/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowComments((v) => !v)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Comentarios</span>
                  </div>
                  {showComments ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {showComments && (
                  <div className="p-4 pt-0 border-t border-border/50">
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Comentarios em breve.
                    </p>
                  </div>
                )}
              </div>

              {/* Resources / Attachments */}
              <div className="border border-border/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowResources((v) => !v)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Recursos</span>
                    {attachments.length > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {attachments.length}
                      </span>
                    )}
                  </div>
                  {showResources ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {showResources && (
                  <div className="p-4 pt-0 border-t border-border/50">
                    {attachments.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">
                        Nenhum recurso disponivel para esta aula.
                      </p>
                    ) : (
                      <div className="space-y-2 pt-3">
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                {getFileIcon(att.file_type)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {att.file_name}
                                </p>
                                {att.file_type && (
                                  <p className="text-xs text-muted-foreground">
                                    {att.file_type}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={att.file_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---- Desktop sidebar (right) ---- */}
        <aside className="hidden lg:block w-[30%] min-w-[280px] max-w-[400px] border-l border-border/50 overflow-hidden">
          {sidebarContent}
        </aside>

        {/* ---- Mobile sidebar overlay ---- */}
        {isSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 right-0 z-50 w-[85%] max-w-[380px] lg:hidden shadow-xl">
              {sidebarContent}
            </aside>
          </>
        )}
      </div>
    </div>
  )
}
