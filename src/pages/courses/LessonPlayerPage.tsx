import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { courseService } from '@/services/courseService'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
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
  Moon,
  Sun,
  PanelRightOpen,
  PanelRightClose,
  BookOpen,
  Eye,
  Send,
  GripVertical,
  Maximize2,
  Minimize2,
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
  description?: string
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

  // Theater mode
  const [theaterMode, setTheaterMode] = useState(false)

  // PDF split view
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)
  const [splitRatio, setSplitRatio] = useState(55) // % for video side
  const isDragging = useRef(false)
  const splitContainerRef = useRef<HTMLDivElement>(null)

  // Sidebar - collapsed by default
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(false)

  const currentLessonRef = useRef<HTMLAnchorElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

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
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  /* ---- PDF attachments ---- */
  const pdfAttachments = useMemo(
    () => attachments.filter((a) => a.file_type?.includes('pdf') || a.file_name?.endsWith('.pdf')),
    [attachments],
  )

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

        // Exclusive accordion: only expand module containing current lesson
        const activeModuleId = (course.modules || []).find((m: ModuleData) =>
          m.lessons.some((l) => l.id === lessonId)
        )?.id
        setExpandedModules(activeModuleId ? new Set([activeModuleId]) : new Set())

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
        // Reset PDF viewer when changing lesson
        setPdfViewerUrl(null)
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

  /* ---- scroll to top when lesson changes ---- */
  useEffect(() => {
    if (!isLoading && mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [isLoading, lessonId])

  /* ---- auto-scroll sidebar to current lesson ---- */
  useEffect(() => {
    if (!isLoading && currentLessonRef.current) {
      currentLessonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [isLoading, lessonId])

  /* ---- Escape key exits theater mode ---- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && theaterMode) {
        setTheaterMode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [theaterMode])

  /* ---- Resizable split drag handlers ---- */
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const pct = Math.max(25, Math.min(75, (x / rect.width) * 100))
      setSplitRatio(pct)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  /* ---- mark complete ---- */
  const handleMarkComplete = useCallback(async () => {
    if (!user?.id || !lessonId || !lessonData) return
    try {
      const { error } = await supabase.from('video_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        progress_percentage: 100,
        is_completed: true,
        current_time_seconds: lessonData.duration_seconds || 0,
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

      // Auto-navigate to next lesson
      if (nextLesson) {
        setTimeout(() => {
          navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)
        }, 1500)
      }
    } catch (error) {
      console.error('Error marking lesson as complete:', error)
      toast({
        title: 'Erro',
        description: 'Nao foi possivel marcar a aula como concluida.',
        variant: 'destructive',
      })
    }
  }, [user?.id, lessonId, lessonData, toast, nextLesson, courseId, navigate])

  /* ---- toggle module (exclusive: only one open) ---- */
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      if (prev.has(moduleId)) {
        return new Set()
      }
      return new Set([moduleId])
    })
  }

  /* ---- open PDF in split view ---- */
  const openPdfViewer = (url: string) => {
    if (pdfViewerUrl === url) {
      // Toggle off
      setPdfViewerUrl(null)
    } else {
      setPdfViewerUrl(url)
      setSplitRatio(55)
    }
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
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Skeleton top bar */}
        <div className="h-14 border-b border-border/50 bg-card/80 flex items-center px-4 gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 p-4">
            <div className="w-full rounded-xl bg-muted animate-pulse" style={{ paddingBottom: '56.25%' }} />
            <div className="mt-4 space-y-3">
              <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!lessonData || !courseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-6xl">📚</div>
        <h2 className="text-2xl font-bold text-foreground">Aula nao encontrada</h2>
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

  const sanitizedDescription = lessonData.description
    ? DOMPurify.sanitize(lessonData.description)
    : ''

  /* ---------------------------------------------------------------- */
  /*  Sidebar content (shared between desktop and mobile)              */
  /* ---------------------------------------------------------------- */

  const renderModuleList = (isMobile = false) => (
    <div className="flex-1 overflow-y-auto">
      {courseData.modules
        .sort((a, b) => a.order_index - b.order_index)
        .map((mod) => {
          const isExpanded = expandedModules.has(mod.id)
          const modCompleted = mod.lessons.filter((l) => l.completed).length
          const modTotal = mod.lessons.length
          const modProgress = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0

          return (
            <div key={mod.id} className="border-b border-border/30">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full p-3 px-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                  modProgress === 100
                    ? "bg-emerald-500/15 text-emerald-500"
                    : modProgress > 0
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                )}>
                  {modProgress === 100 ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <span>{modCompleted}/{modTotal}</span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-semibold text-foreground/70 truncate">
                    {mod.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {modTotal} aulas
                  </div>
                </div>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-muted-foreground/50 shrink-0 transition-transform duration-200",
                  isExpanded ? "rotate-180" : ""
                )} />
              </button>

              {/* Lessons - animated accordion */}
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
              )}>
                {[...mod.lessons]
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((lesson) => {
                    const isCurrent = lesson.id === lessonId
                    return (
                      <Link
                        key={lesson.id}
                        ref={isCurrent ? currentLessonRef : undefined}
                        to={`/courses/${courseId}/lessons/${lesson.id}`}
                        onClick={() => {
                          if (isMobile) setIsSidebarOpen(false)
                        }}
                        className={cn(
                          "flex items-center gap-3 py-2.5 px-4 pl-8 transition-all duration-150 border-l-2",
                          isCurrent
                            ? "bg-primary/10 border-l-primary"
                            : "border-l-transparent hover:bg-muted/20"
                        )}
                      >
                        <div className="shrink-0">
                          {lesson.completed ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            </div>
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-xs font-medium truncate",
                            isCurrent ? "text-primary" : lesson.completed ? "text-emerald-500/70" : "text-foreground/50"
                          )}>
                            {lesson.title}
                          </div>
                          {lesson.duration_seconds != null && lesson.duration_seconds > 0 && (
                            <div className="text-[10px] text-muted-foreground/50 mt-0.5 tabular-nums">
                              {formatDuration(lesson.duration_seconds)}
                            </div>
                          )}
                        </div>
                        {isCurrent && (
                          <ChevronRight className="h-3 w-3 text-primary/50 shrink-0" />
                        )}
                      </Link>
                    )
                  })}
              </div>
            </div>
          )
        })}
    </div>
  )

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* Theater mode overlay */}
      {theaterMode && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm transition-opacity duration-500"
          onClick={() => setTheaterMode(false)}
          style={{ animation: 'fadeIn 0.4s ease-out' }}
        />
      )}

      <div className={cn(
        "flex flex-col min-h-screen transition-colors duration-300",
        theaterMode ? "bg-black" : "bg-background"
      )}>
        {/* ============================================================ */}
        {/* Top bar                                                       */}
        {/* ============================================================ */}
        <div className={cn(
          "sticky top-0 z-[70] border-b transition-all duration-300",
          theaterMode
            ? "bg-black/60 backdrop-blur-xl border-white/5"
            : "bg-card/95 backdrop-blur-xl border-border/50"
        )}>
          <div className="flex items-center h-14 px-4 gap-2">
            {/* Back button */}
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className={cn(
                "flex items-center gap-2 transition-colors shrink-0 group",
                theaterMode ? "text-white/50 hover:text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm hidden sm:inline">Voltar</span>
            </button>

            {/* Divider */}
            <div className={cn("h-5 w-px mx-1 hidden sm:block", theaterMode ? "bg-white/10" : "bg-border")} />

            {/* Course name */}
            <h1 className={cn(
              "text-sm font-medium truncate flex-1",
              theaterMode ? "text-white/70" : "text-foreground/70"
            )}>
              {courseData.name}
            </h1>

            {/* Progress pill */}
            <div className={cn(
              "hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 border",
              theaterMode ? "bg-white/[0.04] border-white/[0.06]" : "bg-muted/50 border-border/50"
            )}>
              <div className={cn("w-20 h-1.5 rounded-full overflow-hidden", theaterMode ? "bg-white/10" : "bg-muted")}>
                <div
                  className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className={cn(
                "text-xs font-medium tabular-nums",
                theaterMode ? "text-white/50" : "text-muted-foreground"
              )}>
                {completedCount}/{totalCount}
              </span>
            </div>

            {/* Theater mode toggle */}
            <button
              onClick={() => setTheaterMode(!theaterMode)}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                theaterMode
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              title={theaterMode ? 'Acender Luz' : 'Apagar Luz'}
            >
              {theaterMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Desktop sidebar toggle */}
            <button
              onClick={() => setDesktopSidebarVisible(!desktopSidebarVisible)}
              className={cn(
                "hidden lg:flex p-2 rounded-lg transition-all",
                theaterMode
                  ? "text-white/40 hover:text-white/80 hover:bg-white/[0.06]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              title={desktopSidebarVisible ? 'Esconder painel' : 'Mostrar painel'}
            >
              {desktopSidebarVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </button>

            {/* Mobile sidebar toggle */}
            <button
              className={cn(
                "lg:hidden p-2 rounded-lg transition-all",
                theaterMode
                  ? "text-white/40 hover:text-white/80 hover:bg-white/[0.06]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Main layout                                                    */}
        {/* ============================================================ */}
        <div className="flex flex-1 overflow-hidden">
          {/* ---- Main content area ---- */}
          <div ref={mainContentRef} className="flex-1 overflow-y-auto">
            <div className={cn(
              "mx-auto transition-all duration-300",
              theaterMode ? "max-w-none" : desktopSidebarVisible ? "max-w-[1100px]" : "max-w-[1400px]"
            )}>
              {/* ======================================================== */}
              {/* Video + PDF Split Area                                     */}
              {/* ======================================================== */}
              <div
                ref={splitContainerRef}
                className={cn(
                  "relative transition-all duration-300",
                  theaterMode ? "z-[65]" : ""
                )}
              >
                {pdfViewerUrl ? (
                  /* ---- Split view: Video + PDF side by side ---- */
                  <>
                    {/* Desktop split */}
                    <div className="hidden md:flex w-full" style={{ minHeight: '50vh' }}>
                      {/* Video side */}
                      <div style={{ width: `${splitRatio}%` }} className="relative shrink-0">
                        <div className="relative w-full h-full bg-black">
                          {videoEmbedUrl ? (
                            <iframe
                              src={videoEmbedUrl}
                              title={lessonData.title}
                              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                              allowFullScreen
                              className="absolute inset-0 w-full h-full"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                              <Play className="h-8 w-8 mb-2" />
                              <p className="text-sm">Video nao disponivel</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Drag handle */}
                      <div
                        onMouseDown={handleDragStart}
                        className="w-2 bg-border/50 hover:bg-primary/50 cursor-col-resize flex items-center justify-center transition-colors group relative z-10 shrink-0"
                        title="Arraste para redimensionar"
                      >
                        <GripVertical className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>

                      {/* PDF side */}
                      <div className="flex-1 flex flex-col bg-card/30 min-w-0">
                        {/* PDF header */}
                        <div className={cn(
                          "flex items-center justify-between px-3 py-2 border-b shrink-0",
                          theaterMode ? "bg-black/40 border-white/10" : "bg-card/80 border-border/50"
                        )}>
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className={cn(
                              "text-xs font-medium truncate",
                              theaterMode ? "text-white/60" : "text-foreground/60"
                            )}>
                              {pdfAttachments.find(p => p.file_url === pdfViewerUrl)?.file_name || 'Material PDF'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={pdfViewerUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all"
                              title="Baixar PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={() => setPdfViewerUrl(null)}
                              className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all"
                              title="Fechar PDF"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* PDF iframe */}
                        <div className="flex-1 relative">
                          <iframe
                            src={pdfViewerUrl}
                            title="PDF Viewer"
                            className="absolute inset-0 w-full h-full border-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mobile: stacked (video on top, PDF below) */}
                    <div className="md:hidden">
                      <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                        {videoEmbedUrl ? (
                          <iframe
                            src={videoEmbedUrl}
                            title={lessonData.title}
                            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                            <Play className="h-8 w-8 mb-2" />
                            <p className="text-sm">Video nao disponivel</p>
                          </div>
                        )}
                      </div>
                      {/* Mobile PDF */}
                      <div className="border-t border-border/50">
                        <div className="flex items-center justify-between px-3 py-2 bg-card/80 border-b border-border/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs font-medium text-foreground/60 truncate">
                              {pdfAttachments.find(p => p.file_url === pdfViewerUrl)?.file_name || 'PDF'}
                            </span>
                          </div>
                          <button
                            onClick={() => setPdfViewerUrl(null)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div style={{ height: '50vh' }}>
                          <iframe
                            src={pdfViewerUrl}
                            title="PDF Viewer"
                            className="w-full h-full border-0"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ---- Normal video (no PDF) ---- */
                  <>
                    {videoEmbedUrl ? (
                      <div className={cn(
                        "relative w-full bg-black overflow-hidden",
                        theaterMode ? "rounded-none" : "lg:rounded-b-xl"
                      )}
                        style={{ paddingBottom: theaterMode ? '50%' : '56.25%' }}
                      >
                        <iframe
                          src={videoEmbedUrl}
                          title={lessonData.title}
                          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "relative w-full overflow-hidden",
                          theaterMode ? "bg-black" : "bg-muted/20 lg:rounded-b-xl"
                        )}
                        style={{ paddingBottom: '56.25%' }}
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                            <Play className="h-8 w-8 ml-1" />
                          </div>
                          <p className="text-sm font-medium">Video nao disponivel</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ======================================================== */}
              {/* Action Bar                                                 */}
              {/* ======================================================== */}
              <div className={cn(
                "px-4 sm:px-6 py-4 transition-all duration-300",
                theaterMode ? "relative z-[65]" : ""
              )}>
                {/* Lesson title + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className={cn(
                      "text-xl sm:text-2xl font-bold leading-tight",
                      theaterMode ? "text-white" : "text-foreground"
                    )}>
                      {lessonData.title}
                    </h2>
                    {lessonData.duration_seconds != null && lessonData.duration_seconds > 0 && (
                      <div className={cn(
                        "flex items-center gap-2 mt-2 text-sm",
                        theaterMode ? "text-white/40" : "text-muted-foreground"
                      )}>
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDuration(lessonData.duration_seconds)}</span>
                        {lessonData.completed && (
                          <>
                            <span className="mx-1">·</span>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-500">Concluida</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleMarkComplete}
                      disabled={lessonData.completed}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                        lessonData.completed
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default"
                          : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {lessonData.completed ? 'Concluida' : 'Marcar como Concluida'}
                    </button>
                  </div>
                </div>

                {/* Navigation row */}
                <div className={cn(
                  "flex items-center justify-between mt-4 pt-4 border-t",
                  theaterMode ? "border-white/[0.06]" : "border-border/50"
                )}>
                  <div>
                    {prevLesson ? (
                      <Link
                        to={`/courses/${courseId}/lessons/${prevLesson.id}`}
                        className={cn(
                          "flex items-center gap-2 text-sm transition-colors group",
                          theaterMode ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <SkipBack className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="hidden sm:inline">Anterior</span>
                      </Link>
                    ) : (
                      <div />
                    )}
                  </div>

                  {/* PDF quick access buttons */}
                  {pdfAttachments.length > 0 && (
                    <div className="flex items-center gap-2">
                      {pdfAttachments.map((pdf) => (
                        <button
                          key={pdf.id}
                          onClick={() => openPdfViewer(pdf.file_url)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            pdfViewerUrl === pdf.file_url
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : theaterMode
                                ? "bg-white/[0.04] text-white/50 hover:text-white/80 hover:bg-white/[0.08] border border-white/[0.06]"
                                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50"
                          )}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span className="max-w-[120px] truncate hidden sm:inline">{pdf.file_name}</span>
                          <span className="sm:hidden">PDF</span>
                          {pdfViewerUrl === pdf.file_url ? (
                            <Minimize2 className="h-3 w-3" />
                          ) : (
                            <Maximize2 className="h-3 w-3" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    {nextLesson ? (
                      <Link
                        to={`/courses/${courseId}/lessons/${nextLesson.id}`}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all group",
                          theaterMode
                            ? "bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border-white/[0.06]"
                            : "bg-muted/30 text-foreground/70 hover:text-foreground hover:bg-muted/60 border-border/50"
                        )}
                      >
                        <span>Proxima</span>
                        <SkipForward className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* Below-video content                                        */}
              {/* ======================================================== */}
              <div className={cn(
                "px-4 sm:px-6 pb-8 space-y-4",
                theaterMode ? "relative z-[65]" : ""
              )}>
                {/* Description */}
                {sanitizedDescription && (
                  <div className={cn(
                    "rounded-xl border p-5",
                    theaterMode ? "bg-white/[0.02] border-white/[0.06]" : "bg-card/50 border-border/50"
                  )}>
                    <div
                      className="prose prose-sm prose-neutral dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                  </div>
                )}

                {/* Expandable sections */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Comments */}
                  <div className={cn(
                    "rounded-xl border overflow-hidden",
                    theaterMode ? "bg-white/[0.02] border-white/[0.06]" : "bg-card/50 border-border/50"
                  )}>
                    <button
                      onClick={() => setShowComments((v) => !v)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="font-semibold text-sm text-foreground/80">Comentarios</span>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground/50 transition-transform duration-200",
                        showComments ? "rotate-180" : ""
                      )} />
                    </button>
                    {showComments && (
                      <div className="px-4 pb-4 border-t border-border/30">
                        <div className="mt-4 rounded-lg bg-muted/20 border border-border/30 p-3">
                          <textarea
                            placeholder="Compartilhe sua duvida ou comentario..."
                            className="w-full bg-transparent text-sm text-foreground/70 placeholder:text-muted-foreground/40 resize-none focus:outline-none min-h-[80px]"
                          />
                          <div className="flex justify-end mt-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                              <Send className="h-3 w-3" />
                              Enviar
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground/40 text-center mt-3">
                          Comentarios em breve.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Resources */}
                  <div className={cn(
                    "rounded-xl border overflow-hidden",
                    theaterMode ? "bg-white/[0.02] border-white/[0.06]" : "bg-card/50 border-border/50"
                  )}>
                    <button
                      onClick={() => setShowResources((v) => !v)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Paperclip className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold text-sm text-foreground/80">Recursos</span>
                        {attachments.length > 0 && (
                          <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                            {attachments.length}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground/50 transition-transform duration-200",
                        showResources ? "rotate-180" : ""
                      )} />
                    </button>
                    {showResources && (
                      <div className="px-4 pb-4 border-t border-border/30">
                        {attachments.length === 0 ? (
                          <p className="text-sm text-muted-foreground/40 py-6 text-center">
                            Nenhum recurso disponivel.
                          </p>
                        ) : (
                          <div className="space-y-2 mt-3">
                            {attachments.map((att) => {
                              const isPdf = att.file_type?.includes('pdf') || att.file_name?.endsWith('.pdf')
                              return (
                                <div
                                  key={att.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors group"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                      isPdf ? "bg-red-500/10" : "bg-muted/30"
                                    )}>
                                      <FileText className={cn("h-4 w-4", isPdf ? "text-red-500" : "text-muted-foreground")} />
                                    </div>
                                    <span className="text-sm text-foreground/60 truncate group-hover:text-foreground/80 transition-colors">
                                      {att.file_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {isPdf && (
                                      <button
                                        onClick={() => openPdfViewer(att.file_url)}
                                        className="p-1.5 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
                                        title="Abrir ao lado"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    <a
                                      href={att.file_url}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all"
                                      title="Baixar"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Desktop Sidebar (right)                                       */}
          {/* ============================================================ */}
          <aside className={cn(
            "hidden lg:flex flex-col border-l overflow-hidden transition-all duration-300",
            theaterMode ? "bg-black/50 border-white/[0.06]" : "bg-card/50 border-border/50",
            desktopSidebarVisible ? "w-[340px] min-w-[340px]" : "w-0 min-w-0 border-l-0"
          )}>
            {desktopSidebarVisible && (
              <>
                {/* Header */}
                <div className="p-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={cn("font-bold text-sm", theaterMode ? "text-white/90" : "text-foreground/90")}>
                        Conteudo do Curso
                      </h3>
                      <p className={cn("text-xs mt-0.5", theaterMode ? "text-white/30" : "text-muted-foreground")}>
                        {completedCount} de {totalCount} aulas concluidas
                      </p>
                    </div>
                    <span className="text-lg font-bold text-primary tabular-nums">{progressPercent}%</span>
                  </div>
                  <div className={cn("mt-3 h-1 rounded-full overflow-hidden", theaterMode ? "bg-white/[0.06]" : "bg-muted")}>
                    <div
                      className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-700"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Modules */}
                {renderModuleList(false)}
              </>
            )}
          </aside>

          {/* ============================================================ */}
          {/* Mobile sidebar overlay                                        */}
          {/* ============================================================ */}
          {isSidebarOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
              <aside className="fixed inset-y-0 right-0 z-50 w-[85%] max-w-[380px] lg:hidden bg-background border-l border-border/50 shadow-2xl flex flex-col">
                {/* Mobile header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
                  <div>
                    <h3 className="font-bold text-sm text-foreground/90">Conteudo do Curso</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {completedCount} de {totalCount} aulas
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Mobile progress */}
                <div className="px-4 py-3 border-b border-border/50 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Progresso</span>
                    <span className="text-sm font-bold text-primary">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Mobile modules */}
                {renderModuleList(true)}
              </aside>
            </>
          )}
        </div>
      </div>

      {/* Inline animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
