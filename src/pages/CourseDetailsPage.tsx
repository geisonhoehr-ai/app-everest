import { Link, useParams } from 'react-router-dom'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { courseData } from '@/lib/course-data'
import { CheckCircle, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock user progress data. In a real app, this would be fetched from the `video_progress` table.
const userProgress = {
  'licao-101': { is_completed: true },
  'licao-102': { is_completed: true },
}

export default function CourseDetailsPage() {
  const { courseId } = useParams()

  const totalLessons = courseData.modules.reduce(
    (acc, mod) => acc + mod.lessons.length,
    0,
  )
  const completedLessons = courseData.modules.reduce(
    (acc, mod) =>
      acc +
      mod.lessons.filter((lesson) => userProgress[lesson.id]?.is_completed)
        .length,
    0,
  )
  const courseProgress = (completedLessons / totalLessons) * 100

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{courseData.title}</CardTitle>
            <CardDescription>{courseData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={courseProgress} />
              <p className="text-sm text-muted-foreground">
                {completedLessons} de {totalLessons} aulas concluídas (
                {courseProgress.toFixed(0)}%)
              </p>
            </div>
          </CardContent>
        </Card>
        <Accordion type="multiple" defaultValue={['modulo-1']}>
          {courseData.modules.map((module) => {
            const completedInModule = module.lessons.filter(
              (l) => userProgress[l.id]?.is_completed,
            ).length
            const totalInModule = module.lessons.length
            return (
              <AccordionItem value={module.id} key={module.id}>
                <AccordionTrigger className="font-semibold">
                  <div className="flex justify-between w-full pr-4">
                    <span>{module.title}</span>
                    <span className="text-sm text-muted-foreground font-normal">
                      {completedInModule}/{totalInModule}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {module.lessons.map((lesson) => {
                      const isCompleted = userProgress[lesson.id]?.is_completed
                      return (
                        <li key={lesson.id}>
                          <Link
                            to={`/meus-cursos/${courseId}/lesson/${lesson.id}`}
                            className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <PlayCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span
                                className={cn(
                                  isCompleted &&
                                    'text-muted-foreground line-through',
                                )}
                              >
                                {lesson.title}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {lesson.duration}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
      <div className="lg:col-span-1">
        <Card className="sticky top-20">
          <img
            src={courseData.image}
            alt={courseData.title}
            className="rounded-t-lg object-cover w-full h-48"
          />
          <CardContent className="p-6">
            <Button className="w-full">Continuar Curso</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
