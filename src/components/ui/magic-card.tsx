import * as React from 'react';
import { cn } from '@/lib/utils';

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  gradient?: boolean;
  glass?: boolean;
  interactive?: boolean;
  led?: boolean;
  ledColor?: 'green' | 'cyan' | 'purple' | 'orange';
  children: React.ReactNode;
}

const MagicCard = React.forwardRef<HTMLDivElement, MagicCardProps>(
  ({ glow = true, gradient = true, glass = false, interactive = true, led = false, ledColor = 'green', children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group relative rounded-xl border border-border/50 overflow-hidden',
          'bg-card/95 backdrop-blur-sm shadow-sm',
          'transition-all duration-300 ease-out',
          'will-change-transform',
          led && [
            ledColor === 'green' && 'led-border animate-ledBorder',
            ledColor === 'cyan' && 'led-border-cyan animate-ledBorder',
            ledColor === 'purple' && 'led-border-purple animate-ledBorder',
            ledColor === 'orange' && 'led-border-orange animate-ledBorder'
          ],
          interactive && [
            'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/10',
            'hover:border-border/70 hover:bg-card',
            'cursor-pointer'
          ],
          glow && 'hover:shadow-md hover:shadow-primary/10',
          glass && 'bg-card/90 backdrop-blur-md border-border/60',
          className
        )}
        {...props}
      >
        {/* Gradient Overlay */}
        {gradient && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted/5 via-transparent to-muted/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
        
        {/* Glow Effect */}
        {glow && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-xl blur-sm" />
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Border Glow */}
        <div className="absolute inset-0 rounded-xl border border-transparent bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    );
  }
);

MagicCard.displayName = 'MagicCard';

export { MagicCard };
