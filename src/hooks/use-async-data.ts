/**
 * Async Data Hook
 *
 * Reusable hook for fetching data with loading, error states, and automatic error handling.
 * Eliminates the need for repetitive useState and useEffect patterns.
 *
 * @example
 * ```tsx
 * const { data: users, loading, error, refetch } = useAsyncData(
 *   () => userService.getUsers(),
 *   { errorMessage: 'Falha ao carregar usuários' }
 * )
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import { useErrorHandler } from './use-error-handler'
import { logger } from '@/lib/logger'

export interface UseAsyncDataOptions {
  /**
   * Custom error message to show to the user
   */
  errorMessage?: string

  /**
   * Whether to show toast on error
   * Default: true
   */
  showErrorToast?: boolean

  /**
   * Whether to fetch data immediately on mount
   * Default: true
   */
  immediate?: boolean

  /**
   * Dependencies array for refetching
   * Similar to useEffect dependencies
   */
  deps?: any[]
}

export interface UseAsyncDataResult<T> {
  /**
   * The fetched data
   */
  data: T | null

  /**
   * Loading state
   */
  loading: boolean

  /**
   * Error object if fetch failed
   */
  error: Error | null

  /**
   * Function to manually refetch the data
   */
  refetch: () => Promise<void>

  /**
   * Function to set data manually
   */
  setData: (data: T | null) => void
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions = {}
): UseAsyncDataResult<T> {
  const {
    errorMessage,
    showErrorToast = true,
    immediate = true,
    deps = []
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<Error | null>(null)
  const { handleError } = useErrorHandler()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      logger.debug('Fetching data...')

      const result = await fetcher()
      setData(result)
      logger.success('Data fetched successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setData(null)

      if (showErrorToast) {
        handleError(error, { userMessage: errorMessage })
      } else {
        logger.error('Error fetching data:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [fetcher, errorMessage, showErrorToast, handleError])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData
  }
}
