import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card'
import { FileText, MessageSquare, Users } from 'lucide-react'
import { useCountAnimation, useStaggeredAnimation, useFloat } from '@/hooks/useAnimations'
import { memo, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { dashboardService } from '@/services/dashboardService'
import { useAuth } from '@/hooks/use-auth'

const TeacherStatsWidget = memo(() => {
  const { user } = useAuth()
  const [teacherStats, setTeacherStats] = useState<{
    essaysToCorrect: number
    forumQuestions: number
    activeStudents: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return
      
      try {
        const stats = await dashboardService.getTeacherStats(user.id)
        setTeacherStats(stats)
      } catch (error) {
        console.error('Erro ao carregar estatísticas do professor:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user?.id])

  const stats = teacherStats ? [
    {
      title: 'Redações para Corrigir',
      value: teacherStats.essaysToCorrect,
      description: 'Aguardando sua avaliação',
      icon: FileText,
    },
    {
      title: 'Dúvidas no Fórum',
      value: teacherStats.forumQuestions,
      description: 'Tópicos não respondidos',
      icon: MessageSquare,
    },
    {
      title: 'Alunos Ativos',
      value: teacherStats.activeStudents,
      description: 'Em suas turmas',
      icon: Users,
    },
  ] : []

  const delays = useStaggeredAnimation(stats.length, 100)

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  // Criar hooks fixos para evitar problemas de ordem
  const countAnimation1 = useCountAnimation(stats[0]?.value || 0, 1000)
  const countAnimation2 = useCountAnimation(stats[1]?.value || 0, 1000)
  const countAnimation3 = useCountAnimation(stats[2]?.value || 0, 1000)
  const floatProps = useFloat()

  const countAnimations = [countAnimation1, countAnimation2, countAnimation3]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => {
        const { count, startAnimation } = countAnimations[index]

        useEffect(() => {
          const timer = setTimeout(startAnimation, delays[index].delay + 300)
          return () => clearTimeout(timer)
        }, [index, startAnimation])

        return (
          <AnimatedCard
            key={stat.title}
            animationDelay={delays[index].delay}
            className="transform-gpu"
          >
            <AnimatedCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <AnimatedCardTitle className="text-sm font-medium">
                {stat.title}
              </AnimatedCardTitle>
              <stat.icon 
                className={cn(
                  "h-4 w-4 text-muted-foreground",
                  floatProps.className
                )}
                style={floatProps.style}
              />
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <div className="text-2xl font-bold animate-count-up">{count}</div>
              <p className="text-xs text-muted-foreground group-hover:translate-y-[-1px] transition-transform duration-200">
                {stat.description}
              </p>
            </AnimatedCardContent>
          </AnimatedCard>
        )
      })}
    </div>
  )
})

TeacherStatsWidget.displayName = 'TeacherStatsWidget'

export default TeacherStatsWidget
