/**
 * Serviço de integração direta com a API de Lives do Panda Video v2.
 * Usado apenas pelo admin para criar/gerenciar lives automaticamente.
 */
import { logger } from '@/lib/logger'

const PANDA_API = 'https://api-v2.pandavideo.com.br'
const PANDA_KEY = 'panda-33e2092c0e0334f9a6b353db3ce0ccf89d46dbe076b0aaabd3a88ac1a4ecfd6d'

interface PandaStreamKey {
  id: string
  title: string
  stream_key: string
  user_id: string
  default: boolean
  is_attached: boolean
}

export interface PandaLive {
  id: string
  title: string
  rtmp: string
  stream_key: string
  stream_key_id: string
  user_id: string
  status: string
  live_player: string
  live_hls: string
  active_dvr: boolean
  latency_type: string
  bitrate: string[]
  folder_id: string | null
  vod_id: string | null
  started_at: string | null
  ended_at: string | null
  scheduled_at: string | null
  created_at: string
}

async function pandaFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${PANDA_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': PANDA_KEY,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    logger.error(`[PandaLive] ${options?.method || 'GET'} ${endpoint} → ${res.status}:`, text)
    throw new Error(`Panda API error: ${res.status}`)
  }

  return res.json()
}

/**
 * Lista stream keys disponíveis na conta.
 * Silver = 1 key, Gold = 2 keys.
 */
export async function getStreamKeys(): Promise<PandaStreamKey[]> {
  return pandaFetch<PandaStreamKey[]>('/live_stream_key/')
}

/**
 * Busca a primeira stream key disponível (não vinculada a outra live ativa).
 */
export async function getAvailableStreamKey(): Promise<PandaStreamKey | null> {
  const keys = await getStreamKeys()
  return keys.find(k => !k.is_attached) || null
}

/**
 * Cria uma live no Panda Video.
 * Retorna RTMP URL + stream key para configurar no OBS.
 */
export async function createPandaLive(params: {
  title: string
  scheduled_at?: string
  active_dvr?: boolean
  bitrate?: string[]
  folder_id?: string
}): Promise<PandaLive> {
  const streamKey = await getAvailableStreamKey()
  if (!streamKey) {
    throw new Error('Nenhuma stream key disponível. Finalize a live ativa antes de criar outra.')
  }

  return pandaFetch<PandaLive>('/lives/', {
    method: 'POST',
    body: JSON.stringify({
      title: params.title,
      stream_key_id: streamKey.id,
      scheduled_at: params.scheduled_at || undefined,
      active_dvr: params.active_dvr ?? false,
      bitrate: params.bitrate || [],
      folder_id: params.folder_id || undefined,
    }),
  })
}

/**
 * Busca detalhes de uma live no Panda.
 */
export async function getPandaLive(liveId: string): Promise<PandaLive> {
  return pandaFetch<PandaLive>(`/lives/${liveId}`)
}

/**
 * Lista todas as lives da conta Panda.
 */
export async function listPandaLives(): Promise<PandaLive[]> {
  return pandaFetch<PandaLive[]>('/lives/')
}

/**
 * Finaliza a live no Panda e inicia conversão para VOD.
 */
export async function finishPandaLive(liveId: string): Promise<void> {
  await pandaFetch<{ status: boolean }>(`/lives/${liveId}/finish`, {
    method: 'POST',
  })
}

/**
 * Atualiza propriedades da live no Panda.
 */
export async function updatePandaLive(
  liveId: string,
  updates: { title?: string; scheduled_at?: string; active_dvr?: boolean; folder_id?: string }
): Promise<PandaLive> {
  return pandaFetch<PandaLive>(`/lives/${liveId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

/**
 * Deleta uma live no Panda.
 */
export async function deletePandaLive(liveId: string): Promise<void> {
  await pandaFetch<void>(`/lives/${liveId}`, { method: 'DELETE' })
}

/**
 * Busca viewers de uma live ativa.
 */
export async function getPandaLiveViewers(liveId: string): Promise<{ viewers: number }> {
  return pandaFetch<{ viewers: number }>(
    `/analytics/live/${liveId}/viewers`
  )
}
