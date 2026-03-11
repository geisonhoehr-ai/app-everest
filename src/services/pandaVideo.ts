/**
 * ========================================
 * SERVIÇO DE INTEGRAÇÃO COM PANDAVIDEO
 * ========================================
 *
 * API Docs: https://pandavideo.readme.io/reference/list-videos
 *
 * - Localhost: Vite proxy (/panda-api) → api-v2.pandavideo.com.br
 * - Produção: Supabase Edge Function (panda-proxy) para evitar CORS
 */

import { supabase } from '@/lib/supabase/client'

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

export interface PandaVideo {
  id: string
  title: string
  description?: string
  thumbnail: string
  duration: number // em segundos
  created_at: string
  folder_id?: string
  embed_url?: string
  hls_url?: string
}

export interface PandaFolder {
  id: string
  name: string
  parent_id?: string
}

export interface PandaVideosResponse {
  videos: PandaVideo[]
  total: number
  page: number
}

/**
 * Map raw Panda API video object to our PandaVideo interface
 */
function mapPandaVideo(raw: any): PandaVideo {
  return {
    id: raw.id,
    title: raw.title || '',
    description: raw.description || '',
    thumbnail: raw.thumbnail || raw.preview || '',
    duration: Math.round(raw.length || raw.duration || 0),
    created_at: raw.created_at || '',
    folder_id: raw.folder_id,
    embed_url: raw.video_player,
    hls_url: raw.video_hls,
  }
}

/**
 * Cliente HTTP para PandaVideo
 * - Localhost: chamada direta via Vite proxy (header injetado pelo proxy)
 * - Produção: chamada via Supabase Edge Function panda-proxy
 */
async function pandaRequest(endpoint: string, method = 'GET', body?: any) {
  if (isLocalhost) {
    const url = `/panda-api${endpoint}`
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      throw new Error(error.errMsg || error.message || `Erro ${response.status}`)
    }
    return response.json()
  }

  // Produção: usa Edge Function com auth do usuário
  const { data, error } = await supabase.functions.invoke('panda-proxy', {
    body: { endpoint, method, body },
  })
  if (error) throw new Error(error.message || 'Erro ao chamar panda-proxy')
  return data
}

/**
 * Lista todos os vídeos
 */
export async function getPandaVideos(params?: {
  search?: string
  folder_id?: string
  page?: number
}): Promise<PandaVideosResponse> {
  const queryParams = new URLSearchParams()

  if (params?.search) queryParams.append('title', params.search)
  if (params?.folder_id) queryParams.append('folder_id', params.folder_id)
  if (params?.page) queryParams.append('page', params.page.toString())

  const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
  const response = await pandaRequest(`/videos${query}`)

  const rawVideos = response.videos || response.data || []

  return {
    videos: rawVideos.map(mapPandaVideo),
    total: response.total || rawVideos.length,
    page: response.page || 1,
  }
}

/**
 * Busca vídeos por termo
 */
export async function searchPandaVideos(searchTerm: string): Promise<PandaVideo[]> {
  if (!searchTerm) {
    const response = await getPandaVideos()
    return response.videos
  }

  const response = await getPandaVideos({ search: searchTerm })
  return response.videos
}

/**
 * Obtém detalhes de um vídeo específico
 */
export async function getPandaVideoById(videoId: string): Promise<PandaVideo> {
  const raw = await pandaRequest(`/videos/${videoId}`)
  return mapPandaVideo(raw)
}

/**
 * Obtém URL de embed do vídeo
 */
export function getPandaVideoEmbedUrl(videoId: string): string {
  return `https://player-vz-e9d62059-4a4.tv.pandavideo.com.br/embed/?v=${videoId}`
}

/**
 * Obtém URL HLS do vídeo
 */
export function getPandaVideoHlsUrl(videoId: string): string {
  return `https://b-vz-e9d62059-4a4.tv.pandavideo.com.br/${videoId}/playlist.m3u8`
}

/**
 * Lista pastas (folders)
 */
export async function getPandaFolders(): Promise<PandaFolder[]> {
  const response = await pandaRequest('/folders')
  return response.folders || response.data || []
}

/**
 * Testa conexão com a API do PandaVideo
 */
export async function testPandaConnection(): Promise<{
  success: boolean
  message: string
  videosCount?: number
}> {
  try {
    const response = await getPandaVideos()
    return {
      success: true,
      message: 'Conexão estabelecida com sucesso!',
      videosCount: response.total,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Erro ao conectar com PandaVideo',
    }
  }
}

/**
 * Formata duração em segundos para formato legível
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }
  return `${minutes}min ${secs}s`
}
