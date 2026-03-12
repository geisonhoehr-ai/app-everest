import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Play, Lock, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { SectionLoader } from '@/components/SectionLoader'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import { courseService, CourseWithProgress } from '@/services/courseService'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

export default function MyCoursesPage() {
  const { user, isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!user?.id) return
        const data = await courseService.getUserCoursesWithDetails(user.id)
        setCourses(data)
      } catch (error) {
        logger.error('Error fetching courses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [user?.id])

  if (permissionsLoading || isLoading) {
    return <SectionLoader />
  }

  if (isStudent && !hasFeature(FEATURE_KEYS.VIDEO_LESSONS)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Cursos</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema de videoaulas bloqueado</p>
        </div>
        <Card className="border-border shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Recurso Bloqueado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              O sistema de videoaulas não está disponível para sua turma. Entre em contato com seu professor ou administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meus Cursos</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seu progresso</p>
      </div>

      {courses.length === 0 ? (
        <Card className="border-border shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhum curso encontrado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Você ainda não tem acesso a nenhum curso. Entre em contato com seu professor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="border-border shadow-sm overflow-hidden flex flex-col">
              {/* Thumbnail */}
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
                <img
                  src={course.image || '/placeholder.svg'}
                  alt={course.title}
                  className="object-cover w-full h-full"
                />
                {course.progress === 100 && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-emerald-500 text-white text-xs font-bold">
                    Concluído
                  </div>
                )}
              </div>

              <CardContent className="flex-1 p-5 flex flex-col">
                <h3 className="font-bold text-lg leading-tight line-clamp-2 min-h-[3.5rem]">
                  {course.title}
                </h3>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{course.modules_count} módulo{course.modules_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{course.lessons_count} aula{course.lessons_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-border mt-auto">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className={cn(
                      course.progress === 100 ? 'text-emerald-600' : 'text-primary'
                    )}>
                      {Math.round(course.progress)}%
                    </span>
                  </div>
                  <Progress
                    value={course.progress}
                    className={cn(
                      'h-2',
                      course.progress === 100 ? '[&>div]:bg-emerald-500' : ''
                    )}
                  />
                </div>

                <Button asChild className="w-full mt-2" size="sm">
                  <Link to={`/courses/${course.id}`}>
                    <Play className="w-4 h-4 mr-2" />
                    {course.progress > 0 ? 'Continuar curso' : 'Iniciar curso'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
