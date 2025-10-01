import { useState, useEffect } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  BookOpen, 
  Target, 
  Clock, 
  Award, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react'

const mockProgressData = {
  overallProgress: 78,
  coursesCompleted: 12,
  totalCourses: 18,
  studyTime: 145,
  streak: 7,
  achievements: 24,
  recentActivity: [
    { course: 'Matemática Básica', progress: 100, completed: true, date: '2024-01-15' },
    { course: 'Português Avançado', progress: 85, completed: false, date: '2024-01-14' },
    { course: 'História do Brasil', progress: 100, completed: true, date: '2024-01-13' },
    { course: 'Geografia Mundial', progress: 60, completed: false, date: '2024-01-12' },
    { course: 'Física Moderna', progress: 45, completed: false, date: '2024-01-11' },
  ],
  weeklyGoal: {
    hours: 20,
    completed: 16,
    daysLeft: 3
  }
}

export default function ProgressPage() {
  const [data, setData] = useState(mockProgressData)

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
                  {getProgressText(data.overallProgress)}
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
                <div className="text-2xl md:text-3xl font-bold">{data.coursesCompleted}/{data.totalCourses}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Cursos</div>
                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20 hidden md:inline-flex">
                  {Math.round((data.coursesCompleted / data.totalCourses) * 100)}% completo
                </Badge>
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
                  Este mês
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
                  {data.streak} dias seguidos
                </Badge>
              </div>
            </div>
          </MagicCard>
        </div>

        {/* Weekly Goal */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Meta Semanal</h3>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {data.weeklyGoal.daysLeft} dias restantes
            </Badge>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Horas de estudo</span>
              <span className="text-sm text-muted-foreground">
                {data.weeklyGoal.completed}/{data.weeklyGoal.hours}h
              </span>
            </div>
            <Progress 
              value={(data.weeklyGoal.completed / data.weeklyGoal.hours) * 100} 
              className="h-3"
              indicatorClassName="bg-gradient-to-r from-primary to-primary-600"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {data.weeklyGoal.hours - data.weeklyGoal.completed}h restantes
              </span>
              <span className="font-medium text-primary">
                {Math.round((data.weeklyGoal.completed / data.weeklyGoal.hours) * 100)}% concluído
              </span>
            </div>
          </div>
        </MagicCard>

        {/* Recent Activity */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Atividade Recente</h3>
            <Button variant="outline" size="sm">
              Ver todas
            </Button>
          </div>
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
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString('pt-BR')}
                    </span>
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
        </MagicCard>

        {/* Achievements */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center gap-3 mb-6">
            <Star className="h-6 w-6 text-warning" />
            <h3 className="text-xl font-bold">Conquistas Recentes</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Primeira Conquista', description: 'Complete seu primeiro curso', earned: true },
              { title: 'Maratonista', description: 'Estude por 7 dias seguidos', earned: true },
              { title: 'Matemático', description: 'Complete todos os exercícios de matemática', earned: false },
              { title: 'Leitor Ávido', description: 'Leia 10 artigos de português', earned: true },
              { title: 'Historiador', description: 'Complete o curso de história', earned: false },
              { title: 'Persistente', description: 'Mantenha uma sequência de 30 dias', earned: false },
            ].map((achievement, index) => (
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
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
