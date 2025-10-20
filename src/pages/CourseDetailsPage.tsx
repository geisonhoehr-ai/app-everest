import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { courseService } from '@/services/courseService'
import { useAuth } from '@/hooks/use-auth'
import { SectionLoader } from '@/components/SectionLoader'
import { 
  CheckCircle, 
  PlayCircle, 
  Clock, 
  BookOpen, 
  Users, 
  Star,
  ArrowRight,
  Calendar,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CourseModule {
  id: string
  name: string
  description: string | null
  order_index: number
  lessons: CourseLesson[]
}

interface CourseLesson {
  id: string
  title: string
  description: string | null
  order_index: number
  duration_seconds: number | null
  is_preview: boolean
  is_completed?: boolean
  progress_percentage?: number
}

interface CourseDetails {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  modules: CourseModule[]
  total_lessons: number
  completed_lessons: number
  progress_percentage: number
}

export default function CourseDetailsPage() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState<CourseDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId || !user?.id) return

      try {
        setIsLoading(true)
        const courseData = await courseService.getCourseWithModulesAndProgress(courseId, user.id)
        
        // Transform the data to match our interface
        const transformedCourse: CourseDetails = {
          id: courseData.id,
          name: courseData.name,
          description: courseData.description,
          thumbnail_url: courseData.thumbnail_url,
          modules: courseData.modules.map(module => ({
            id: module.id,
            name: module.name,
            description: module.description,
            order_index: module.order_index,
            lessons: module.lessons.map(lesson => ({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              order_index: lesson.order_index,
              duration_seconds: lesson.duration_seconds,
              is_preview: lesson.is_preview,
              is_completed: lesson.is_completed || false,
              progress_percentage: lesson.progress_percentage || 0
            }))
          })),
          total_lessons: courseData.total_lessons,
          completed_lessons: courseData.completed_lessons,
          progress_percentage: courseData.progress_percentage
        }

        setCourse(transformedCourse)
      } catch (error) {
        console.error('Error fetching course details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourseDetails()
  }, [courseId, user?.id])

  if (isLoading) {
    return <SectionLoader />
  }

  if (!course) {
    return (
      <MagicLayout 
        title="Curso não encontrado"
        description="O curso solicitado não foi encontrado"
      >
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold mb-4">Curso não encontrado</h2>
          <p className="text-muted-foreground mb-8">
            O curso que você está procurando não existe ou não está disponível.
          </p>
          <Link to="/meus-cursos">
            <Button>Voltar aos Cursos</Button>
          </Link>
        </div>
      </MagicLayout>
    )
  }

  const totalLessons = course.total_lessons
  const completedLessons = course.completed_lessons
  const courseProgress = course.progress_percentage

  return (
    <MagicLayout 
      title="Detalhes do Curso"
      description="Explore o conteúdo completo e acompanhe seu progresso"
    >
      <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Header */}
          <MagicCard variant="premium" size="lg" className="group">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        {course.name}
                      </h1>
                      <p className="text-muted-foreground text-lg">
                        {course.description || 'Descrição não disponível'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">4.8</span>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Progresso do Curso</h3>
                  <span className="text-sm text-muted-foreground">
                    {completedLessons || 0} de {totalLessons || 0} aulas
                  </span>
                </div>
                <div className="space-y-2">
                  <Progress 
                    value={courseProgress} 
                    className="h-3 bg-muted/50"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {courseProgress?.toFixed(0) || 0}% concluído
                    </span>
                    <span className="font-medium text-primary">
                      {(totalLessons || 0) - (completedLessons || 0)} aulas restantes
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">12h</div>
                  <div className="text-sm text-muted-foreground">Duração</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                  <Users className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">2.4k</div>
                  <div className="text-sm text-muted-foreground">Estudantes</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                  <Award className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">Certificado</div>
                  <div className="text-sm text-muted-foreground">Incluído</div>
                </div>
              </div>
            </div>
          </MagicCard>

          {/* Course Modules */}
          <MagicCard variant="glass" size="lg">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Conteúdo do Curso
              </h2>
              <Accordion type="multiple" defaultValue={course.modules.length > 0 ? [course.modules[0].id] : []} className="space-y-4">
                {course.modules.map((module, index) => {
                  const completedInModule = module.lessons.filter(
                    (l) => l.is_completed,
                  ).length
                  const totalInModule = module.lessons.length
                  const moduleProgress = totalInModule > 0 ? (completedInModule / totalInModule) * 100 : 0
                  
                  return (
                    <AccordionItem 
                      value={module.id} 
                      key={module.id}
                      className="border border-border/50 rounded-xl overflow-hidden bg-gradient-to-r from-card/50 to-card/30"
                    >
                      <AccordionTrigger className="font-semibold px-6 py-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                              <span className="text-sm font-bold text-primary">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <div>
                              <span className="text-lg">{module.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress 
                                  value={moduleProgress} 
                                  className="h-2 w-32 bg-muted/50"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {moduleProgress.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {completedInModule}/{totalInModule} aulas
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="space-y-3">
                          {module.lessons.map((lesson, lessonIndex) => {
                            const isCompleted = lesson.is_completed
                            const duration = lesson.duration_seconds 
                              ? `${Math.floor(lesson.duration_seconds / 60)}:${(lesson.duration_seconds % 60).toString().padStart(2, '0')}`
                              : 'N/A'
                            
                            return (
                              <Link
                                key={lesson.id}
                                to={`/meus-cursos/${courseId}/lesson/${lesson.id}`}
                                className={cn(
                                  "group flex items-center justify-between p-4 rounded-xl transition-all duration-300",
                                  "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10",
                                  "hover:scale-[1.02] hover:shadow-lg",
                                  "border border-transparent hover:border-primary/20"
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isCompleted 
                                      ? "bg-green-500/20 text-green-600" 
                                      : "bg-muted/50 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                  )}>
                                    {isCompleted ? (
                                      <CheckCircle className="h-5 w-5" />
                                    ) : (
                                      <PlayCircle className="h-5 w-5" />
                                    )}
                                  </div>
                                  <div>
                                    <span className={cn(
                                      "font-medium transition-colors",
                                      isCompleted 
                                        ? "text-muted-foreground line-through" 
                                        : "text-foreground group-hover:text-primary"
                                    )}>
                                      {lesson.title}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {duration}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    Aula {lessonIndex + 1}
                                  </span>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          </MagicCard>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Course Card */}
          <MagicCard variant="premium" className="sticky top-24 overflow-hidden">
            <div className="relative">
              <img
                src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516397281156-ca07cf9746fc?w=400&h=200&fit=crop'}
                alt={course.name}
                className="w-full h-48 object-cover rounded-t-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-white/80" />
                  <span className="text-sm text-white/80">Última atualização: Hoje</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Continue seu aprendizado</h3>
                <p className="text-muted-foreground text-sm">
                  Você está {courseProgress?.toFixed(0) || 0}% do caminho para completar este curso
                </p>
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                size="lg"
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Continuar Curso
              </Button>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{courseProgress?.toFixed(0) || 0}%</span>
                </div>
                <Progress 
                  value={courseProgress} 
                  className="h-2 bg-muted/50"
                />
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{completedLessons || 0}</div>
                    <div className="text-xs text-muted-foreground">Concluídas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-muted-foreground">{(totalLessons || 0) - (completedLessons || 0)}</div>
                    <div className="text-xs text-muted-foreground">Restantes</div>
                  </div>
                </div>
              </div>
            </div>
          </MagicCard>
        </div>
      </div>
    </MagicLayout>
  )
}
