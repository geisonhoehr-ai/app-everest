import * as React from 'react';
import { cn } from '@/lib/utils';

interface MagicLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
  showHeader?: boolean;
  className?: string;
}

const MagicLayout = React.forwardRef<HTMLDivElement, MagicLayoutProps>(
  ({ title, description, children, showHeader = true, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen bg-gradient-to-br from-background via-background to-muted/20',
          'relative overflow-hidden',
          className
        )}
        {...props}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {showHeader && (title || description) && (
            <div className="container mx-auto px-6 py-8 animate-fade-in-up">
              <div className="max-w-4xl">
                {title && (
                  <h1 className={cn(
                    'text-4xl md:text-5xl font-bold mb-4',
                    'bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70',
                    'bg-clip-text text-transparent'
                  )}>
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-lg text-muted-foreground animate-fade-in-up animation-delay-200">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="container mx-auto px-6 pb-8">
            <div className="animate-fade-in-up animation-delay-300">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MagicLayout.displayName = 'MagicLayout';

export { MagicLayout };
