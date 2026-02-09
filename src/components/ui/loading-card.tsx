import * as React from 'react';
import { cn } from '@/lib/utils';
import { useShimmer } from '@/hooks/useAnimations';

interface LoadingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  showImage?: boolean;
  showButton?: boolean;
}

const LoadingCard = React.forwardRef<HTMLDivElement, LoadingCardProps>(
  ({ className, lines = 3, showImage = true, showButton = true, ...props }, ref) => {
    const shimmerProps = useShimmer(true);

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border p-6 flex flex-col min-h-[280px]',
          shimmerProps.className,
          className
        )}
        style={shimmerProps.style}
        {...props}
      >
        {showImage && (
          <div className="w-full h-32 bg-muted rounded-lg mb-4 animate-shimmer" />
        )}
        
        <div className="space-y-3 flex-grow">
          <div className="h-6 bg-muted rounded animate-shimmer" />
          {Array.from({ length: lines - 1 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'bg-muted rounded animate-shimmer',
                i === lines - 2 ? 'h-4 w-3/4' : 'h-4 w-full'
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        
        {showButton && (
          <div className="mt-4">
            <div className="h-10 bg-muted rounded animate-shimmer" />
          </div>
        )}
      </div>
    );
  }
);

LoadingCard.displayName = 'LoadingCard';

export { LoadingCard };
