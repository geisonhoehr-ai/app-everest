import { LoadingCard } from '@/components/ui/loading-card'
import { cn } from '@/lib/utils'

export const SectionLoader = () => (
  <div className="bg-background">
    <div className="container py-16 md:py-24">
      <div className="flex flex-col items-center space-y-6 animate-fade-in-up">
        <div className="h-8 w-1/2 bg-muted rounded-md animate-shimmer" />
        <div className="h-6 w-3/4 bg-muted rounded-md animate-shimmer animation-delay-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-8">
          <LoadingCard 
            className="animate-fade-in-up animation-delay-300"
            lines={3}
          />
          <LoadingCard 
            className="animate-fade-in-up animation-delay-400"
            lines={3}
          />
          <LoadingCard 
            className="animate-fade-in-up animation-delay-500"
            lines={3}
          />
        </div>
      </div>
    </div>
  </div>
)
