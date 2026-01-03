/* Button Component primitives - A component that displays a button - from shadcn/ui (exposes Button, buttonVariants) */
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { useRipple } from '@/hooks/useAnimations'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-transform transition-colors transition-shadow duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden will-change-transform',
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground',
          'hover:from-primary/90 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/20',
          'hover:scale-[1.02] active:scale-[0.98]'
        ],
        destructive: [
          'bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground',
          'hover:from-destructive/90 hover:to-destructive/80 hover:shadow-lg hover:shadow-destructive/20',
          'hover:scale-[1.02] active:scale-[0.98]'
        ],
        outline: [
          'border border-input bg-transparent text-foreground',
          'hover:bg-primary/5 hover:text-primary hover:border-primary/20',
          'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
        ],
        secondary: [
          'bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground',
          'hover:from-secondary/90 hover:to-secondary/80 hover:shadow-lg',
          'hover:scale-[1.02] active:scale-[0.98]'
        ],
        ghost: [
          'text-foreground hover:bg-primary/5 hover:text-primary',
          'hover:scale-[1.02] active:scale-[0.98]'
        ],
        link: [
          'text-foreground underline-offset-4 hover:underline',
          'hover:text-primary transition-colors duration-300'
        ],
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  ripple?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ripple = true, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const createRipple = useRipple()

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !asChild) {
        createRipple(event)
      }
      onClick?.(event)
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
