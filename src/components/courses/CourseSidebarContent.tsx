import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Circle, Play, Lock, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface Lesson {
  id: string
  title: string
  duration_seconds?: number
  completed?: boolean
  is_preview?: boolean
  order_index: number
}

interface Module {
  id: string
  name: string
  order_index: number
  lessons: Lesson[]
}

interface CourseSidebarContentProps {
  courseId: string
  modules: Module[]
  currentLessonId?: string
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function CourseSidebarContent({ courseId, modules, currentLessonId }: CourseSidebarContentProps) {
  // Track which modules are expanded (default: all expanded)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map(m => m.id))
  )

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
        <h3 className="font-bold text-lg">Conteúdo do Curso</h3>
        <p className="text-sm text-muted-foreground">
          {modules.length} módulo{modules.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Modules and Lessons */}
      <div className="flex-1 overflow-y-auto">
        {modules.map((module) => {
          const isExpanded = expandedModules.has(module.id)
          const completedLessons = module.lessons.filter(l => l.completed).length
          const totalLessons = module.lessons.length

          return (
            <div key={module.id} className="border-b border-border/50">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <div className="font-semibold text-sm">{module.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {completedLessons}/{totalLessons} aula{totalLessons !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((completedLessons / totalLessons) * 100)}%
                </div>
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div className="bg-muted/20">
                  {module.lessons
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((lesson) => {
                      const isCurrent = lesson.id === currentLessonId
                      const isLocked = !lesson.is_preview && !lesson.completed

                      return (
                        <Link
                          key={lesson.id}
                          to={`/courses/${courseId}/lesson/${lesson.id}`}
                          className={cn(
                            'flex items-start gap-3 p-3 pl-12 hover:bg-muted/50 transition-colors border-l-2',
                            isCurrent
                              ? 'bg-primary/10 border-l-primary'
                              : 'border-l-transparent',
                            isLocked && 'opacity-50 cursor-not-allowed'
                          )}
                          onClick={(e) => {
                            if (isLocked) {
                              e.preventDefault()
                            }
                          }}
                        >
                          {/* Status Icon */}
                          <div className="mt-0.5">
                            {lesson.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : isLocked ? (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            ) : isCurrent ? (
                              <Play className="h-4 w-4 text-primary" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                'text-sm font-medium truncate',
                                isCurrent && 'text-primary',
                                lesson.completed && 'text-green-600'
                              )}
                            >
                              {lesson.title}
                            </div>
                            {lesson.duration_seconds && (
                              <div className="text-xs text-muted-foreground">
                                {formatDuration(lesson.duration_seconds)}
                              </div>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer with overall progress */}
      <div className="p-4 border-t border-border/50 bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso Total</span>
          <span className="text-sm font-bold text-primary">
            {Math.round(
              (modules.reduce((sum, m) => sum + m.lessons.filter(l => l.completed).length, 0) /
                modules.reduce((sum, m) => sum + m.lessons.length, 0)) *
                100
            )}
            %
          </span>
        </div>
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
            style={{
              width: `${Math.round(
                (modules.reduce((sum, m) => sum + m.lessons.filter(l => l.completed).length, 0) /
                  modules.reduce((sum, m) => sum + m.lessons.length, 0)) *
                  100
              )}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}
