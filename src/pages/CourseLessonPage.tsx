import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { courseData, type Lesson } from '@/lib/course-data'
import { 
  CheckCircle, 
  Download, 
  ChevronLeft, 
  ListChecks, 
  Play,
  Clock,
  BookOpen,
  FileText,
  ArrowRight,
  Star,
  Users
} from 'lucide-react'
import { PdfViewer } from '@/components/courses/PdfViewer'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// Mock: Assume lesson 'licao-101' has a quiz associated with it.
const lessonQuizMap = {
  'licao-101': 'quiz-1',
}

export default function CourseLessonPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [lesson, setLesson] = useState<Lesson | undefined>(() =>
    courseData.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId),
  )

  if (!lesson) {
    return (
      <MagicLayout title="Aula não encontrada">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold mb-2">Aula não encontrada</h2>
          <p className="text-muted-foreground mb-6">
            A aula que você está procurando não existe ou foi removida.
          </p>
          <Button onClick={() => navigate(`/meus-cursos/${courseId}`)}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar ao Curso
          </Button>
        </div>
      </MagicLayout>
    )
  }

  const accompanyingPdf = lesson.attachments.find(
    (att) => att.id === lesson.accompanyingPdfId,
  )
  const associatedQuizId =
    lessonQuizMap[lesson.id as keyof typeof lessonQuizMap]

  const handleMarkAsComplete = () => {
    setLesson({ ...lesson, isCompleted: true })
    toast({
      title: 'Aula concluída!',
      description: 'Continue seu progresso.',
    })
  }

  return (
    <MagicLayout 
      title={lesson.title}
      description={`Duração: ${lesson.duration} • Aula do curso`}
      showHeader={false}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/meus-cursos/${courseId}`)}
            className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar ao Curso
          </Button>
          <div className="flex gap-3">
            {lesson.isCompleted && associatedQuizId && (
              <Button asChild variant="secondary" className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20 hover:from-blue-500/20 hover:to-blue-600/20">
                <Link to={`/quiz/${associatedQuizId}`}>
                  <ListChecks className="mr-2 h-4 w-4" /> 
                  Fazer Quiz
                </Link>
              </Button>
            )}
            <Button 
              onClick={handleMarkAsComplete} 
              disabled={lesson.isCompleted}
              className={cn(
                "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                "text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg",
                lesson.isCompleted && "opacity-50 cursor-not-allowed"
              )}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {lesson.isCompleted ? 'Aula Concluída' : 'Marcar como Concluída'}
            </Button>
          </div>
        </div>

        {/* Lesson Info Card */}
        <MagicCard variant="premium" size="lg" className="mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {lesson.title}
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{lesson.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">Aula do Curso</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20">
              <Star className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">4.8</span>
            </div>
          </div>
        </MagicCard>

        {/* Main Content */}
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
          <ResizablePanel defaultSize={accompanyingPdf ? 60 : 100}>
            <div className="flex flex-col h-full gap-6">
              {/* Video Player */}
              <MagicCard variant="glass" size="lg" className="overflow-hidden">
                <div className="aspect-video rounded-2xl overflow-hidden">
                  <iframe
                    src={lesson.videoUrl}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </MagicCard>

              {/* Lesson Details */}
              <MagicCard variant="premium" size="lg">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Detalhes da Aula</h2>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">1.2k visualizações</span>
                    </div>
                  </div>

                  {lesson.attachments.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Materiais de Apoio
                      </h3>
                      <div className="grid gap-3">
                        {lesson.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                                <Download className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <span className="font-medium">{att.name}</span>
                                <div className="text-sm text-muted-foreground">
                                  Material de apoio
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              asChild
                              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
                            >
                              <a href={att.url} download>
                                <Download className="mr-2 h-4 w-4" />
                                Baixar
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {lesson.isCompleted && associatedQuizId && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-600 mb-2">
                            Próximo Passo
                          </h3>
                          <p className="text-muted-foreground">
                            Teste seus conhecimentos com o quiz desta aula
                          </p>
                        </div>
                        <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                          <Link to={`/quiz/${associatedQuizId}`}>
                            <ListChecks className="mr-2 h-4 w-4" />
                            Fazer Quiz
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </MagicCard>
            </div>
          </ResizablePanel>
          
          {accompanyingPdf && (
            <>
              <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors" />
              <ResizablePanel defaultSize={40}>
                <MagicCard variant="glass" size="lg" className="h-full overflow-hidden">
                  <div className="h-full">
                    <div className="flex items-center gap-2 p-4 border-b border-border/50">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Material de Apoio</span>
                    </div>
                    <div className="h-[calc(100%-60px)]">
                      <PdfViewer fileUrl={accompanyingPdf.url} />
                    </div>
                  </div>
                </MagicCard>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </MagicLayout>
  )
}
