import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { courseData, type Lesson } from '@/lib/course-data'
import { CheckCircle, Download, ChevronLeft, ListChecks } from 'lucide-react'
import { PdfViewer } from '@/components/courses/PdfViewer'
import { useToast } from '@/components/ui/use-toast'

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
    return <div>Lição não encontrada.</div>
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
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(`/meus-cursos/${courseId}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar ao Curso
        </Button>
        <div className="flex gap-2">
          {lesson.isCompleted && associatedQuizId && (
            <Button asChild variant="secondary">
              <Link to={`/quiz/${associatedQuizId}`}>
                <ListChecks className="mr-2 h-4 w-4" /> Fazer Quiz
              </Link>
            </Button>
          )}
          <Button onClick={handleMarkAsComplete} disabled={lesson.isCompleted}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {lesson.isCompleted ? 'Aula Concluída' : 'Marcar como Concluída'}
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={accompanyingPdf ? 60 : 100}>
          <div className="flex flex-col h-full gap-4 p-1">
            <div className="aspect-video">
              <iframe
                src={lesson.videoUrl}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-lg"
              ></iframe>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{lesson.title}</CardTitle>
                <CardDescription>Duração: {lesson.duration}</CardDescription>
              </CardHeader>
              {lesson.attachments.length > 0 && (
                <CardContent>
                  <h3 className="font-semibold mb-2">Materiais de Apoio</h3>
                  <ul className="space-y-2">
                    {lesson.attachments.map((att) => (
                      <li key={att.id}>
                        <Button variant="outline" asChild>
                          <a href={att.url} download>
                            <Download className="mr-2 h-4 w-4" />
                            {att.name}
                          </a>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          </div>
        </ResizablePanel>
        {accompanyingPdf && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40}>
              <div className="h-full p-1">
                <PdfViewer fileUrl={accompanyingPdf.url} />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
