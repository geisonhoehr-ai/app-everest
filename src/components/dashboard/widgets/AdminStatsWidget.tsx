import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card'
import { dashboardService, DashboardStats } from '@/services/dashboardService'
import { useCountAnimation, useStaggeredAnimation, useFloat } from '@/hooks/useAnimations'
import { memo, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { BookOpen, Layers, ListChecks, ClipboardCheck, Archive, Calendar, Radio, Users } from 'lucide-react'

const AdminStatsWidget = memo(() => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await dashboardService.getDashboardStats()
        setStats(dashboardStats)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const adminStats = stats ? [
    { title: 'Cursos', value: stats.courses, icon: BookOpen },
    { title: 'Flashcards', value: `${stats.flashcards} Tópicos`, icon: Layers },
    { title: 'Quizzes', value: `${stats.quizzes} Tópicos`, icon: ListChecks },
    { title: 'Simulados', value: stats.simulations, icon: ClipboardCheck },
    { title: 'Questões', value: stats.questions, icon: Archive },
    { title: 'Eventos', value: stats.events, icon: Calendar },
    { title: 'Evercasts', value: stats.evercasts, icon: Radio },
    { title: 'Alunos', value: stats.students, icon: Users },
  ] : []

  const delays = useStaggeredAnimation(adminStats.length, 100)
  
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {adminStats.map((stat, index) => {
        const { count, startAnimation } = useCountAnimation(
          typeof stat.value === 'number' ? stat.value : parseInt(stat.value.replace(/[^0-9]/g, '')) || 0,
          1000
        )
        const floatProps = useFloat()

        useEffect(() => {
          const timer = setTimeout(startAnimation, delays[index].delay + 300)
          return () => clearTimeout(timer)
        }, [delays, index, startAnimation])

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
              <div className="text-2xl font-bold animate-count-up">
                {typeof stat.value === 'number' ? count : stat.value}
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        )
      })}
    </div>
  )
})

AdminStatsWidget.displayName = 'AdminStatsWidget'

export default AdminStatsWidget
