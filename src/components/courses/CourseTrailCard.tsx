import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, BookOpen, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Course {
  id: string
  title: string
  progress: number
  modules_count?: number
  lessons_count?: number
  total_hours?: number
}

interface CourseTrailCardProps {
  trailName: string
  totalCourses: number
  totalLessons: number
  completedLessons: number
  averageProgress: number
  completedCourses: number
  courses: Course[]
}

export function CourseTrailCard({
  trailName,
  totalCourses,
  totalLessons,
  completedLessons,
  averageProgress,
  completedCourses,
  courses,
}: CourseTrailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300">
      {/* Header */}
      <div
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-wrap gap-2 items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              {trailName}
              <ChevronRight
                className={cn(
                  'h-5 w-5 transition-transform duration-300',
                  isExpanded && 'rotate-90'
                )}
              />
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalCourses} curso{totalCourses !== 1 ? 's' : ''} • {totalLessons} aula{totalLessons !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* Concluídos */}
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <div className="text-2xl font-bold">{completedCourses}</div>
            <div className="text-xs text-muted-foreground mt-1">Concluídos</div>
          </div>

          {/* Progresso Médio */}
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <div className="text-2xl font-bold">{Math.round(averageProgress)}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Progresso Médio
            </div>
          </div>

          {/* Aulas Feitas */}
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <div className="text-2xl font-bold">{completedLessons}</div>
            <div className="text-xs text-muted-foreground mt-1">Aulas Feitas</div>
          </div>
        </div>

        {/* Courses List (quando expandido) */}
        {isExpanded && courses.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-semibold mb-3">Cursos inclusos:</div>
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/meus-cursos/${course.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <PlayCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{course.title}</div>
                    {(course.modules_count || course.lessons_count || course.total_hours) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {course.modules_count && `${course.modules_count} módulo${course.modules_count !== 1 ? 's' : ''}`}
                        {course.modules_count && course.lessons_count && ' • '}
                        {course.lessons_count && `${course.lessons_count} aula${course.lessons_count !== 1 ? 's' : ''}`}
                        {(course.modules_count || course.lessons_count) && course.total_hours && ' • '}
                        {course.total_hours && `${course.total_hours}h`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      course.progress === 100 && 'text-green-500',
                      course.progress > 0 && course.progress < 100 && 'text-yellow-500',
                      course.progress === 0 && 'text-muted-foreground'
                    )}
                  >
                    {course.progress}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Progresso Geral</span>
            <span className="text-xs font-bold">{Math.round(averageProgress)}%</span>
          </div>
          <Progress value={averageProgress} className="h-2" />
        </div>
      </div>
    </div>
  )
}
