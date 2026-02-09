import React from 'react'
import { cn } from '@/lib/utils'
import { designTokens, applyGradient } from '@/lib/design-tokens'

// Componente de fundo com gradiente animado
interface AnimatedGradientBackgroundProps {
  children: React.ReactNode
  gradient?: keyof typeof designTokens.gradients
  className?: string
  speed?: 'slow' | 'normal' | 'fast'
}

export const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  children,
  gradient = 'primary',
  className,
  speed = 'normal',
}) => {
  const speedClasses = {
    slow: 'animate-pulse',
    normal: 'animate-bounce',
    fast: 'animate-ping',
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Gradiente animado de fundo */}
      <div
        className={cn(
          'absolute inset-0 opacity-20',
          speedClasses[speed]
        )}
        style={applyGradient(gradient)}
      />
      
      {/* Gradiente estático */}
      <div
        className="absolute inset-0 opacity-30"
        style={applyGradient(gradient)}
      />
      
      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Componente de glassmorphism
interface GlassCardProps {
  children: React.ReactNode
  className?: string
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  opacity?: number
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  blur = 'md',
  opacity = 0.1,
}) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/20',
        blurClasses[blur],
        className
      )}
      style={{
        background: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blur === 'sm' ? '4px' : blur === 'md' ? '8px' : blur === 'lg' ? '12px' : '16px'})`,
      }}
    >
      {children}
    </div>
  )
}

// Componente de partículas flutuantes
interface FloatingParticlesProps {
  count?: number
  size?: 'sm' | 'md' | 'lg'
  speed?: 'slow' | 'normal' | 'fast'
  color?: string
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 20,
  size = 'md',
  speed = 'normal',
  color = designTokens.colors.primary[500],
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }

  const speedClasses = {
    slow: 'animate-pulse',
    normal: 'animate-bounce',
    fast: 'animate-ping',
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'absolute rounded-full opacity-20',
            sizeClasses[size],
            speedClasses[speed]
          )}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: color,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  )
}

// Componente de shimmer loading
interface ShimmerProps {
  className?: string
  width?: string
  height?: string
}

export const Shimmer: React.FC<ShimmerProps> = ({
  className,
  width = '100%',
  height = '1rem',
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      style={{ width, height }}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  )
}

// Componente de neumorphism
interface NeumorphicCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'raised' | 'pressed' | 'flat'
  intensity?: 'light' | 'medium' | 'strong'
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  className,
  variant = 'raised',
  intensity = 'medium',
}) => {
  const getNeumorphicStyles = () => {
    const baseColor = 'hsl(var(--background))'
    const lightColor = 'rgba(255, 255, 255, 0.1)'
    const darkColor = 'rgba(0, 0, 0, 0.1)'
    
    const intensityMultiplier = {
      light: 0.5,
      medium: 1,
      strong: 1.5,
    }[intensity]

    if (variant === 'raised') {
      return {
        background: baseColor,
        boxShadow: `
          ${8 * intensityMultiplier}px ${8 * intensityMultiplier}px ${16 * intensityMultiplier}px ${darkColor},
          -${8 * intensityMultiplier}px -${8 * intensityMultiplier}px ${16 * intensityMultiplier}px ${lightColor}
        `,
      }
    } else if (variant === 'pressed') {
      return {
        background: baseColor,
        boxShadow: `
          inset ${4 * intensityMultiplier}px ${4 * intensityMultiplier}px ${8 * intensityMultiplier}px ${darkColor},
          inset -${4 * intensityMultiplier}px -${4 * intensityMultiplier}px ${8 * intensityMultiplier}px ${lightColor}
        `,
      }
    } else {
      return {
        background: baseColor,
        boxShadow: `
          ${4 * intensityMultiplier}px ${4 * intensityMultiplier}px ${8 * intensityMultiplier}px ${darkColor},
          -${4 * intensityMultiplier}px -${4 * intensityMultiplier}px ${8 * intensityMultiplier}px ${lightColor}
        `,
      }
    }
  }

  return (
    <div
      className={cn('rounded-xl transition-all duration-300', className)}
      style={getNeumorphicStyles()}
    >
      {children}
    </div>
  )
}

// Componente de hover effect com transformação 3D
interface Card3DProps {
  children: React.ReactNode
  className?: string
  intensity?: number
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className,
  intensity = 10,
}) => {
  return (
    <div
      className={cn(
        'relative transition-transform duration-300 ease-out',
        'hover:scale-105 hover:rotate-1',
        className
      )}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const rotateX = (y - centerY) / centerY * intensity
        const rotateY = (centerX - x) / centerX * intensity
        
        e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
      }}
    >
      {children}
    </div>
  )
}
