import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card'
import { FileText, MessageSquare, Users } from 'lucide-react'
import { useCountAnimation, useStaggeredAnimation, useFloat } from '@/hooks/useAnimations'
import { memo, useEffect } from 'react'
import { cn } from '@/lib/utils'

const stats = [
  {
    title: 'Redações para Corrigir',
    value: 12,
    description: 'Aguardando sua avaliação',
    icon: FileText,
  },
  {
    title: 'Dúvidas no Fórum',
    value: 8,
    description: 'Tópicos não respondidos',
    icon: MessageSquare,
  },
  {
    title: 'Alunos Ativos',
    value: 237,
    description: 'Em suas turmas',
    icon: Users,
  },
]

const TeacherStatsWidget = memo(() => {
  const delays = useStaggeredAnimation(stats.length, 100)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => {
        const { count, startAnimation } = useCountAnimation(stat.value, 1000)
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
