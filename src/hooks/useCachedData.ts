import { useState, useEffect, useCallback } from 'react'
import { cachedFetch } from '@/lib/offlineCache'

interface UseCachedDataResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  fromCache: boolean
  cachedAt: number | null
  refetch: () => void
}

/**
 * Hook para buscar dados com fallback offline.
 * Mostra dados do último acesso quando sem internet.
 *
 * Uso:
 * ```tsx
 * const { data: courses, isLoading, fromCache } = useCachedData(
 *   'my-courses',
 *   () => courseService.getUserCourses(userId),
 *   { enabled: !!userId }
 * )
 * ```
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { enabled?: boolean; maxAgeMs?: number }
): UseCachedDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [cachedAt, setCachedAt] = useState<number | null>(null)

  const enabled = options?.enabled ?? true

  const doFetch = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await cachedFetch(key, fetcher, { maxAgeMs: options?.maxAgeMs })
      setData(result.data)
      setFromCache(result.fromCache)
      setCachedAt(result.cachedAt ?? null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar dados'))
    } finally {
      setIsLoading(false)
    }
  }, [key, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    doFetch()
  }, [doFetch])

  // Refetch quando voltar online
  useEffect(() => {
    const handleOnline = () => {
      if (fromCache) doFetch()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [doFetch, fromCache])

  return { data, isLoading, error, fromCache, cachedAt, refetch: doFetch }
}
