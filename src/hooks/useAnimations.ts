import { useEffect, useState, useCallback, useRef } from 'react';

interface AnimationOptions {
  duration?: number;
  delay?: number;
  threshold?: number;
  once?: boolean;
}

export function useAnimations(options: AnimationOptions = {}) {
  const {
    duration = 300,
    delay = 0,
    threshold = 0.1,
    once = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const hasAnimated = useRef(false);

  const onScreen = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!once || !hasAnimated.current)) {
          setIsVisible(true);
          hasAnimated.current = true;
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once]);

  useEffect(() => {
    if (ref) {
      const cleanup = onScreen(ref);
      return cleanup;
    }
  }, [ref, onScreen]);

  const animationStyles = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 20px, 0)',
    transition: `all ${duration}ms cubic-bezier(0.42, 0, 0.58, 1) ${delay}ms`,
    willChange: 'transform, opacity',
  };

  return {
    ref: setRef,
    isVisible,
    animationStyles,
    duration,
    delay,
  };
}

// Hook for staggered animations in lists
export function useStaggeredAnimation(itemCount: number, baseDelay = 100) {
  return Array.from({ length: itemCount }, (_, i) => ({
    delay: baseDelay * i,
  }));
}

// Hook for number counting animation
export function useCountAnimation(endValue: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef(0);
  const startTimeRef = useRef(0);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
    setCount(Math.floor(endValue * progress));

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
    }
  }, [endValue, duration]);

  const startAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    startTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(animate);
  }, [isAnimating, animate]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return { count, startAnimation, isAnimating };
}

// Hook for ripple effect
export function useRipple() {
  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - radius}px`;
    ripple.style.top = `${event.clientY - rect.top - radius}px`;
    ripple.className = 'ripple';
    
    const existingRipple = button.getElementsByClassName('ripple')[0];
    if (existingRipple) {
      existingRipple.remove();
    }
    
    button.appendChild(ripple);
    
    return () => {
      setTimeout(() => {
        ripple.remove();
      }, 600);
    };
  }, []);

  return createRipple;
}

// Hook for shimmer loading effect
export function useShimmer(isLoading: boolean) {
  return {
    className: isLoading ? 'loading-shimmer' : '',
    style: {
      position: 'relative',
      overflow: 'hidden',
    },
  };
}

// Hook for float animation
export function useFloat() {
  return {
    className: 'animate-float',
    style: {
      willChange: 'transform',
    },
  };
}