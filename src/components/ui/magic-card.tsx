import * as React from 'react';
import { cn } from '@/lib/utils';

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'premium' | 'glass' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  gradient?: boolean;
  glass?: boolean;
  interactive?: boolean;
  led?: boolean;
  ledColor?: 'green' | 'cyan' | 'purple' | 'orange' | 'pink' | 'blue';
  children: React.ReactNode;
}

const MagicCard = React.forwardRef<HTMLDivElement, MagicCardProps>(
  ({
    variant = 'premium',
    size = 'md',
    glow = true,
    gradient = true,
    glass = false,
    interactive = true,
    led = false,
    ledColor = 'purple',
    children,
    className,
    ...props
  }, ref) => {
    const sizeClasses = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };

    const variantClasses = {
      default: 'bg-card/95 border-border/50',
      premium: 'bg-gradient-to-br from-card/90 via-card/80 to-card/90 border-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20',
      glass: 'bg-card/20 backdrop-blur-xl border-white/10 shadow-2xl',
      neon: 'bg-gradient-to-br from-primary/10 via-purple-900/20 to-cyan-900/20 border-primary/30 shadow-primary/20'
    };

    const glowClasses = {
      green: 'hover:shadow-green-500/25 hover:shadow-2xl',
      cyan: 'hover:shadow-cyan-500/25 hover:shadow-2xl',
      purple: 'hover:shadow-purple-500/25 hover:shadow-2xl',
      orange: 'hover:shadow-orange-500/25 hover:shadow-2xl',
      pink: 'hover:shadow-pink-500/25 hover:shadow-2xl',
      blue: 'hover:shadow-blue-500/25 hover:shadow-2xl'
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'group relative rounded-2xl overflow-hidden h-full',
          'transition-all duration-500 ease-out',
          'will-change-transform',

          // Size
          sizeClasses[size],

          // Variant styles
          variantClasses[variant],

          // LED effects
          led && [
            'relative',
            'before:absolute before:inset-0 before:rounded-2xl before:p-[2px] before:bg-gradient-to-r',
            ledColor === 'green' && 'before:from-green-400/50 before:via-green-500/70 before:to-green-400/50 before:animate-pulse',
            ledColor === 'cyan' && 'before:from-cyan-400/50 before:via-cyan-500/70 before:to-cyan-400/50 before:animate-pulse',
            ledColor === 'purple' && 'before:from-purple-400/50 before:via-purple-500/70 before:to-purple-400/50 before:animate-pulse',
            ledColor === 'orange' && 'before:from-orange-400/50 before:via-orange-500/70 before:to-orange-400/50 before:animate-pulse',
            ledColor === 'pink' && 'before:from-pink-400/50 before:via-pink-500/70 before:to-pink-400/50 before:animate-pulse',
            ledColor === 'blue' && 'before:from-blue-400/50 before:via-blue-500/70 before:to-blue-400/50 before:animate-pulse'
          ],

          // Interactive effects
          interactive && [
            'hover:-translate-y-1',
            'cursor-pointer'
          ],

          // Glow effects
          glow && glowClasses[ledColor],

          // Glass effects
          glass && 'backdrop-blur-2xl bg-white/5 border-white/20',

          className
        )}
        {...props}
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-cyan-500/20 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/5 to-transparent" />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-4 w-1 h-1 bg-primary/60 rounded-full animate-ping" />
          <div className="absolute top-8 right-6 w-0.5 h-0.5 bg-cyan-400/80 rounded-full animate-pulse" />
          <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce" />
        </div>

        {/* Premium Border Glow */}
        {variant === 'premium' && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 p-[1px]">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-card/90 via-card/80 to-card/90" />
          </div>
        )}

        {/* Neon Glow Effect */}
        {variant === 'neon' && (
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/30 via-purple-500/30 to-cyan-500/30 blur-sm" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Hover Shine Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
      </div>
    );
  }
);

MagicCard.displayName = 'MagicCard';

export { MagicCard };
