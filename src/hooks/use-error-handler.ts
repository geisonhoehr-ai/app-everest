/**
 * Error Handler Hook
 *
 * Centralized error handling that logs errors and shows user-friendly messages.
 * Use this instead of try-catch blocks with console.error throughout the application.
 */

import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'

export interface ErrorHandlerOptions {
  /**
   * Custom message to show to the user
   * If not provided, will use the error message or a generic message
   */
  userMessage?: string

  /**
   * Whether to show a toast notification
   * Default: true
   */
  showToast?: boolean

  /**
   * Toast duration in milliseconds
   * Default: 5000
   */
  duration?: number
}

export const useErrorHandler = () => {
  const { toast } = useToast()

  const handleError = (error: unknown, options: ErrorHandlerOptions = {}) => {
    const {
      userMessage,
      showToast = true,
      duration = 5000
    } = options

    // Extract error message
    let errorMessage = 'Algo deu errado. Por favor, tente novamente.'
    if (error instanceof Error) {
      errorMessage = error.message
      logger.error('Error occurred:', error)
    } else if (typeof error === 'string') {
      errorMessage = error
      logger.error('Error occurred:', error)
    } else {
      logger.error('Unknown error occurred:', error)
    }

    // Show toast notification if enabled
    if (showToast) {
      toast({
        title: 'Erro',
        description: userMessage || errorMessage,
        variant: 'destructive',
        duration
      })
    }

    return errorMessage
  }

  const handleSuccess = (message: string, duration: number = 3000) => {
    logger.success(message)
    toast({
      title: 'Sucesso',
      description: message,
      duration
    })
  }

  const handleInfo = (message: string, duration: number = 3000) => {
    logger.info(message)
    toast({
      description: message,
      duration
    })
  }

  return {
    handleError,
    handleSuccess,
    handleInfo
  }
}
