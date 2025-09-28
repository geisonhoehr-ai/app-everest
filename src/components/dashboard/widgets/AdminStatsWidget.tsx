import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card'
import { mockAdminStats } from '@/lib/dashboard-data'
import { useCountAnimation, useStaggeredAnimation, useFloat } from '@/hooks/useAnimations'
import { memo, useEffect } from 'react'
import { cn } from '@/lib/utils'

const AdminStatsWidget = memo(() => {
  const delays = useStaggeredAnimation(mockAdminStats.length, 100)
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {mockAdminStats.map((stat, index) => {
        const { count, startAnimation } = useCountAnimation(
          parseInt(stat.value.replace(/[^0-9]/g, '')) || 0,
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
