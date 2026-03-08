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

  // New states for enhanced features
  const [theaterMode, setTheaterMode] = useState(false)
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'lessons' | 'pdf'>('lessons')
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true)

  const currentLessonRef = useRef<HTMLAnchorElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

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
  const nonPdfAttachments = useMemo(
    () => attachments.filter((a) => !a.file_type?.includes('pdf') && !a.file_name?.endsWith('.pdf')),
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

        // expand module that contains current lesson, collapse others
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
        setSidebarTab('lessons')
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

      // Auto-navigate to next lesson after a short delay
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

  /* ---- toggle module ---- */
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  /* ---- open PDF viewer ---- */
  const openPdfViewer = (url: string) => {
    setPdfViewerUrl(url)
    setSidebarTab('pdf')
    setDesktopSidebarVisible(true)
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
      <div className="flex flex-col min-h-screen bg-[#0a0a12]">
        {/* Skeleton top bar */}
        <div className="h-14 border-b border-white/5 bg-[#0d0d18]/80 flex items-center px-4 gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-4 w-48 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 p-4">
            {/* Skeleton video */}
            <div className="w-full rounded-xl bg-white/5 animate-pulse" style={{ paddingBottom: '56.25%' }} />
            <div className="mt-4 space-y-3">
              <div className="h-6 w-2/3 rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-1/3 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
          <div className="hidden lg:block w-[340px] border-l border-white/5 p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

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

  const sanitizedDescription = lessonData.description
    ? DOMPurify.sanitize(lessonData.description)
    : ''

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* ============================================================ */}
      {/* Theater mode overlay                                          */}
      {/* ============================================================ */}
      {theaterMode && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm transition-opacity duration-500"
          onClick={() => setTheaterMode(false)}
          style={{ animation: 'fadeIn 0.4s ease-out' }}
        />
      )}

      <div className={cn(
        "flex flex-col min-h-screen transition-colors duration-300",
        theaterMode ? "bg-black" : "bg-[#0a0a12]"
      )}>
        {/* ============================================================ */}
        {/* Top bar - Minimal, professional                               */}
        {/* ============================================================ */}
        <div className={cn(
          "sticky top-0 z-[70] border-b transition-all duration-300",
          theaterMode
            ? "bg-black/60 backdrop-blur-xl border-white/5"
            : "bg-[#0d0d18]/95 backdrop-blur-xl border-white/[0.06]"
        )}>
          <div className="flex items-center h-14 px-4 gap-2">
            {/* Back button */}
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors shrink-0 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm hidden sm:inline">Voltar</span>
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

            {/* Course name */}
            <h1 className="text-sm font-medium text-white/70 truncate flex-1">
              {courseData.name}
            </h1>

            {/* Progress pill */}
            <div className="hidden md:flex items-center gap-2 bg-white/[0.04] rounded-full px-3 py-1.5 border border-white/[0.06]">
              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-white/50 font-medium tabular-nums">
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
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.06]"
              )}
              title={theaterMode ? 'Acender Luz' : 'Apagar Luz'}
            >
              {theaterMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Desktop sidebar toggle */}
            <button
              onClick={() => setDesktopSidebarVisible(!desktopSidebarVisible)}
              className="hidden lg:flex p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
              title={desktopSidebarVisible ? 'Esconder painel' : 'Mostrar painel'}
            >
              {desktopSidebarVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </button>

            {/* Mobile sidebar toggle */}
            <button
              className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
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
          <div className="flex-1 overflow-y-auto">
            <div className={cn(
              "mx-auto transition-all duration-300",
              desktopSidebarVisible ? "max-w-[1100px]" : "max-w-[1400px]",
              theaterMode ? "max-w-none" : ""
            )}>
              {/* ======================================================== */}
              {/* Video Player                                               */}
              {/* ======================================================== */}
              <div
                ref={videoContainerRef}
                className={cn(
                  "relative transition-all duration-300",
                  theaterMode ? "z-[65]" : ""
                )}
              >
                {videoEmbedUrl ? (
                  <div className={cn(
                    "relative w-full bg-black overflow-hidden",
                    theaterMode ? "rounded-none" : "lg:rounded-b-2xl"
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
                    className="relative w-full bg-gradient-to-br from-[#12121f] to-[#0a0a12] lg:rounded-b-2xl overflow-hidden"
                    style={{ paddingBottom: '56.25%' }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Play className="h-8 w-8 ml-1" />
                      </div>
                      <p className="text-sm font-medium">Video nao disponivel</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* Action Bar (below video)                                   */}
              {/* ======================================================== */}
              <div className={cn(
                "px-4 sm:px-6 py-4 transition-all duration-300",
                theaterMode ? "relative z-[65]" : ""
              )}>
                {/* Lesson title + Actions row */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {lessonData.title}
                    </h2>
                    {lessonData.duration_seconds != null && lessonData.duration_seconds > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-white/40 text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDuration(lessonData.duration_seconds)}</span>
                        {lessonData.completed && (
                          <>
                            <span className="mx-1">·</span>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Concluida</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Mark complete button */}
                    <button
                      onClick={handleMarkComplete}
                      disabled={lessonData.completed}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                        lessonData.completed
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                          : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {lessonData.completed ? 'Concluida' : 'Marcar como Concluida'}
                    </button>
                  </div>
                </div>

                {/* Navigation row */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                  <div>
                    {prevLesson ? (
                      <Link
                        to={`/courses/${courseId}/lessons/${prevLesson.id}`}
                        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors group"
                      >
                        <SkipBack className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="hidden sm:inline">Anterior</span>
                      </Link>
                    ) : (
                      <div />
                    )}
                  </div>

                  {/* PDF quick access */}
                  {pdfAttachments.length > 0 && (
                    <div className="flex items-center gap-2">
                      {pdfAttachments.map((pdf) => (
                        <button
                          key={pdf.id}
                          onClick={() => openPdfViewer(pdf.file_url)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            pdfViewerUrl === pdf.file_url
                              ? "bg-primary/15 text-primary border border-primary/20"
                              : "bg-white/[0.04] text-white/50 hover:text-white/80 hover:bg-white/[0.08] border border-white/[0.06]"
                          )}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span className="max-w-[120px] truncate">{pdf.file_name}</span>
                          <Eye className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    {nextLesson ? (
                      <Link
                        to={`/courses/${courseId}/lessons/${nextLesson.id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-all group"
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
              {/* Below-video content (description, comments, resources)     */}
              {/* ======================================================== */}
              <div className={cn(
                "px-4 sm:px-6 pb-8 space-y-4",
                theaterMode ? "relative z-[65]" : ""
              )}>
                {/* Description */}
                {sanitizedDescription && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
                    <div
                      className="prose prose-sm prose-invert max-w-none
                        prose-headings:text-white/90 prose-p:text-white/60 prose-a:text-primary
                        prose-strong:text-white/80 prose-li:text-white/60"
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                  </div>
                )}

                {/* Expandable sections grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Comments */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                    <button
                      onClick={() => setShowComments((v) => !v)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="font-semibold text-sm text-white/80">Comentarios</span>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-white/30 transition-transform duration-200",
                        showComments ? "rotate-180" : ""
                      )} />
                    </button>
                    {showComments && (
                      <div className="px-4 pb-4 border-t border-white/[0.04]">
                        <div className="mt-4 rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                          <textarea
                            placeholder="Compartilhe sua duvida ou comentario..."
                            className="w-full bg-transparent text-sm text-white/70 placeholder:text-white/20 resize-none focus:outline-none min-h-[80px]"
                          />
                          <div className="flex justify-end mt-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                              <Send className="h-3 w-3" />
                              Enviar
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-white/20 text-center mt-3">
                          Comentarios em breve.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Resources / Attachments */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                    <button
                      onClick={() => setShowResources((v) => !v)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Paperclip className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold text-sm text-white/80">Recursos</span>
                        {attachments.length > 0 && (
                          <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                            {attachments.length}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-white/30 transition-transform duration-200",
                        showResources ? "rotate-180" : ""
                      )} />
                    </button>
                    {showResources && (
                      <div className="px-4 pb-4 border-t border-white/[0.04]">
                        {attachments.length === 0 ? (
                          <p className="text-sm text-white/20 py-6 text-center">
                            Nenhum recurso disponivel.
                          </p>
                        ) : (
                          <div className="space-y-2 mt-3">
                            {attachments.map((att) => {
                              const isPdf = att.file_type?.includes('pdf') || att.file_name?.endsWith('.pdf')
                              return (
                                <div
                                  key={att.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors group"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                      isPdf ? "bg-red-500/10" : "bg-white/5"
                                    )}>
                                      <FileText className={cn("h-4 w-4", isPdf ? "text-red-400" : "text-white/40")} />
                                    </div>
                                    <span className="text-sm text-white/60 truncate group-hover:text-white/80 transition-colors">
                                      {att.file_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {isPdf && (
                                      <button
                                        onClick={() => openPdfViewer(att.file_url)}
                                        className="p-1.5 rounded-md text-white/30 hover:text-primary hover:bg-primary/10 transition-all"
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
                                      className="p-1.5 rounded-md text-white/30 hover:text-white/80 hover:bg-white/[0.06] transition-all"
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
            "hidden lg:flex flex-col border-l border-white/[0.06] overflow-hidden transition-all duration-300 bg-[#0d0d18]/50",
            desktopSidebarVisible ? "w-[340px] min-w-[340px]" : "w-0 min-w-0 border-l-0"
          )}>
            {desktopSidebarVisible && (
              <>
                {/* Sidebar tab switcher */}
                <div className="flex border-b border-white/[0.06] shrink-0">
                  <button
                    onClick={() => setSidebarTab('lessons')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-all",
                      sidebarTab === 'lessons'
                        ? "text-primary border-b-2 border-primary bg-primary/[0.03]"
                        : "text-white/30 hover:text-white/50"
                    )}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Conteudo
                  </button>
                  {pdfViewerUrl && (
                    <button
                      onClick={() => setSidebarTab('pdf')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-all",
                        sidebarTab === 'pdf'
                          ? "text-primary border-b-2 border-primary bg-primary/[0.03]"
                          : "text-white/30 hover:text-white/50"
                      )}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Material PDF
                    </button>
                  )}
                </div>

                {/* Tab content */}
                {sidebarTab === 'lessons' ? (
                  /* ---- Lessons list ---- */
                  <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 shrink-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-white/90">Conteudo do Curso</h3>
                          <p className="text-xs text-white/30 mt-0.5">
                            {completedCount} de {totalCount} aulas concluidas
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary tabular-nums">{progressPercent}%</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-700"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Modules */}
                    <div className="flex-1 overflow-y-auto">
                      {courseData.modules
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((mod) => {
                          const isExpanded = expandedModules.has(mod.id)
                          const modCompleted = mod.lessons.filter((l) => l.completed).length
                          const modTotal = mod.lessons.length
                          const modProgress = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0

                          return (
                            <div key={mod.id}>
                              <button
                                onClick={() => toggleModule(mod.id)}
                                className="w-full p-3 px-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors"
                              >
                                <div className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                                  modProgress === 100
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : modProgress > 0
                                      ? "bg-primary/10 text-primary"
                                      : "bg-white/[0.04] text-white/30"
                                )}>
                                  {modProgress === 100 ? (
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  ) : (
                                    <span>{modCompleted}/{modTotal}</span>
                                  )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="text-xs font-semibold text-white/70 truncate">
                                    {mod.name}
                                  </div>
                                </div>
                                <ChevronDown className={cn(
                                  "h-3.5 w-3.5 text-white/20 shrink-0 transition-transform duration-200",
                                  isExpanded ? "rotate-180" : ""
                                )} />
                              </button>

                              {/* Lessons */}
                              <div className={cn(
                                "overflow-hidden transition-all duration-200",
                                isExpanded ? "max-h-[2000px]" : "max-h-0"
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
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={cn(
                                          "flex items-center gap-3 py-2.5 px-4 pl-8 transition-all duration-150 border-l-2",
                                          isCurrent
                                            ? "bg-primary/[0.08] border-l-primary"
                                            : "border-l-transparent hover:bg-white/[0.02]"
                                        )}
                                      >
                                        {/* Status icon */}
                                        <div className="shrink-0">
                                          {lesson.completed ? (
                                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                                          ) : isCurrent ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            </div>
                                          ) : (
                                            <Circle className="h-4 w-4 text-white/15" />
                                          )}
                                        </div>
                                        {/* Lesson info */}
                                        <div className="flex-1 min-w-0">
                                          <div className={cn(
                                            "text-xs font-medium truncate",
                                            isCurrent ? "text-primary" : lesson.completed ? "text-emerald-400/70" : "text-white/50"
                                          )}>
                                            {lesson.title}
                                          </div>
                                          {lesson.duration_seconds != null && lesson.duration_seconds > 0 && (
                                            <div className="text-[10px] text-white/20 mt-0.5 tabular-nums">
                                              {formatDuration(lesson.duration_seconds)}
                                            </div>
                                          )}
                                        </div>
                                        {/* Navigate arrow */}
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
                  </div>
                ) : (
                  /* ---- PDF Viewer ---- */
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-white/[0.06] shrink-0">
                      <span className="text-xs font-medium text-white/50 truncate">
                        {pdfAttachments.find(p => p.file_url === pdfViewerUrl)?.file_name || 'Material'}
                      </span>
                      <div className="flex items-center gap-1">
                        <a
                          href={pdfViewerUrl || ''}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                          title="Baixar PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => { setPdfViewerUrl(null); setSidebarTab('lessons'); }}
                          className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                          title="Fechar PDF"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      {pdfViewerUrl && (
                        <iframe
                          src={pdfViewerUrl}
                          title="PDF Viewer"
                          className="w-full h-full border-0"
                        />
                      )}
                    </div>
                  </div>
                )}
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
              <aside className="fixed inset-y-0 right-0 z-50 w-[85%] max-w-[380px] lg:hidden bg-[#0d0d18] border-l border-white/[0.06] shadow-2xl flex flex-col">
                {/* Mobile sidebar header */}
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06] shrink-0">
                  <div>
                    <h3 className="font-bold text-sm text-white/90">Conteudo do Curso</h3>
                    <p className="text-xs text-white/30 mt-0.5">
                      {completedCount} de {totalCount} aulas
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Mobile progress */}
                <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/40">Progresso</span>
                    <span className="text-sm font-bold text-primary">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Mobile modules list */}
                <div className="flex-1 overflow-y-auto">
                  {courseData.modules
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((mod) => {
                      const isExpanded = expandedModules.has(mod.id)
                      const modCompleted = mod.lessons.filter((l) => l.completed).length
                      const modTotal = mod.lessons.length

                      return (
                        <div key={mod.id}>
                          <button
                            onClick={() => toggleModule(mod.id)}
                            className="w-full p-3 px-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04]"
                          >
                            <ChevronDown className={cn(
                              "h-3.5 w-3.5 text-white/20 shrink-0 transition-transform duration-200",
                              isExpanded ? "rotate-180" : "-rotate-90"
                            )} />
                            <div className="flex-1 text-left min-w-0">
                              <div className="text-xs font-semibold text-white/70 truncate">{mod.name}</div>
                              <div className="text-[10px] text-white/25 mt-0.5">{modCompleted}/{modTotal} aulas</div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div>
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
                                        "flex items-center gap-3 py-2.5 px-4 pl-10 transition-all border-l-2",
                                        isCurrent
                                          ? "bg-primary/[0.08] border-l-primary"
                                          : "border-l-transparent hover:bg-white/[0.02]"
                                      )}
                                    >
                                      <div className="shrink-0">
                                        {lesson.completed ? (
                                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                                        ) : isCurrent ? (
                                          <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                          </div>
                                        ) : (
                                          <Circle className="h-4 w-4 text-white/15" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className={cn(
                                          "text-xs font-medium truncate",
                                          isCurrent ? "text-primary" : lesson.completed ? "text-emerald-400/70" : "text-white/50"
                                        )}>
                                          {lesson.title}
                                        </div>
                                        {lesson.duration_seconds != null && lesson.duration_seconds > 0 && (
                                          <div className="text-[10px] text-white/20 mt-0.5">
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
              </aside>
            </>
          )}
        </div>
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
