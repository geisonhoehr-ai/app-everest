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
  Eye,
  GripVertical,
  Maximize2,
  Minimize2,
  ListVideo,
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
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [showModuleSelector, setShowModuleSelector] = useState(false)
  const [showResources, setShowResources] = useState(false)

  // Theater mode
  const [theaterMode, setTheaterMode] = useState(false)

  // PDF split view
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)
  const [splitRatio, setSplitRatio] = useState(55)
  const isDragging = useRef(false)
  const splitContainerRef = useRef<HTMLDivElement>(null)

  // Sidebar - collapsed by default
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(false)

  const currentLessonRef = useRef<HTMLAnchorElement>(null)
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

        const course = await courseService.getCourseWithModulesAndProgress(courseId, user.id)
        if (!course) {
          toast({ title: 'Curso nao encontrado', variant: 'destructive' })
          navigate('/courses')
          return
        }

        setCourseData(course as CourseData)

        const activeModuleId = (course.modules || []).find((m: ModuleData) =>
          m.lessons.some((l) => l.id === lessonId)
        )?.id
        if (activeModuleId) setSelectedModuleId(activeModuleId)

        let foundLesson: LessonData | null = null
        for (const mod of course.modules) {
          const lesson = (mod.lessons as LessonData[]).find((l) => l.id === lessonId)
          if (lesson) { foundLesson = lesson; break }
        }

        if (!foundLesson) {
          toast({ title: 'Aula nao encontrada', variant: 'destructive' })
          navigate(`/courses/${courseId}`)
          return
        }

        setLessonData(foundLesson)

        const { data: attData } = await supabase
          .from('lesson_attachments')
          .select('*')
          .eq('lesson_id', lessonId)

        setAttachments((attData as Attachment[]) || [])
        setPdfViewerUrl(null)
      } catch (error) {
        console.error('Error fetching lesson data:', error)
        toast({ title: 'Erro ao carregar aula', variant: 'destructive' })
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
      currentLessonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isLoading, lessonId])

  /* ---- Escape exits theater ---- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && theaterMode) setTheaterMode(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [theaterMode])

  /* ---- Resizable split ---- */
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
      setSplitRatio(Math.max(25, Math.min(75, ((ev.clientX - rect.left) / rect.width) * 100)))
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  /* ---- mark complete ---- */
  const handleMarkComplete = useCallback(async () => {
    if (!user?.id || !lessonId || !lessonData) return
    try {
      const { error } = await supabase.from('video_progress').upsert({
        user_id: user.id, lesson_id: lessonId,
        progress_percentage: 100, is_completed: true,
        current_time_seconds: lessonData.duration_seconds || 0,
      })
      if (error) throw error
      setLessonData({ ...lessonData, completed: true, progress: 100 })
      setCourseData((prev) => {
        if (!prev) return prev
        return { ...prev, modules: prev.modules.map((m) => ({
          ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, completed: true } : l),
        }))}
      })
      toast({ title: 'Aula concluida!', description: 'Parabens! Continue seu progresso.' })
      if (nextLesson) setTimeout(() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`), 1500)
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel marcar a aula como concluida.', variant: 'destructive' })
    }
  }, [user?.id, lessonId, lessonData, toast, nextLesson, courseId, navigate])

  /* ---- module helpers ---- */
  const sortedModules = useMemo(() => {
    if (!courseData) return []
    return [...courseData.modules].sort((a, b) => a.order_index - b.order_index)
  }, [courseData])

  const currentModule = useMemo(
    () => sortedModules.find((m) => m.id === selectedModuleId) || sortedModules[0] || null,
    [sortedModules, selectedModuleId],
  )
  const currentModuleLessons = useMemo(() => {
    if (!currentModule) return []
    return [...currentModule.lessons].sort((a, b) => a.order_index - b.order_index)
  }, [currentModule])
  const currentModuleIndex = useMemo(
    () => sortedModules.findIndex((m) => m.id === currentModule?.id),
    [sortedModules, currentModule],
  )

  const openPdfViewer = (url: string) => {
    if (pdfViewerUrl === url) { setPdfViewerUrl(null) }
    else { setPdfViewerUrl(url); setSplitRatio(55) }
  }

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
  /*  Loading                                                          */
  /* ---------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#09090b] dark:bg-[#09090b] bg-white dark:[&]:bg-[#09090b]">
        <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-3">
          <div className="h-6 w-6 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-40 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="flex-1 p-0">
          <div className="w-full bg-white/[0.04] animate-pulse" style={{ paddingBottom: '56.25%' }} />
          <div className="p-6 space-y-3">
            <div className="h-5 w-2/3 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-1/3 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!lessonData || !courseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#09090b]">
        <h2 className="text-xl font-semibold text-white">Aula nao encontrada</h2>
        <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar ao Curso
        </Button>
      </div>
    )
  }

  const sanitizedDescription = lessonData.description ? DOMPurify.sanitize(lessonData.description) : ''
  const modCompleted = currentModule?.lessons.filter((l) => l.completed).length || 0
  const modTotal = currentModule?.lessons.length || 0

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* Theater overlay */}
      {theaterMode && (
        <div
          className="fixed inset-0 z-[60] bg-black/92 backdrop-blur-md"
          onClick={() => setTheaterMode(false)}
          style={{ animation: 'lp-fade-in 0.3s ease-out' }}
        />
      )}

      <div className={cn("flex flex-col min-h-screen", theaterMode ? "bg-black" : "bg-[#09090b]")}>

        {/* ============================================================ */}
        {/* Top bar — ultra compact                                       */}
        {/* ============================================================ */}
        <header className={cn(
          "sticky top-0 z-[70] h-12 flex items-center gap-2 px-3 border-b transition-colors duration-300",
          theaterMode ? "bg-black/50 backdrop-blur-xl border-white/[0.04]" : "bg-[#09090b] border-white/[0.06]"
        )}>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-1.5 -ml-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="h-4 w-px bg-white/[0.08] mx-0.5" />

          <span className="text-[13px] text-zinc-500 truncate flex-1 font-medium">
            {courseData.name}
          </span>

          {/* Progress ring */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="relative w-7 h-7">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/[0.06]" />
                <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2"
                  className="text-primary" strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (1 - progressPercent / 100)}`}
                  strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-zinc-400 tabular-nums">
                {progressPercent}
              </span>
            </div>
            <span className="text-[11px] text-zinc-600 tabular-nums">{completedCount}/{totalCount}</span>
          </div>

          {/* Apagar Luz */}
          <button
            onClick={() => setTheaterMode(!theaterMode)}
            className={cn(
              "p-1.5 rounded-md transition-all",
              theaterMode ? "bg-primary/20 text-primary" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06]"
            )}
            title={theaterMode ? 'Acender Luz' : 'Apagar Luz'}
          >
            {theaterMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* Sidebar toggle */}
          <button
            onClick={() => setDesktopSidebarVisible(!desktopSidebarVisible)}
            className="hidden lg:block p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
          >
            {desktopSidebarVisible ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          </button>

          <button
            className="lg:hidden p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* ============================================================ */}
        {/* Main layout                                                    */}
        {/* ============================================================ */}
        <div className="flex flex-1 overflow-hidden">
          <div ref={mainContentRef} className="flex-1 overflow-y-auto">
            <div className={cn(
              "mx-auto transition-all duration-300",
              theaterMode ? "max-w-none" : desktopSidebarVisible ? "max-w-none" : "max-w-[1400px]"
            )}>

              {/* ======================================================== */}
              {/* Video + PDF                                                */}
              {/* ======================================================== */}
              <div
                ref={splitContainerRef}
                className={cn("relative", theaterMode ? "z-[65]" : "")}
              >
                {pdfViewerUrl ? (
                  <>
                    {/* Desktop split */}
                    <div className="hidden md:flex w-full" style={{ height: '70vh' }}>
                      <div style={{ width: `${splitRatio}%` }} className="relative shrink-0 bg-black">
                        {videoEmbedUrl ? (
                          <iframe src={videoEmbedUrl} title={lessonData.title}
                            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen className="absolute inset-0 w-full h-full" />
                        ) : <VideoPlaceholder />}
                      </div>
                      <div
                        onMouseDown={handleDragStart}
                        className="w-1.5 bg-white/[0.04] hover:bg-primary/60 cursor-col-resize flex items-center justify-center transition-colors group shrink-0"
                      >
                        <div className="w-0.5 h-8 rounded-full bg-white/10 group-hover:bg-primary/80 transition-colors" />
                      </div>
                      <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0f]">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs text-zinc-400 truncate">
                              {pdfAttachments.find(p => p.file_url === pdfViewerUrl)?.file_name || 'PDF'}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <a href={pdfViewerUrl} download target="_blank" rel="noopener noreferrer"
                              className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button onClick={() => setPdfViewerUrl(null)}
                              className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 relative">
                          <iframe src={pdfViewerUrl} title="PDF" className="absolute inset-0 w-full h-full border-0" />
                        </div>
                      </div>
                    </div>
                    {/* Mobile stacked */}
                    <div className="md:hidden">
                      <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                        {videoEmbedUrl ? (
                          <iframe src={videoEmbedUrl} title={lessonData.title}
                            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen className="absolute inset-0 w-full h-full" />
                        ) : <VideoPlaceholder />}
                      </div>
                      <div className="border-t border-white/[0.06]">
                        <div className="flex items-center justify-between px-3 py-2 bg-[#0c0c0f] border-b border-white/[0.06]">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs text-zinc-400 truncate">
                              {pdfAttachments.find(p => p.file_url === pdfViewerUrl)?.file_name || 'PDF'}
                            </span>
                          </div>
                          <button onClick={() => setPdfViewerUrl(null)} className="p-1 rounded text-zinc-600 hover:text-zinc-300">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div style={{ height: '50vh' }}>
                          <iframe src={pdfViewerUrl} title="PDF" className="w-full h-full border-0" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Normal video */
                  <div className={cn("relative w-full bg-black", theaterMode ? "" : "")}>
                    {videoEmbedUrl ? (
                      <div style={{ paddingBottom: theaterMode ? '48%' : '56.25%' }} className="relative">
                        <iframe src={videoEmbedUrl} title={lessonData.title}
                          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen className="absolute inset-0 w-full h-full" />
                      </div>
                    ) : (
                      <div style={{ paddingBottom: '56.25%' }} className="relative">
                        <VideoPlaceholder />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* Below video — info + actions                               */}
              {/* ======================================================== */}
              <div className={cn(
                "px-4 sm:px-6 lg:px-8 py-5",
                theaterMode ? "relative z-[65]" : ""
              )}>
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-white leading-snug tracking-tight">
                      {lessonData.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      {lessonData.duration_seconds != null && lessonData.duration_seconds > 0 && (
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {formatDuration(lessonData.duration_seconds)}
                        </span>
                      )}
                      {lessonData.completed && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <CheckCircle className="h-3 w-3" />
                          Concluida
                        </span>
                      )}
                      {currentModule && (
                        <span className="text-xs text-zinc-600">
                          Modulo {currentModuleIndex + 1} · {currentModule.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* PDF button */}
                    {pdfAttachments.length > 0 && pdfAttachments.map((pdf) => (
                      <button key={pdf.id} onClick={() => openPdfViewer(pdf.file_url)}
                        className={cn(
                          "flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium transition-all border",
                          pdfViewerUrl === pdf.file_url
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-zinc-400 border-white/[0.08] hover:border-white/[0.15] hover:text-white bg-white/[0.03] hover:bg-white/[0.06]"
                        )}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline max-w-[100px] truncate">PDF</span>
                        {pdfViewerUrl === pdf.file_url ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                      </button>
                    ))}

                    {/* Mark complete */}
                    <button onClick={handleMarkComplete} disabled={lessonData.completed}
                      className={cn(
                        "flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold transition-all",
                        lessonData.completed
                          ? "bg-emerald-500/10 text-emerald-400 cursor-default"
                          : "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.97]"
                      )}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {lessonData.completed ? 'Concluida' : 'Concluir aula'}
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                  {prevLesson ? (
                    <Link to={`/courses/${courseId}/lessons/${prevLesson.id}`}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors group">
                      <SkipBack className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="hidden sm:inline max-w-[200px] truncate">{prevLesson.title}</span>
                      <span className="sm:hidden">Anterior</span>
                    </Link>
                  ) : <div />}
                  {nextLesson ? (
                    <Link to={`/courses/${courseId}/lessons/${nextLesson.id}`}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors group">
                      <span className="hidden sm:inline max-w-[200px] truncate">{nextLesson.title}</span>
                      <span className="sm:hidden">Proxima</span>
                      <SkipForward className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ) : <div />}
                </div>
              </div>

              {/* ======================================================== */}
              {/* Description + Resources                                    */}
              {/* ======================================================== */}
              <div className={cn("px-4 sm:px-6 lg:px-8 pb-8 space-y-4", theaterMode ? "relative z-[65]" : "")}>
                {sanitizedDescription && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-5">
                    <div className="prose prose-sm prose-invert max-w-none prose-p:text-zinc-400 prose-headings:text-zinc-200 prose-a:text-primary prose-strong:text-zinc-300"
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
                  </div>
                )}

                {/* Resources */}
                {attachments.length > 0 && (
                  <div className="rounded-lg border border-white/[0.06] overflow-hidden">
                    <button onClick={() => setShowResources((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-medium text-zinc-300">Recursos</span>
                        <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{attachments.length}</span>
                      </div>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-600 transition-transform", showResources ? "rotate-180" : "")} />
                    </button>
                    {showResources && (
                      <div className="px-4 pb-3 space-y-1.5 border-t border-white/[0.04]">
                        {attachments.map((att) => {
                          const isPdf = att.file_type?.includes('pdf') || att.file_name?.endsWith('.pdf')
                          return (
                            <div key={att.id} className="flex items-center justify-between p-2.5 rounded-md bg-white/[0.02] hover:bg-white/[0.04] transition-colors group mt-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className={cn("h-4 w-4 shrink-0", isPdf ? "text-red-400" : "text-zinc-500")} />
                                <span className="text-xs text-zinc-400 truncate group-hover:text-zinc-200">{att.file_name}</span>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {isPdf && (
                                  <button onClick={() => openPdfViewer(att.file_url)}
                                    className="p-1 rounded text-zinc-600 hover:text-primary transition-colors" title="Abrir ao lado">
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <a href={att.file_url} download target="_blank" rel="noopener noreferrer"
                                  className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors" title="Baixar">
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

          {/* ============================================================ */}
          {/* Desktop Sidebar                                               */}
          {/* ============================================================ */}
          <aside className={cn(
            "hidden lg:flex flex-col overflow-hidden transition-all duration-300 border-l",
            "bg-[#0c0c0f] border-white/[0.06]",
            desktopSidebarVisible ? "w-[320px] min-w-[320px]" : "w-0 min-w-0 border-l-0"
          )}>
            {desktopSidebarVisible && (
              <>
                {/* Module selector */}
                <div className="shrink-0 relative">
                  <button onClick={() => setShowModuleSelector((v) => !v)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.06]">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-primary">{currentModuleIndex + 1}</span>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-[13px] font-medium text-zinc-200 truncate">{currentModule?.name}</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5">{modCompleted}/{modTotal} concluidas</div>
                    </div>
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 text-zinc-600 shrink-0 transition-transform",
                      showModuleSelector ? "rotate-180" : ""
                    )} />
                  </button>
                  {showModuleSelector && (
                    <div className="absolute left-0 right-0 top-full z-20 bg-[#111114] border border-white/[0.08] shadow-2xl shadow-black/50 max-h-[280px] overflow-y-auto">
                      {sortedModules.map((mod, idx) => {
                        const mc = mod.lessons.filter((l) => l.completed).length
                        const mt = mod.lessons.length
                        const isSel = mod.id === currentModule?.id
                        return (
                          <button key={mod.id}
                            onClick={() => { setSelectedModuleId(mod.id); setShowModuleSelector(false) }}
                            className={cn(
                              "w-full px-4 py-2.5 flex items-center gap-3 text-left border-b border-white/[0.04] last:border-b-0 transition-colors",
                              isSel ? "bg-primary/[0.08]" : "hover:bg-white/[0.03]"
                            )}>
                            <div className={cn(
                              "w-5 h-5 rounded flex items-center justify-center shrink-0 text-[10px] font-bold",
                              isSel ? "bg-primary text-white" : "bg-white/[0.06] text-zinc-500"
                            )}>{idx + 1}</div>
                            <span className={cn("text-xs truncate flex-1", isSel ? "text-primary font-medium" : "text-zinc-400")}>{mod.name}</span>
                            <span className="text-[10px] text-zinc-600 tabular-nums shrink-0">{mc}/{mt}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Lesson list */}
                <div className="flex-1 overflow-y-auto">
                  {currentModuleLessons.map((lesson, idx) => {
                    const isCurrent = lesson.id === lessonId
                    return (
                      <Link key={lesson.id}
                        ref={isCurrent ? currentLessonRef : undefined}
                        to={`/courses/${courseId}/lessons/${lesson.id}`}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 transition-all border-l-2",
                          isCurrent
                            ? "bg-primary/[0.06] border-l-primary"
                            : "border-l-transparent hover:bg-white/[0.03]"
                        )}>
                        {/* Lesson number or status */}
                        <div className="shrink-0 w-5 flex justify-center">
                          {lesson.completed ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium text-zinc-600 tabular-nums">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-[13px] truncate leading-tight",
                            isCurrent ? "text-white font-medium" : lesson.completed ? "text-zinc-500" : "text-zinc-400"
                          )}>
                            {lesson.title}
                          </div>
                          {lesson.duration_seconds != null && lesson.duration_seconds > 0 && (
                            <div className="text-[11px] text-zinc-700 mt-0.5 tabular-nums">
                              {formatDuration(lesson.duration_seconds)}
                            </div>
                          )}
                        </div>
                        {isCurrent && <div className="w-1 h-1 rounded-full bg-primary shrink-0" />}
                      </Link>
                    )
                  })}
                </div>

                {/* Module progress bar at bottom */}
                <div className="shrink-0 px-4 py-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-zinc-600">Progresso do modulo</span>
                    <span className="text-[11px] font-medium text-primary tabular-nums">
                      {modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${modTotal > 0 ? (modCompleted / modTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              </>
            )}
          </aside>

          {/* ============================================================ */}
          {/* Mobile sidebar                                                */}
          {/* ============================================================ */}
          {isSidebarOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
                onClick={() => setIsSidebarOpen(false)} />
              <aside className="fixed inset-y-0 right-0 z-50 w-[85%] max-w-[360px] lg:hidden bg-[#0c0c0f] border-l border-white/[0.06] shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
                  <div className="flex items-center gap-2">
                    <ListVideo className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-zinc-200">Aulas</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-md text-zinc-600 hover:text-white hover:bg-white/[0.06] transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Module selector (mobile) */}
                <div className="shrink-0 relative">
                  <button onClick={() => setShowModuleSelector((v) => !v)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.06]">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary">{currentModuleIndex + 1}</span>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-medium text-zinc-300 truncate">{currentModule?.name}</div>
                    </div>
                    <ChevronDown className={cn("h-3 w-3 text-zinc-600 transition-transform", showModuleSelector ? "rotate-180" : "")} />
                  </button>
                  {showModuleSelector && (
                    <div className="absolute left-0 right-0 top-full z-20 bg-[#111114] border border-white/[0.08] shadow-2xl max-h-[250px] overflow-y-auto">
                      {sortedModules.map((mod, idx) => {
                        const isSel = mod.id === currentModule?.id
                        return (
                          <button key={mod.id}
                            onClick={() => { setSelectedModuleId(mod.id); setShowModuleSelector(false) }}
                            className={cn(
                              "w-full px-4 py-2 flex items-center gap-2.5 text-left border-b border-white/[0.04] last:border-b-0",
                              isSel ? "bg-primary/[0.08]" : "hover:bg-white/[0.03]"
                            )}>
                            <div className={cn(
                              "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold",
                              isSel ? "bg-primary text-white" : "bg-white/[0.06] text-zinc-500"
                            )}>{idx + 1}</div>
                            <span className={cn("text-xs truncate", isSel ? "text-primary" : "text-zinc-400")}>{mod.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Lessons */}
                <div className="flex-1 overflow-y-auto">
                  {currentModuleLessons.map((lesson, idx) => {
                    const isCurrent = lesson.id === lessonId
                    return (
                      <Link key={lesson.id}
                        ref={isCurrent ? currentLessonRef : undefined}
                        to={`/courses/${courseId}/lessons/${lesson.id}`}
                        onClick={() => setIsSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 border-l-2 transition-all",
                          isCurrent ? "bg-primary/[0.06] border-l-primary" : "border-l-transparent hover:bg-white/[0.03]"
                        )}>
                        <div className="shrink-0 w-5 flex justify-center">
                          {lesson.completed ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            </div>
                          ) : (
                            <span className="text-[11px] text-zinc-600 tabular-nums">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-xs truncate",
                            isCurrent ? "text-white font-medium" : lesson.completed ? "text-zinc-500" : "text-zinc-400"
                          )}>{lesson.title}</div>
                          {lesson.duration_seconds != null && lesson.duration_seconds > 0 && (
                            <div className="text-[10px] text-zinc-700 mt-0.5">{formatDuration(lesson.duration_seconds)}</div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </aside>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes lp-fade-in { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  )
}

/* Small presentational sub-component */
function VideoPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b]">
      <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
        <Play className="h-6 w-6 text-zinc-600 ml-0.5" />
      </div>
      <p className="text-xs text-zinc-600">Video nao disponivel</p>
    </div>
  )
}
