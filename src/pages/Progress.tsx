import { useState, useEffect } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { courseService, type CourseWithProgress } from '@/services/courseService'
import { getUserProgress, getUserAchievements, type UserProgress, type UserAchievement } from '@/services/gamificationService'
import { SectionLoader } from '@/components/SectionLoader'
import { logger } from '@/lib/logger'
import {
  TrendingUp,
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react'

interface ProgressData {
  overallProgress: number
  coursesCompleted: number
  totalCourses: number
  studyTime: number
  streak: number
  achievements: number
  recentActivity: {
    course: string
    progress: number
    completed: boolean
    date: string
  }[]
  userAchievements: {
    title: string
    description: string
    earned: boolean
  }[]
}

const emptyData: ProgressData = {
  overallProgress: 0,
  coursesCompleted: 0,
  totalCourses: 0,
  studyTime: 0,
  streak: 0,
  achievements: 0,
  recentActivity: [],
  userAchievements: []
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData>(emptyData)
  const [loading, setLoading] = useState(true)
  const { getUserId } = useAuth()

  useEffect(() => {
    async function loadProgress() {
      const userId = getUserId()
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const [courses, userProgress, achievements] = await Promise.all([
          courseService.getUserCoursesWithDetails(userId),
          getUserProgress(userId).catch(() => null),
          getUserAchievements(userId).catch(() => [])
        ])

        const totalCourses = courses.length
        const coursesCompleted = courses.filter(c => c.progress >= 100).length
        const overallProgress = totalCourses > 0
          ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / totalCourses)
          : 0

        // Total study hours from course durations (approximate)
        const totalHours = Math.round(courses.reduce((sum, c) => sum + (c.total_hours || 0), 0))

        // Build recent activity from courses sorted by progress (most recent progress first)
        const recentActivity = courses
          .filter(c => c.progress > 0)
          .sort((a, b) => b.progress - a.progress)
          .slice(0, 5)
          .map(c => ({
            course: c.title,
            progress: c.progress,
            completed: c.progress >= 100,
            date: new Date().toISOString().split('T')[0]
          }))

        // Build achievements list from real data
        const userAchievementsList = achievements.map(a => ({
          title: a.achievement?.name || 'Conquista',
          description: a.achievement?.description || '',
          earned: true
        }))

        setData({
          overallProgress,
          coursesCompleted,
          totalCourses,
          studyTime: totalHours,
          streak: userProgress?.current_streak_days || 0,
          achievements: achievements.length,
          recentActivity,
          userAchievements: userAchievementsList.length > 0
            ? userAchievementsList.slice(0, 6)
            : []
        })
      } catch (error) {
        logger.error('Erro ao carregar progresso:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [getUserId])

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-success'
    if (progress >= 70) return 'bg-primary'
    if (progress >= 50) return 'bg-warning'
    return 'bg-destructive'
  }

  const getProgressText = (progress: number) => {
    if (progress >= 90) return 'Excelente!'
    if (progress >= 70) return 'Muito bom!'
    if (progress >= 50) return 'Bom progresso!'
    return 'Continue estudando!'
  }

  if (loading) {
    return <SectionLoader />
  }

  return (
    <MagicLayout
      title="Meu Progresso"
      description="Acompanhe sua jornada de aprendizado e veja como você está evoluindo."
    >
      <div className="space-y-8">
        {/* Overall Progress */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MagicCard className="p-4 md:p-6 text-center" glow>
            <div className="space-y-2 md:space-y-3">
              <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold">{data.overallProgress}%</div>
                <div className="text-xs md:text-sm text-muted-foreground">Progresso Geral</div>
                <Badge variant="outline" className="text-xs hidden md:inline-flex">
                  {data.totalCourses > 0 ? getProgressText(data.overallProgress) : 'Sem cursos'}
                </Badge>
              </div>
            </div>
          </MagicCard>

          <MagicCard className="p-4 md:p-6 text-center" glow>
            <div className="space-y-2 md:space-y-3">
              <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-success/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-success" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold">
                  {data.totalCourses > 0 ? `${data.coursesCompleted}/${data.totalCourses}` : '0'}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Cursos</div>
                {data.totalCourses > 0 && (
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20 hidden md:inline-flex">
                    {Math.round((data.coursesCompleted / data.totalCourses) * 100)}% completo
                  </Badge>
                )}
              </div>
            </div>
          </MagicCard>

          <MagicCard className="p-4 md:p-6 text-center" glow>
            <div className="space-y-2 md:space-y-3">
              <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-info/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-info" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{data.studyTime}h</div>
                <div className="text-sm text-muted-foreground">Tempo de Estudo</div>
                <Badge variant="outline" className="text-xs">
                  Total dos cursos
                </Badge>
              </div>
            </div>
          </MagicCard>

          <MagicCard className="p-6 text-center" glow>
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-warning" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{data.achievements}</div>
                <div className="text-sm text-muted-foreground">Conquistas</div>
                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                  {data.streak > 0 ? `${data.streak} dias seguidos` : 'Sem sequencia'}
                </Badge>
              </div>
            </div>
          </MagicCard>
        </div>

        {/* Recent Activity */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Atividade Recente</h3>
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma atividade recente. Comece a estudar para ver seu progresso aqui.
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/20 transition-all duration-300 group"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    activity.completed ? "bg-success/10" : "bg-primary/10"
                  )}>
                    {activity.completed ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold group-hover:text-primary transition-colors duration-300">
                        {activity.course}
                      </h4>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          activity.completed
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        {activity.progress}%
                      </Badge>
                    </div>
                  </div>

                  <div className="w-24">
                    <Progress
                      value={activity.progress}
                      className="h-2"
                      indicatorClassName={cn(
                        activity.completed ? "bg-success" : "bg-gradient-to-r from-primary to-primary-600"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </MagicCard>

        {/* Achievements */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center gap-3 mb-6">
            <Star className="h-6 w-6 text-warning" />
            <h3 className="text-xl font-bold">Conquistas</h3>
          </div>
          {data.userAchievements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conquista desbloqueada ainda. Continue estudando para desbloquear conquistas.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.userAchievements.map((achievement, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300",
                    achievement.earned
                      ? "border-success/20 bg-success/5 hover:bg-success/10"
                      : "border-border/50 bg-muted/20 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      achievement.earned ? "bg-success/10" : "bg-muted"
                    )}>
                      <Star className={cn(
                        "h-4 w-4",
                        achievement.earned ? "text-success" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1">
                      <h4 className={cn(
                        "font-semibold text-sm",
                        achievement.earned ? "text-success" : "text-muted-foreground"
                      )}>
                        {achievement.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
