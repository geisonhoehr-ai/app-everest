/**
 * Logger Service
 *
 * Centralized logging system that only logs in development mode.
 * Use this instead of console.log/error/warn throughout the application.
 */

const isDev = import.meta.env.DEV

export const logger = {
  /**
   * Debug level logging - only visible in development
   * Use for detailed debugging information
   */
  debug: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`🔍 ${message}`, ...args)
    }
  },

  /**
   * Info level logging - only visible in development
   * Use for general information
   */
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`ℹ️  ${message}`, ...args)
    }
  },

  /**
   * Warning level logging - only visible in development
   * Use for warnings that don't break functionality
   */
  warn: (message: string, ...args: any[]) => {
    if (isDev) {
      console.warn(`⚠️  ${message}`, ...args)
    }
  },

  /**
   * Error level logging - always visible
   * Use for errors that need attention
   * Can be integrated with error tracking services (Sentry, LogRocket, etc)
   */
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${message}`, ...args)
    // TODO: Integrate with error tracking service
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(new Error(message), { extra: args })
    // }
  },

  /**
   * Success level logging - only visible in development
   * Use for successful operations
   */
  success: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`✅ ${message}`, ...args)
    }
  }
}
