import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Play, Clock, Lock, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
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
      <MagicLayout
        title="Meus Cursos"
        description="Sistema de videoaulas bloqueado"
      >
        <MagicCard variant="glass" size="lg" className="text-center py-24">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Recurso Bloqueado
            </h3>
            <p className="text-muted-foreground mb-8">
              O sistema de videoaulas não está disponível para sua turma. Entre em contato com seu professor ou administrador para mais informações.
            </p>
          </div>
        </MagicCard>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title="Meus Cursos"
      description="Acompanhe seu progresso"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {courses.length === 0 ? (
          <MagicCard variant="glass" size="lg" className="text-center py-24">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Nenhum curso encontrado
              </h3>
              <p className="text-muted-foreground mb-8">
                Você ainda não tem acesso a nenhum curso. Entre em contato com seu professor.
              </p>
            </div>
          </MagicCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <div
                key={course.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <MagicCard
                  className="h-full flex flex-col overflow-hidden border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/50 p-0"
                  variant="glass"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={course.image || '/placeholder.svg'}
                      alt={course.title}
                      className="object-cover w-full h-full"
                    />
                    {course.progress === 100 && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-green-500/90 text-white text-xs font-bold backdrop-blur-sm shadow-sm">
                        Concluído
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5 flex flex-col space-y-3">
                    {/* Course name */}
                    <h3 className="font-bold text-lg leading-tight line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Module + Lesson counts */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{course.modules_count} módulo{course.modules_count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{course.lessons_count} aula{course.lessons_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2 pt-3 border-t mt-auto">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className={cn(
                          course.progress === 100 ? 'text-green-500' : 'text-primary'
                        )}>
                          {Math.round(course.progress)}%
                        </span>
                      </div>
                      <Progress
                        value={course.progress}
                        className={cn(
                          'h-2',
                          course.progress === 100 ? '[&>div]:bg-green-500' : ''
                        )}
                      />
                    </div>

                    {/* Action button */}
                    <Link to={`/courses/${course.id}`} className="mt-2">
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
                        size="sm"
                      >
                        {course.progress > 0 ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Continuar curso
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Iniciar curso
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </MagicCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </MagicLayout>
  )
}
