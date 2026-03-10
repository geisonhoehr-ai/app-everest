import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { courseService } from '@/services/courseService'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { RichTextEditor } from '@/components/RichTextEditor'
import { rankingService } from '@/services/rankingService'
import {
  lessonInteractionService,
  type LessonComment,
  type LessonRatingStats,
} from '@/services/lessonInteractionService'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  CheckCircle,
  Play,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  Maximize2,
  Minimize2,
  ListVideo,
  MessageSquare,
  Star,
  Send,
  Trash2,
  Reply,
  StickyNote,
  Search,
  Save,
  Loader2,
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

/** Strip date/time stamps and "- Recording" suffix from lesson titles */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*-\s*\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}\s+GMT[^\s]*/, '')
    .replace(/\s*-\s*Recording\s*$/i, '')
    .trim()
}

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
  // Theater mode
  const [theaterMode, setTheaterMode] = useState(false)

  // PDF split view
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)
  const [splitRatio, setSplitRatio] = useState(55)
  const isDragging = useRef(false)
  const splitContainerRef = useRef<HTMLDivElement>(null)

  // Sidebar - collapsed by default
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(false)

  // XP animation
  const [showXpAnimation, setShowXpAnimation] = useState(false)

  // Comments & Ratings
  const [comments, setComments] = useState<LessonComment[]>([])
  const [ratingStats, setRatingStats] = useState<LessonRatingStats>({ average: 0, total: 0, userRating: null })
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [activeTab, setActiveTab] = useState<'comments' | 'resources' | 'notes'>('comments')

  // Notes
  const [noteContent, setNoteContent] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteLastSaved, setNoteLastSaved] = useState<string | null>(null)
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-play next lesson
  const [autoPlayNext, setAutoPlayNext] = useState(() => {
    return localStorage.getItem('everest-autoplay') !== 'false'
  })

  // Search in sidebar
  const [lessonSearch, setLessonSearch] = useState('')

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
          toast({ title: 'Curso não encontrado', variant: 'destructive' })
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
          toast({ title: 'Aula não encontrada', variant: 'destructive' })
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

        // Fetch comments, ratings, and notes
        const [commentsData, ratingsData, noteData] = await Promise.all([
          lessonInteractionService.getComments(lessonId),
          lessonInteractionService.getRatingStats(lessonId, user.id),
          lessonInteractionService.getNote(lessonId, user.id),
        ])
        setComments(commentsData)
        setRatingStats(ratingsData)
        setNoteContent(noteData)
        setNoteLastSaved(noteData ? 'Salvo' : null)
      } catch (error) {
        logger.error('Error fetching lesson data:', error)
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

      // Award XP
      await rankingService.addUserScore(user.id, 'video_lesson', 10, lessonId)
      setShowXpAnimation(true)
      setTimeout(() => setShowXpAnimation(false), 2000)

      setLessonData({ ...lessonData, completed: true, progress: 100 })
      setCourseData((prev) => {
        if (!prev) return prev
        return {
          ...prev, modules: prev.modules.map((m) => ({
            ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, completed: true } : l),
          }))
        }
      })
      toast({ title: 'Aula concluida!', description: 'Parabens! +10 XP. Continue seu progresso.' })
      if (nextLesson) setTimeout(() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`), 1500)
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel marcar a aula como concluida.', variant: 'destructive' })
    }
  }, [user?.id, lessonId, lessonData, toast, nextLesson, courseId, navigate])

  /* ---- comment & rating handlers ---- */
  const handleSubmitComment = useCallback(async (parentId?: string) => {
    if (!user?.id || !lessonId) return
    const text = parentId ? replyText : commentText
    if (!text.trim()) return

    setSubmittingComment(true)
    try {
      const newComment = await lessonInteractionService.addComment(lessonId, user.id, text.trim(), parentId)
      if (newComment) {
        // Award XP for commenting
        await rankingService.addUserScore(user.id, 'lesson_comment', 5, lessonId)
        // Refresh comments
        const updated = await lessonInteractionService.getComments(lessonId)
        setComments(updated)
        setCommentText('')
        setReplyText('')
        setReplyingTo(null)
        toast({ title: 'Comentario enviado! +5 XP' })
      }
    } catch {
      toast({ title: 'Erro ao enviar comentario', variant: 'destructive' })
    } finally {
      setSubmittingComment(false)
    }
  }, [user?.id, lessonId, commentText, replyText, toast])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!user?.id || !lessonId) return
    const ok = await lessonInteractionService.deleteComment(commentId, user.id)
    if (ok) {
      const updated = await lessonInteractionService.getComments(lessonId)
      setComments(updated)
      toast({ title: 'Comentario removido' })
    }
  }, [user?.id, lessonId, toast])

  const handleRate = useCallback(async (rating: number) => {
    if (!user?.id || !lessonId) return
    const ok = await lessonInteractionService.rateLesson(lessonId, user.id, rating)
    if (ok) {
      // Award XP for first rating only
      if (!ratingStats.userRating) {
        await rankingService.addUserScore(user.id, 'lesson_rating', 3, lessonId)
        toast({ title: `Avaliacao registrada! +3 XP` })
      } else {
        toast({ title: 'Avaliacao atualizada!' })
      }
      const updated = await lessonInteractionService.getRatingStats(lessonId, user.id)
      setRatingStats(updated)
    }
  }, [user?.id, lessonId, ratingStats.userRating, toast])

  /* ---- notes auto-save (debounced) ---- */
  const handleNoteChange = useCallback((value: string) => {
    setNoteContent(value)
    setNoteLastSaved('Salvando...')
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current)
    noteTimerRef.current = setTimeout(async () => {
      if (!user?.id || !lessonId) return
      setNoteSaving(true)
      const ok = await lessonInteractionService.saveNote(lessonId, user.id, value)
      setNoteSaving(false)
      setNoteLastSaved(ok ? 'Salvo' : 'Erro ao salvar')
    }, 1500)
  }, [user?.id, lessonId])

  /* ---- auto-play toggle ---- */
  const toggleAutoPlay = useCallback(() => {
    setAutoPlayNext(prev => {
      const next = !prev
      localStorage.setItem('everest-autoplay', String(next))
      return next
    })
  }, [])

  /* ---- listen for video end (Panda Video postMessage) ---- */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.event === 'onEnded' || data?.message === 'ended' || data?.type === 'ended') {
          if (autoPlayNext && nextLesson) {
            navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)
          }
        }
      } catch { /* ignore non-JSON messages */ }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [autoPlayNext, nextLesson, courseId, navigate])

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

  /* ---- filtered lessons for search ---- */
  const filteredLessons = useMemo(() => {
    if (!lessonSearch.trim()) return currentModuleLessons
    const q = lessonSearch.toLowerCase()
    return currentModuleLessons.filter(l => l.title.toLowerCase().includes(q))
  }, [currentModuleLessons, lessonSearch])

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
      <div className="flex flex-col min-h-screen bg-background">
        <div className="h-12 border-b border-border flex items-center px-4 gap-3">
          <div className="h-6 w-6 rounded bg-muted animate-pulse" />
          <div className="h-3 w-40 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex-1 p-0">
          <div className="w-full bg-muted/50 animate-pulse" style={{ paddingBottom: '56.25%' }} />
          <div className="p-6 space-y-3">
            <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/3 rounded bg-muted/70 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!lessonData || !courseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-background">
        <h2 className="text-xl font-semibold text-foreground">Aula não encontrada</h2>
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
  /*  Sidebar content (shared between desktop and mobile)              */
  /* ---------------------------------------------------------------- */

  const renderModuleSelector = (isMobile: boolean) => (
    <div className="shrink-0 relative">
      <button onClick={() => setShowModuleSelector((v) => !v)}
        className={cn(
          "w-full px-4 flex items-center gap-3 hover:bg-accent/50 transition-colors border-b border-border",
          isMobile ? "py-2.5" : "py-3"
        )}>
        <div className={cn(
          "rounded-lg flex items-center justify-center shrink-0",
          isMobile ? "w-6 h-6" : "w-7 h-7",
          modCompleted === modTotal && modTotal > 0
            ? "bg-emerald-500/15 text-emerald-600"
            : "bg-primary text-primary-foreground"
        )}>
          {modCompleted === modTotal && modTotal > 0 ? (
            <CheckCircle className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
          ) : (
            <span className={cn("font-bold", isMobile ? "text-[10px]" : "text-[11px]")}>
              {currentModuleIndex + 1}
            </span>
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className={cn(
            "font-medium text-foreground truncate",
            isMobile ? "text-xs" : "text-[13px]"
          )}>
            {currentModule?.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[100px]">
              <div className={cn(
                "h-full rounded-full transition-all",
                modCompleted === modTotal && modTotal > 0 ? "bg-emerald-500" : "bg-primary"
              )} style={{ width: `${modTotal > 0 ? (modCompleted / modTotal) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">{modCompleted}/{modTotal} concluidas</span>
          </div>
        </div>
        <ChevronDown className={cn(
          "text-muted-foreground shrink-0 transition-transform",
          isMobile ? "h-3 w-3" : "h-3.5 w-3.5",
          showModuleSelector ? "rotate-180" : ""
        )} />
      </button>
      {showModuleSelector && (
        <div className="absolute left-4 right-4 top-[calc(100%+8px)] z-20 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl shadow-black/30 max-h-[360px] overflow-y-auto overflow-x-hidden p-2">
          {sortedModules.map((mod, idx) => {
            const mc = mod.lessons.filter((l) => l.completed).length
            const mt = mod.lessons.length
            const modProgress = mt > 0 ? Math.round((mc / mt) * 100) : 0
            const isSel = mod.id === currentModule?.id
            return (
              <button key={mod.id}
                onClick={() => { setSelectedModuleId(mod.id); setShowModuleSelector(false) }}
                className={cn(
                  "w-full px-3 py-3 mb-1.5 flex items-center gap-3 text-left rounded-lg transition-all group/mod",
                  isSel ? "bg-emerald-500/10 ring-1 ring-emerald-500/20" : "hover:bg-muted/60"
                )}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all shadow-sm",
                  modProgress === 100
                    ? "bg-emerald-500 text-white"
                    : isSel
                      ? "bg-emerald-500 text-emerald-50"
                      : "bg-muted-foreground/10 text-muted-foreground group-hover/mod:bg-emerald-500/20 group-hover/mod:text-emerald-500"
                )}>
                  {modProgress === 100 ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-[13px] truncate block mb-1 tracking-tight transition-colors",
                    isSel ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-foreground/80 group-hover/mod:text-foreground font-medium"
                  )}>{mod.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
                      <div className={cn(
                        "h-full rounded-full transition-all duration-500",
                        modProgress === 100 ? "bg-emerald-500" : isSel ? "bg-emerald-400" : "bg-primary/40 group-hover/mod:bg-emerald-400"
                      )} style={{ width: `${modProgress}%` }} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold tabular-nums shrink-0",
                      isSel ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-muted-foreground"
                    )}>{mc} / {mt}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderLessonList = (isMobile: boolean) => (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Search */}
      <div className="px-3 py-2.5 shrink-0 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            type="text"
            value={lessonSearch}
            onChange={(e) => setLessonSearch(e.target.value)}
            placeholder="Buscar aula..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-muted/60 text-foreground placeholder:text-muted-foreground/50 transition-all"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredLessons.map((lesson, idx) => {
          const isCurrent = lesson.id === lessonId
          const isLast = idx === filteredLessons.length - 1
          const prevCompleted = idx > 0 && filteredLessons[idx - 1]?.completed
          const nextCompleted = !isLast && filteredLessons[idx + 1]?.completed
          return (
            <Link key={lesson.id}
              ref={isCurrent ? currentLessonRef : undefined}
              to={`/courses/${courseId}/lessons/${lesson.id}`}
              onClick={isMobile ? () => setIsSidebarOpen(false) : undefined}
              className={cn(
                "group/lesson relative flex items-center gap-3 pl-4 pr-4 py-2.5 transition-all",
                isCurrent
                  ? "bg-primary/10"
                  : "hover:bg-muted/40"
              )}>
              {/* Timeline node + lines */}
              <div className="relative shrink-0 w-6 flex flex-col items-center self-stretch">
                {/* Line above (from top of cell to node) */}
                {idx > 0 && (
                  <div className={cn(
                    "w-0.5 flex-1 min-h-1",
                    prevCompleted && lesson.completed
                      ? "bg-emerald-500"
                      : prevCompleted
                        ? "bg-gradient-to-b from-emerald-500 to-border"
                        : "bg-border"
                  )} />
                )}
                {idx === 0 && <div className="flex-1" />}
                {/* Node */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center rounded-full border-2 shrink-0 transition-all duration-200",
                  isMobile ? "w-5 h-5" : "w-6 h-6",
                  lesson.completed
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isCurrent
                      ? "border-primary bg-primary text-white shadow-md shadow-primary/30"
                      : "border-muted-foreground/30 bg-card group-hover/lesson:border-primary/50"
                )}>
                  {lesson.completed ? (
                    <CheckCircle className={cn(isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
                  ) : isCurrent ? (
                    <Play className={cn(isMobile ? "h-2.5 w-2.5" : "h-3 w-3", "ml-px")} />
                  ) : (
                    <span className="text-[9px] font-bold text-muted-foreground tabular-nums">{idx + 1}</span>
                  )}
                </div>
                {/* Line below (from node to bottom of cell) */}
                {!isLast ? (
                  <div className={cn(
                    "w-0.5 flex-1 min-h-1",
                    lesson.completed && nextCompleted
                      ? "bg-emerald-500"
                      : lesson.completed
                        ? "bg-gradient-to-b from-emerald-500 to-border"
                        : "bg-border"
                  )} />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "truncate leading-tight",
                  isMobile ? "text-xs" : "text-[13px]",
                  isCurrent ? "text-primary font-semibold" : lesson.completed ? "text-foreground/60" : "text-foreground/80 group-hover/lesson:text-foreground"
                )}>
                  {cleanTitle(lesson.title)}
                </div>
                {lesson.duration_seconds != null && lesson.duration_seconds > 0 && (
                  <div className="text-[11px] text-muted-foreground/70 mt-0.5 tabular-nums">
                    {formatDuration(lesson.duration_seconds)}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
        {filteredLessons.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground/60">Nenhuma aula encontrada</div>
        )}
      </div>
    </div>
  )

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

      <div className={cn("flex flex-col min-h-screen", theaterMode ? "bg-black" : "bg-background")}>

        {/* ============================================================ */}
        {/* Top bar                                                       */}
        {/* ============================================================ */}
        <header className={cn(
          "sticky top-0 z-[70] h-16 flex items-center gap-4 px-6 border-b transition-colors duration-300",
          theaterMode ? "bg-black/80 border-transparent backdrop-blur-sm" : "bg-card border-border"
        )}>
          {theaterMode ? (
            /* Theater mode: only show "Acender Luz" button */
            <>
              <div className="flex-1" />
              <button
                onClick={() => setTheaterMode(false)}
                className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-500 transition-all hover:bg-emerald-500/30"
                title="Acender Luz"
              >
                <Sun className="h-5 w-5" />
              </button>
            </>
          ) : (
            /* Normal mode: full header */
            <>
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-all group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <div className="h-5 w-px bg-border mx-1" />

              <span className="text-[13px] text-muted-foreground truncate flex-1 font-medium">
                {courseData.name}
              </span>

              {/* Progress bar */}
              <div className="hidden sm:flex flex-col justify-center min-w-[200px] gap-1 ml-4 mr-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Módulo Atual</span>
                  <span className="tabular-nums">{modCompleted}/{modTotal} ({modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0}%)</span>
                </div>
                <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${modTotal > 0 ? (modCompleted / modTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Apagar Luz */}
              <button
                onClick={() => setTheaterMode(true)}
                className="p-2.5 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                title="Apagar Luz"
              >
                <Moon className="h-5 w-5" />
              </button>

              {/* Sidebar toggle */}
              <button
                onClick={() => setDesktopSidebarVisible(!desktopSidebarVisible)}
                className="hidden lg:block p-2.5 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
              >
                {desktopSidebarVisible ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
              </button>

              <button
                className="lg:hidden p-2.5 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </>
          )}
        </header>

        {/* Progress bar below header */}
        {!theaterMode && (
          <div className="h-1 bg-muted/50 shrink-0">
            <div
              className="h-full bg-emerald-500 rounded-r-full transition-all duration-700 ease-out"
              style={{ width: `${modTotal > 0 ? (modCompleted / modTotal) * 100 : 0}%` }}
            />
          </div>
        )}

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
                    <div className="hidden md:flex w-full px-4 pt-4" style={{ height: '70vh' }}>
                      <div style={{ width: `${splitRatio}%` }} className="relative shrink-0 bg-black rounded-xl overflow-hidden ring-1 ring-border/50 shadow-md">
                        {videoEmbedUrl ? (
                          <iframe src={videoEmbedUrl} title={lessonData.title}
                            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen className="absolute inset-0 w-full h-full border-0" />
                        ) : <VideoPlaceholder />}
                      </div>
                      <div
                        onMouseDown={handleDragStart}
                        className="w-1.5 bg-muted/30 hover:bg-primary/60 cursor-col-resize flex items-center justify-center transition-colors group shrink-0"
                      >
                        <div className="w-0.5 h-8 rounded-full bg-muted-foreground/20 group-hover:bg-primary/80 transition-colors" />
                      </div>
                      <div className="flex-1 flex flex-col min-w-0 bg-card">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">
                              {pdfAttachments.find(p => p.file_url === pdfViewerUrl)?.file_name || 'PDF'}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <a href={pdfViewerUrl} download target="_blank" rel="noopener noreferrer"
                              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button onClick={() => setPdfViewerUrl(null)}
                              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
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
                    <div className="md:hidden p-3 pb-0">
                      <div className="relative w-full bg-black rounded-lg overflow-hidden ring-1 ring-border/50 shadow-sm" style={{ paddingBottom: '56.25%' }}>
                        {videoEmbedUrl ? (
                          <iframe src={videoEmbedUrl} title={lessonData.title}
                            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen className="absolute inset-0 w-full h-full border-0" />
                        ) : <VideoPlaceholder />}
                      </div>
                      <div className="border-t border-border">
                        <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs text-muted-foreground truncate">
                              {pdfAttachments.find(p => p.file_url === pdfViewerUrl)?.file_name || 'PDF'}
                            </span>
                          </div>
                          <button onClick={() => setPdfViewerUrl(null)} className="p-1.5 rounded text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
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
                  <div className={cn("relative w-full transition-all duration-300", theaterMode ? "bg-black" : "px-4 md:px-6 lg:px-8 py-4 sm:py-6 bg-background")}>
                    <div className={cn("relative bg-black transition-all duration-300", theaterMode ? "w-full" : "rounded-2xl overflow-hidden ring-1 ring-border/50 shadow-xl")}>
                      {videoEmbedUrl ? (
                        <div style={{ paddingBottom: theaterMode ? '52%' : '56.25%' }} className="relative transition-all duration-300">
                          <iframe src={videoEmbedUrl} title={lessonData.title}
                            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen className="absolute inset-0 w-full h-full border-0" />
                        </div>
                      ) : (
                        <div style={{ paddingBottom: '56.25%' }} className="relative">
                          <VideoPlaceholder />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* Below video — info + actions                               */}
              {/* ======================================================== */}
              <div className={cn(
                "px-4 sm:px-6 lg:px-8 py-5 bg-card border-b border-border",
                theaterMode ? "hidden" : ""
              )}>
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground leading-snug tracking-tight">
                      {cleanTitle(lessonData.title)}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {currentModule && (
                        <span className="text-xs text-muted-foreground">
                          Modulo {currentModuleIndex + 1} · {currentModule.name}
                        </span>
                      )}
                      {lessonData.duration_seconds != null && lessonData.duration_seconds > 0 && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDuration(lessonData.duration_seconds)}
                        </span>
                      )}
                      {lessonData.completed && (
                        <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                          <CheckCircle className="h-3 w-3" />
                          Concluida
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 relative">
                    {/* PDF button */}
                    {pdfAttachments.length > 0 && pdfAttachments.map((pdf) => (
                      <button key={pdf.id} onClick={() => openPdfViewer(pdf.file_url)}
                        className={cn(
                          "flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium transition-all border min-h-[44px]",
                          pdfViewerUrl === pdf.file_url
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground bg-muted/30 hover:bg-muted/50"
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
                        "flex items-center gap-2.5 h-10 px-5 rounded-xl text-sm font-semibold transition-all min-h-[44px]",
                        lessonData.completed
                          ? "bg-emerald-500/10 text-emerald-500 cursor-default"
                          : "bg-primary hover:bg-emerald-500 text-primary-foreground hover:text-white shadow-lg shadow-primary/20 hover:shadow-emerald-500/30 active:scale-[0.97]"
                      )}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {lessonData.completed ? 'Concluída' : 'Concluir aula'}
                    </button>

                    {/* XP animation */}
                    {showXpAnimation && (
                      <span
                        className="absolute -top-6 right-0 text-sm font-bold text-emerald-500 animate-bounce"
                        style={{ animation: 'lp-xp-float 1.5s ease-out forwards' }}
                      >
                        +10 XP
                      </span>
                    )}
                  </div>
                </div>

                {/* Auto-play toggle */}
                <div className="flex items-center justify-end mt-4">
                  <button
                    onClick={toggleAutoPlay}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      autoPlayNext ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "relative w-8 h-[18px] rounded-full transition-colors",
                      autoPlayNext ? "bg-primary" : "bg-muted"
                    )}>
                      <div className={cn(
                        "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all",
                        autoPlayNext ? "left-[15px]" : "left-[2px]"
                      )} />
                    </div>
                    Auto-play
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-5 border-t border-border">
                  {prevLesson && (
                    <Link to={`/courses/${courseId}/lessons/${prevLesson.id}`}
                      className="flex-1 flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-border bg-card hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all duration-200 group">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-colors">
                        <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">Aula Anterior</span>
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{cleanTitle(prevLesson.title)}</p>
                      </div>
                    </Link>
                  )}
                  {nextLesson && (
                    <Link to={`/courses/${courseId}/lessons/${nextLesson.id}`}
                      className="flex-1 flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-border bg-card hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all duration-200 group text-right">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">Próxima Aula</span>
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{cleanTitle(nextLesson.title)}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors shadow-sm">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* Description                                                 */}
              {/* ======================================================== */}
              {sanitizedDescription && (
                <div className={cn("px-4 sm:px-6 lg:px-8 py-4 bg-muted/30", theaterMode ? "hidden" : "")}>
                  <div className="rounded-lg bg-card border border-border p-5">
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground"
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* Rating + Tabs (Comments / Resources)                       */}
              {/* ======================================================== */}
              <div className={cn("px-4 sm:px-6 lg:px-8 pb-16 pt-10 bg-muted/10 border-t border-border mt-4", theaterMode ? "hidden" : "")}>
                <div className="w-full space-y-6">

                  {/* Star Rating Box */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 px-6 border border-border bg-card rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Star className="h-6 w-6 text-amber-500 drop-shadow-sm" />
                      </div>
                      <div>
                        <span className="text-base font-semibold text-foreground block mb-0.5">Avaliação da aula</span>
                        <span className="text-xs sm:text-sm text-muted-foreground leading-snug">O que você achou deste conteúdo? Deixe seu voto.</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 bg-muted/30 sm:bg-transparent px-4 sm:px-0 py-3 sm:py-0 rounded-xl sm:rounded-none">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRate(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110 active:scale-90"
                          >
                            <Star className={cn(
                              "h-6 w-6 sm:h-7 sm:w-7 transition-all duration-300",
                              (hoverRating || ratingStats.userRating || 0) >= star
                                ? "fill-amber-400 text-amber-400 drop-shadow-md"
                                : "text-border hover:text-amber-400/50"
                            )} />
                          </button>
                        ))}
                      </div>
                      {ratingStats.total > 0 && (
                        <div className="pl-3 sm:pl-4 border-l border-border flex flex-col items-center justify-center min-w-[50px]">
                          <span className="text-lg font-bold text-foreground leading-none mb-0.5">
                            {ratingStats.average.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {ratingStats.total} {ratingStats.total === 1 ? 'voto' : 'votos'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interaction Card */}
                  <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    {/* Tab buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 border-b border-border p-3 sm:px-6">
                      <button
                        onClick={() => setActiveTab('comments')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border",
                          activeTab === 'comments'
                            ? "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400 shadow-sm"
                            : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        )}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Comentários
                        {comments.length > 0 && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors",
                            activeTab === 'comments' ? "bg-orange-500/20 text-orange-600 dark:text-orange-400" : "bg-muted-foreground/15 text-muted-foreground"
                          )}>
                            {comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)}
                          </span>
                        )}
                      </button>
                      {attachments.length > 0 && (
                        <button
                          onClick={() => setActiveTab('resources')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border",
                            activeTab === 'resources'
                              ? "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400 shadow-sm"
                              : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                          )}
                        >
                          <Paperclip className="h-4 w-4" />
                          Arquivos
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors",
                            activeTab === 'resources' ? "bg-orange-500/20 text-orange-600 dark:text-orange-400" : "bg-muted-foreground/15 text-muted-foreground"
                          )}>{attachments.length}</span>
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab('notes')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border",
                          activeTab === 'notes'
                            ? "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400 shadow-sm"
                            : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        )}
                      >
                        <StickyNote className="h-4 w-4" />
                        Anotações
                      </button>
                    </div>

                    {/* Tab content wrapper */}
                    <div className="flex-1 p-5 sm:p-6 lg:p-8 bg-transparent">

                      {/* Tab content: Comments */}
                      {activeTab === 'comments' && (
                        <div className="space-y-4">
                          {/* Comment input */}
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-primary">
                                {user?.email?.[0]?.toUpperCase() || 'A'}
                              </span>
                            </div>
                            <div className="flex-1 space-y-2">
                              <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Deixe um comentario sobre esta aula..."
                                rows={2}
                                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-foreground placeholder:text-muted-foreground/60 shadow-sm"
                              />
                              {commentText.trim() && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground">{commentText.length}/2000</span>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitComment()}
                                    disabled={submittingComment || !commentText.trim()}
                                    className="h-8 px-3 text-xs gap-1.5"
                                  >
                                    <Send className="h-3 w-3" />
                                    Enviar (+5 XP)
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Comments list */}
                          {comments.length === 0 ? (
                            <div className="text-center py-8">
                              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Nenhum comentario ainda. Seja o primeiro!</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {comments.map((comment) => (
                                <div key={comment.id} className="space-y-2">
                                  {/* Main comment */}
                                  <div className="flex gap-3 group">
                                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                                      {comment.user_avatar ? (
                                        <img src={comment.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                      ) : (
                                        <span className="text-xs font-bold text-muted-foreground">
                                          {(comment.user_name || 'A')[0].toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-medium text-foreground">{comment.user_name || 'Aluno'}</span>
                                        <span className="text-[10px] text-muted-foreground/60">
                                          {new Date(comment.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">{comment.content}</p>
                                      <div className="flex items-center gap-3 mt-1">
                                        <button
                                          onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText('') }}
                                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                                        >
                                          <Reply className="h-3 w-3" />
                                          Responder
                                        </button>
                                        {comment.user_id === user?.id && (
                                          <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                            Excluir
                                          </button>
                                        )}
                                      </div>

                                      {/* Reply input */}
                                      {replyingTo === comment.id && (
                                        <div className="flex gap-2 mt-2">
                                          <input
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Escreva uma resposta..."
                                            maxLength={2000}
                                            className="flex-1 px-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-foreground shadow-sm placeholder:text-muted-foreground/60"
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(comment.id) } }}
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() => handleSubmitComment(comment.id)}
                                            disabled={submittingComment || !replyText.trim()}
                                            className="h-7 px-2 text-[11px]"
                                          >
                                            <Send className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Replies */}
                                  {comment.replies && comment.replies.length > 0 && (
                                    <div className="ml-11 space-y-2 border-l-2 border-border/50 pl-3">
                                      {comment.replies.map((reply) => (
                                        <div key={reply.id} className="flex gap-2.5 group">
                                          <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                                            {reply.user_avatar ? (
                                              <img src={reply.user_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                            ) : (
                                              <span className="text-[10px] font-bold text-muted-foreground">
                                                {(reply.user_name || 'A')[0].toUpperCase()}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                              <span className="text-[11px] font-medium text-foreground">{reply.user_name || 'Aluno'}</span>
                                              <span className="text-[10px] text-muted-foreground/60">
                                                {new Date(reply.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            </div>
                                            <p className="text-xs text-foreground/80 whitespace-pre-wrap break-words">{reply.content}</p>
                                            {reply.user_id === user?.id && (
                                              <button
                                                onClick={() => handleDeleteComment(reply.id)}
                                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 mt-0.5"
                                              >
                                                <Trash2 className="h-2.5 w-2.5" />
                                                Excluir
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab content: Resources */}
                      {activeTab === 'resources' && attachments.length > 0 && (
                        <div className="space-y-1.5">
                          {attachments.map((att) => {
                            const isPdf = att.file_type?.includes('pdf') || att.file_name?.endsWith('.pdf')
                            return (
                              <div key={att.id} className="flex items-center justify-between p-2.5 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors group">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileText className={cn("h-4 w-4 shrink-0", isPdf ? "text-red-400" : "text-muted-foreground")} />
                                  <span className="text-xs text-muted-foreground truncate group-hover:text-foreground">{att.file_name}</span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {isPdf && (
                                    <button onClick={() => openPdfViewer(att.file_url)}
                                      className="p-1.5 rounded text-muted-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Abrir ao lado">
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <a href={att.file_url} download target="_blank" rel="noopener noreferrer"
                                    className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Baixar">
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Tab content: Notes */}
                      {activeTab === 'notes' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Suas anotações pessoais sobre esta aula. Apenas você pode vê-las.</p>
                            {noteLastSaved && (
                              <span className={cn(
                                "flex items-center gap-1 text-[11px] transition-colors",
                                noteLastSaved === 'Salvando...' ? "text-muted-foreground" :
                                  noteLastSaved === 'Erro ao salvar' ? "text-red-400" :
                                    "text-emerald-500"
                              )}>
                                {noteSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                {noteLastSaved}
                              </span>
                            )}
                          </div>
                          <RichTextEditor
                            content={noteContent}
                            onChange={handleNoteChange}
                            placeholder="Escreva suas anotações aqui... (salva automaticamente)"
                            minHeight="180px"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Desktop Sidebar                                               */}
          {/* ============================================================ */}
          <aside className={cn(
            "hidden lg:flex flex-col overflow-hidden transition-all duration-300 border-l",
            "bg-card border-border",
            theaterMode ? "w-0 min-w-0 border-l-0" :
              desktopSidebarVisible ? "w-[320px] min-w-[320px]" : "w-0 min-w-0 border-l-0"
          )}>
            {desktopSidebarVisible && (
              <>
                {renderModuleSelector(false)}
                {renderLessonList(false)}
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
              <aside className="fixed inset-y-0 right-0 z-50 w-[85%] max-w-[360px] lg:hidden bg-card border-l border-border shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <ListVideo className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Aulas</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {renderModuleSelector(true)}
                {renderLessonList(true)}
              </aside>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes lp-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lp-xp-float {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-24px); }
        }
      `}</style>
    </>
  )
}

/* Small presentational sub-component */
function VideoPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
        <Play className="h-6 w-6 text-muted-foreground ml-0.5" />
      </div>
      <p className="text-xs text-muted-foreground">Vídeo não disponível</p>
    </div>
  )
}
