import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Card, CardContent } from '@/components/ui/card'
import { courseService } from '@/services/courseService'
import { useAuth } from '@/hooks/use-auth'
import {
  CheckCircle,
  Download,
  ChevronLeft,
  Play,
  Clock,
  BookOpen,
  FileText
} from 'lucide-react'
import { PdfViewer } from '@/components/courses/PdfViewer'
import { CourseSidebarContent } from '@/components/courses/CourseSidebarContent'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { SectionLoader } from '@/components/SectionLoader'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

interface LessonData {
  id: string
  title: string
  description: string
  duration_seconds?: number
  video_source_type?: string
  video_source_id?: string
  completed?: boolean
  progress?: number
  last_position?: number
}

interface CourseData {
  id: string
  name: string
  description: string
  modules: Array<{
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
  }>
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

export default function CourseLessonPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [lessonData, setLessonData] = useState<LessonData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attachments, setAttachments] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !courseId || !lessonId) return

      try {
        setIsLoading(true)

        // Fetch course with modules and lessons
        const course = await courseService.getCourseWithModulesAndProgress(courseId, user.id)

        if (!course) {
          toast({
            title: 'Curso não encontrado',
            description: 'O curso que você está procurando não existe.',
            variant: 'destructive'
          })
          navigate('/courses')
          return
        }

        setCourseData(course as CourseData)

        // Find the lesson data
        let foundLesson: LessonData | null = null
        for (const module of course.modules) {
          const lesson = module.lessons.find((l: any) => l.id === lessonId)
          if (lesson) {
            foundLesson = lesson as LessonData
            break
          }
        }

        if (!foundLesson) {
          toast({
            title: 'Aula não encontrada',
            description: 'A aula que você está procurando não existe.',
            variant: 'destructive'
          })
          navigate(`/courses/${courseId}`)
          return
        }

        setLessonData(foundLesson)

        // Fetch attachments
        const { data: attachmentsData } = await supabase
          .from('video_lesson_attachments')
          .select('*')
          .eq('lesson_id', lessonId)

        if (attachmentsData) {
          setAttachments(attachmentsData)
        }
      } catch (error) {
        logger.error('Error fetching lesson data:', error)
        toast({
          title: 'Erro ao carregar aula',
          description: 'Ocorreu um erro ao carregar os dados da aula.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [courseId, lessonId, user?.id, navigate, toast])

  const handleMarkAsComplete = async () => {
    if (!user?.id || !lessonId || !lessonData) return

    try {
      const { error } = await supabase
        .from('video_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
          last_position_seconds: lessonData.duration_seconds || 0
        })

      if (error) throw error

      setLessonData({ ...lessonData, completed: true, progress: 100 })

      toast({
        title: 'Aula concluída!',
        description: 'Parabéns! Continue seu progresso.',
      })
    } catch (error) {
      logger.error('Error marking lesson as complete:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a aula como concluída.',
        variant: 'destructive'
      })
    }
  }

  const getVideoEmbedUrl = () => {
    if (!lessonData) return ''

    const { video_source_type, video_source_id } = lessonData

    if (video_source_type === 'panda_video' && video_source_id) {
      return `https://player-vz-c47fa4e7-9be.tv.pandavideo.com.br/embed/?v=${video_source_id}`
    }

    if (video_source_type === 'youtube' && video_source_id) {
      return `https://www.youtube.com/embed/${video_source_id}`
    }

    if (video_source_type === 'vimeo' && video_source_id) {
      return `https://player.vimeo.com/video/${video_source_id}`
    }

    return ''
  }

  if (isLoading) {
    return <SectionLoader />
  }

  if (!lessonData || !courseData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Aula não encontrada</h1>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Aula não encontrada</h2>
          <p className="text-muted-foreground mb-6">
            A aula que você está procurando não existe ou foi removida.
          </p>
          <Button onClick={() => navigate(`/courses/${courseId}`)}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar ao Curso
          </Button>
        </div>
      </div>
    )
  }

  const pdfAttachment = attachments.find(att => att.file_type?.includes('pdf'))
  const videoEmbedUrl = getVideoEmbedUrl()

  return (
    <div className="space-y-0">
      <div className="max-w-[1600px] mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/courses/${courseId}`)}
              className="hover:bg-accent"
            >
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Voltar
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {courseData.name}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleMarkAsComplete}
            disabled={lessonData.completed}
            variant={lessonData.completed ? "outline" : "default"}
            className={cn(
              "transition-all duration-200",
              lessonData.completed
                ? "text-green-600 border-green-200 dark:border-green-800 dark:text-green-400 cursor-default"
                : "hover:shadow-md"
            )}
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            {lessonData.completed ? 'Concluída' : 'Marcar como Concluída'}
          </Button>
        </div>

        {/* Main Content with Sidebar */}
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <ResizablePanel defaultSize={22} minSize={18} maxSize={32}>
            <div className="h-full border-r border-border bg-card">
              <CourseSidebarContent
                courseId={courseId!}
                modules={courseData.modules}
                currentLessonId={lessonId}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-transparent hover:bg-primary/20 transition-colors data-[resize-handle-active]:bg-primary/30" />

          {/* Video and Details */}
          <ResizablePanel defaultSize={pdfAttachment ? 53 : 78}>
            <div className="flex flex-col h-full">
              {/* Video Player */}
              {videoEmbedUrl && (
                <div className="bg-black">
                  <div className="aspect-video max-h-[65vh] mx-auto">
                    <iframe
                      src={videoEmbedUrl}
                      title="Video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Lesson Details - below video */}
              <div className="flex-1 bg-background">
                <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
                  {/* Title and meta */}
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {lessonData.title}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                      {lessonData.duration_seconds && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-sm">{formatDuration(lessonData.duration_seconds)}</span>
                        </div>
                      )}
                      {lessonData.completed && (
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span className="text-sm font-medium">Concluída</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {lessonData.description && (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <h2 className="text-sm font-semibold text-foreground mb-2">Sobre esta aula</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {lessonData.description}
                      </p>
                    </div>
                  )}

                  {/* Attachments */}
                  {attachments.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <FileText className="h-4 w-4 text-primary" />
                        Materiais de Apoio
                      </h3>
                      <div className="grid gap-2">
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            className="group flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                <Download className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-medium truncate block">{att.name || 'Arquivo'}</span>
                                <span className="text-xs text-muted-foreground">
                                  {att.file_type || 'Material de apoio'}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="shrink-0 hover:bg-primary/10 hover:text-primary"
                            >
                              <a href={att.file_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                Baixar
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* PDF Viewer (if available) */}
          {pdfAttachment && (
            <>
              <ResizableHandle withHandle className="bg-transparent hover:bg-primary/20 transition-colors data-[resize-handle-active]:bg-primary/30" />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                <div className="h-full border-l border-border bg-card">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Material de Apoio</span>
                  </div>
                  <div className="h-[calc(100%-49px)]">
                    <PdfViewer fileUrl={pdfAttachment.file_url} />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
