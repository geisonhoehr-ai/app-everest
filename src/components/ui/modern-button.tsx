import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { designTokens, applyGradient, applyShadow, applyBorderRadius, applyAnimation } from '@/lib/design-tokens'

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'outline' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  gradient?: keyof typeof designTokens.gradients
  glow?: boolean
  ripple?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  variant = 'primary',
  size = 'md',
  gradient = 'primary',
  glow = false,
  ripple = true,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className,
  onClick,
  disabled,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  }

  const variantStyles = {
    primary: {
      backgroundColor: designTokens.colors.primary[600],
      color: 'white',
      border: 'none',
      ...applyShadow('md'),
    },
    secondary: {
      backgroundColor: designTokens.colors.secondary[600],
      color: 'white',
      border: 'none',
      ...applyShadow('md'),
    },
    accent: {
      backgroundColor: designTokens.colors.accent[600],
      color: 'white',
      border: 'none',
      ...applyShadow('md'),
    },
    success: {
      backgroundColor: designTokens.colors.success[600],
      color: 'white',
      border: 'none',
      ...applyShadow('md'),
    },
    warning: {
      backgroundColor: designTokens.colors.warning[600],
      color: 'white',
      border: 'none',
      ...applyShadow('md'),
    },
    error: {
      backgroundColor: designTokens.colors.error[600],
      color: 'white',
      border: 'none',
      ...applyShadow('md'),
    },
    outline: {
      backgroundColor: 'transparent',
      color: designTokens.colors.primary[600],
      border: `2px solid ${designTokens.colors.primary[600]}`,
      ...applyShadow('none'),
    },
    ghost: {
      backgroundColor: 'transparent',
      color: designTokens.colors.primary[600],
      border: 'none',
      ...applyShadow('none'),
    },
    gradient: {
      ...applyGradient(gradient),
      color: 'white',
      border: 'none',
      ...applyShadow('lg'),
    },
  }

  const hoverStyles = {
    transform: isHovered ? 'translateY(-2px) scale(1.05)' : 'translateY(0) scale(1)',
    ...applyShadow(isHovered ? 'xl' : 'md'),
  }

  const glowStyles = glow ? {
    boxShadow: isHovered 
      ? `${designTokens.shadows.glow}, ${designTokens.shadows.xl}`
      : designTokens.shadows.lg,
  } : {}

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const newRipple = {
        id: Date.now(),
        x,
        y,
      }
      
      setRipples(prev => [...prev, newRipple])
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
      }, 600)
    }
    
    onClick?.(e)
  }

  return (
    <button
      className={cn(
        'relative overflow-hidden font-medium transition-transform transition-colors transition-shadow duration-300 ease-out inline-flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        sizeClasses[size],
        className
      )}
      style={{
        ...variantStyles[variant],
        ...hoverStyles,
        ...glowStyles,
        ...applyBorderRadius('lg'),
        ...applyAnimation('normal', 'smooth'),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Efeito de brilho no hover */}
      {isHovered && (
        <div
          className="absolute inset-0 opacity-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${designTokens.colors.primary[500]} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Ripple effect */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
          }}
        />
      ))}

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      <div className={cn('flex items-center justify-center space-x-2', loading && 'opacity-0')}>
        {icon && iconPosition === 'left' && (
          <span className={iconSizeClasses[size]}>{icon}</span>
        )}
        <span>{children}</span>
        {icon && iconPosition === 'right' && (
          <span className={iconSizeClasses[size]}>{icon}</span>
        )}
      </div>
    </button>
  )
}

// Botão com ícone flutuante
interface FloatingActionButtonProps extends Omit<ModernButtonProps, 'children'> {
  icon: React.ReactNode
  tooltip?: string
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  tooltip,
  className,
  ...props
}) => {
  return (
    <div className="relative group">
      <ModernButton
        className={cn(
          'w-14 h-14 rounded-full p-0 shadow-lg',
          className
        )}
        {...props}
      >
        {icon}
      </ModernButton>
      
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  )
}
