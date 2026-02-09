import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { designTokens, applyGradient, applyShadow, applyBorderRadius, applyAnimation } from '@/lib/design-tokens'

interface ModernCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'gradient' | 'glass' | 'elevated' | 'outlined'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  glow?: boolean
  gradient?: keyof typeof designTokens.gradients
  onClick?: () => void
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  hover = true,
  glow = false,
  gradient = 'primary',
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  }

  const variantStyles = {
    default: {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      ...applyShadow('md'),
    },
    gradient: {
      ...applyGradient(gradient),
      border: 'none',
      ...applyShadow('lg'),
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      ...applyShadow('glass'),
    },
    elevated: {
      backgroundColor: 'hsl(var(--card))',
      border: 'none',
      ...applyShadow('xl'),
    },
    outlined: {
      backgroundColor: 'transparent',
      border: '2px solid hsl(var(--border))',
      ...applyShadow('none'),
    },
  }

  const hoverStyles = hover ? {
    transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
    ...applyShadow(isHovered ? '2xl' : 'lg'),
  } : {}

  const glowStyles = glow ? {
    boxShadow: isHovered 
      ? `${designTokens.shadows.glow}, ${designTokens.shadows.xl}`
      : designTokens.shadows.lg,
  } : {}

  return (
    <div
      className={cn(
        'relative overflow-hidden transition-all duration-300 ease-out cursor-pointer',
        sizeClasses[size],
        className
      )}
      style={{
        ...variantStyles[variant],
        ...hoverStyles,
        ...glowStyles,
        ...applyBorderRadius('xl'),
        ...applyAnimation('normal', 'smooth'),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Efeito de brilho no hover */}
      {hover && (
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.1 : 0,
            background: `radial-gradient(circle at 50% 50%, ${designTokens.colors.primary[500]} 0%, transparent 70%)`,
          }}
        />
      )}
      
      {/* Conteúdo do card */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Componente de Card com Header
interface ModernCardWithHeaderProps extends ModernCardProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const ModernCardWithHeader: React.FC<ModernCardWithHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  children,
  ...cardProps
}) => {
  return (
    <ModernCard {...cardProps}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          {children}
        </div>
      </div>
    </ModernCard>
  )
}

// Componente de Card com Estatísticas
interface ModernStatsCardProps extends Omit<ModernCardProps, 'children'> {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: React.ReactNode
  trend?: React.ReactNode
}

export const ModernStatsCard: React.FC<ModernStatsCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  ...cardProps
}) => {
  return (
    <ModernCard {...cardProps}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          
          {change && (
            <div className="flex items-center space-x-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  change.type === 'increase' ? 'text-success' : 'text-error'
                )}
              >
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
              {trend && <span className="text-muted-foreground">{trend}</span>}
            </div>
          )}
        </div>
      </div>
    </ModernCard>
  )
}
