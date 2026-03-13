/**
 * Cache offline genérico para dados de páginas.
 * Salva respostas da API no IndexedDB e serve quando offline.
 *
 * Estratégia: Network First — tenta a rede, se falhar serve do cache.
 * Quando online: busca da rede e atualiza o cache silenciosamente.
 * Quando offline: retorna dados do último acesso.
 */

import { openDB, type IDBPDatabase } from 'idb'
import { logger } from '@/lib/logger'

const DB_NAME = 'everest-page-cache'
const DB_VERSION = 1
const STORE_NAME = 'pages'

interface CachedPage<T = unknown> {
  key: string
  data: T
  cachedAt: number
}

let db: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (db) return db
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    },
  })
  return db
}

/**
 * Salva dados no cache offline.
 */
async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const database = await getDB()
    await database.put(STORE_NAME, {
      key,
      data,
      cachedAt: Date.now(),
    } satisfies CachedPage<T>)
  } catch (err) {
    logger.error('[OfflineCache] Erro ao salvar:', err)
  }
}

/**
 * Busca dados do cache offline.
 * Retorna null se não houver dados ou se estiverem expirados.
 */
async function getFromCache<T>(key: string, maxAgeMs?: number): Promise<{ data: T; cachedAt: number } | null> {
  try {
    const database = await getDB()
    const entry = await database.get(STORE_NAME, key) as CachedPage<T> | undefined
    if (!entry) return null
    if (maxAgeMs && (Date.now() - entry.cachedAt) > maxAgeMs) return null
    return { data: entry.data, cachedAt: entry.cachedAt }
  } catch (err) {
    logger.error('[OfflineCache] Erro ao buscar:', err)
    return null
  }
}

/**
 * Wrapper Network-First para qualquer fetch de dados.
 *
 * Uso:
 * ```ts
 * const courses = await cachedFetch('user-courses', () => courseService.getUserCourses(userId))
 * ```
 *
 * Retorna { data, fromCache, cachedAt }
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { maxAgeMs?: number }
): Promise<{ data: T; fromCache: boolean; cachedAt?: number }> {
  // Online: tenta a rede primeiro
  if (navigator.onLine) {
    try {
      const data = await fetcher()
      // Salva no cache em background (não bloqueia)
      saveToCache(key, data)
      return { data, fromCache: false }
    } catch (err) {
      // Rede falhou mesmo online — tenta cache
      logger.error('[OfflineCache] Fetch falhou, tentando cache:', err)
      const cached = await getFromCache<T>(key, options?.maxAgeMs)
      if (cached) {
        return { data: cached.data, fromCache: true, cachedAt: cached.cachedAt }
      }
      throw err
    }
  }

  // Offline: busca do cache
  const cached = await getFromCache<T>(key, options?.maxAgeMs)
  if (cached) {
    return { data: cached.data, fromCache: true, cachedAt: cached.cachedAt }
  }

  throw new Error('Sem conexão e sem dados em cache')
}

/**
 * Limpa todo o cache de páginas.
 */
export async function clearPageCache(): Promise<void> {
  try {
    const database = await getDB()
    await database.clear(STORE_NAME)
  } catch (err) {
    logger.error('[OfflineCache] Erro ao limpar cache:', err)
  }
}
