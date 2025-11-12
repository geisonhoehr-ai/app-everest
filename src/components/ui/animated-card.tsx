import * as React from 'react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
import { cn } from '@/lib/utils';
import { useAnimations, useShimmer, useRipple } from '@/hooks/useAnimations';

// Import animations CSS
import '@/styles/animations.css';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  loading?: boolean;
  animationDelay?: number;
  interactive?: boolean;
  gradient?: boolean;
  shimmer?: boolean;
  glow?: boolean;
  glass?: boolean;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ 
    className, 
    children, 
    loading, 
    animationDelay = 0, 
    interactive = true,
    gradient = true,
    shimmer = true,
    glow = false,
    glass = false,
    ...props 
  }, ref) => {
    const { ref: animationRef, isVisible, animationStyles } = useAnimations({
      delay: animationDelay,
      once: true,
    });

    const shimmerProps = useShimmer(loading || false);
    const createRipple = useRipple();

    return (
      <Card
        ref={(node) => {
          // Handle both refs
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
          animationRef(node);
        }}
        className={cn(
          'group relative overflow-hidden',
          interactive && [
            'hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10',
            'hover:border-primary/20 transition-all duration-300 ease-out'
          ],
          'transition-all duration-300 ease-out will-change-transform',
          loading && shimmerProps.className,
          isVisible && 'animate-fade-in-up',
          glow && 'shadow-glow hover:shadow-glow-lg',
          glass && 'glass-dark',
          className
        )}
        style={{
          ...animationStyles,
          ...shimmerProps.style,
        }}
        onClick={interactive ? createRipple : undefined}
        {...props}
      >
        {/* Enhanced gradient overlay */}
        {gradient && !loading && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ willChange: 'opacity' }}
          />
        )}
        
        {/* Loading shimmer effect */}
        {loading && shimmer && (
          <div 
            className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            style={{ backgroundSize: '200% 100%', willChange: 'background-position' }}
          />
        )}
        
        {/* Glow effect */}
        {glow && (
          <div 
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at center, rgba(251, 146, 60, 0.1) 0%, transparent 70%)',
              willChange: 'opacity'
            }}
          />
        )}
        
        {children}
      </Card>
    );
  }
);
AnimatedCard.displayName = 'AnimatedCard';

// Animated variants of other Card components
const AnimatedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    {...props}
  />
));
AnimatedCardHeader.displayName = 'AnimatedCardHeader';

const AnimatedCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardTitle
    ref={ref}
    className={cn(
      'group-hover:text-primary transition-colors duration-200',
      className
    )}
    {...props}
  />
));
AnimatedCardTitle.displayName = 'AnimatedCardTitle';

const AnimatedCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardDescription
    ref={ref}
    className={cn(
      'group-hover:text-primary/80 transition-colors duration-200',
      className
    )}
    {...props}
  />
));
AnimatedCardDescription.displayName = 'AnimatedCardDescription';

const AnimatedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardContent
    ref={ref}
    className={cn(
      'group-hover:translate-y-[-1px] transition-transform duration-200',
      className
    )}
    style={{ willChange: 'transform' }}
    {...props}
  />
));
AnimatedCardContent.displayName = 'AnimatedCardContent';

const AnimatedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardFooter
    ref={ref}
    className={cn(
      'group-hover:translate-y-[-1px] transition-transform duration-200',
      className
    )}
    style={{ willChange: 'transform' }}
    {...props}
  />
));
AnimatedCardFooter.displayName = 'AnimatedCardFooter';

export {
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardTitle,
  AnimatedCardDescription,
  AnimatedCardContent,
  AnimatedCardFooter,
};
