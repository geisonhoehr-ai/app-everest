/**
 * Simple in-memory cache with TTL for reducing redundant Supabase queries.
 * Used for data that doesn't change frequently (dashboard stats, course lists).
 *
 * 700 students hitting the same dashboard = 1 query + 699 cache hits.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

export function invalidateCache(keyPrefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key)
    }
  }
}

// TTL constants
export const CACHE_TTL = {
  DASHBOARD_STATS: 5 * 60 * 1000,    // 5 min
  COURSE_LIST: 10 * 60 * 1000,       // 10 min
  LEADERBOARD: 60 * 1000,            // 1 min
  ANALYTICS: 2 * 60 * 1000,          // 2 min
} as const
