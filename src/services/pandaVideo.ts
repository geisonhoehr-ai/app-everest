/**
 * ========================================
 * SERVIÇO DE INTEGRAÇÃO COM PANDAVIDEO
 * ========================================
 *
 * API Docs: https://pandavideo.readme.io/reference/list-videos
 * API Key: panda-7815cbc9c501c0169d429ade132363867425dfb01a258da9a6a894ea8898908e
 *
 * Funcionalidades:
 * - ✅ Listar vídeos
 * - ✅ Buscar vídeos
 * - ✅ Obter detalhes de vídeo
 * - ✅ Obter embed URL
 */

const PANDA_API_URL = 'https://api-v2.pandavideo.com.br'
const PANDA_API_KEY = 'panda-7815cbc9c501c0169d429ade132363867425dfb01a258da9a6a894ea8898908e'

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
  per_page: number
}

/**
 * Cliente HTTP para PandaVideo
 */
async function pandaRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${PANDA_API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': PANDA_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(error.message || `Erro ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Lista todos os vídeos
 */
export async function getPandaVideos(params?: {
  search?: string
  folder_id?: string
  page?: number
  per_page?: number
}): Promise<PandaVideosResponse> {
  const queryParams = new URLSearchParams()

  if (params?.search) queryParams.append('search', params.search)
  if (params?.folder_id) queryParams.append('folder_id', params.folder_id)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString())

  const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
  const response = await pandaRequest(`/videos${query}`)

  return {
    videos: response.data || [],
    total: response.total || 0,
    page: response.page || 1,
    per_page: response.per_page || 20,
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
  return pandaRequest(`/videos/${videoId}`)
}

/**
 * Obtém URL de embed do vídeo
 */
export function getPandaVideoEmbedUrl(videoId: string): string {
  return `https://player-vz-d0b3ae60-2ea.tv.pandavideo.com.br/embed/?v=${videoId}`
}

/**
 * Obtém URL HLS do vídeo
 */
export function getPandaVideoHlsUrl(videoId: string): string {
  return `https://b-vz-d0b3ae60-2ea.tv.pandavideo.com.br/${videoId}/playlist.m3u8`
}

/**
 * Lista pastas (folders)
 */
export async function getPandaFolders(): Promise<PandaFolder[]> {
  const response = await pandaRequest('/folders')
  return response.data || []
}

/**
 * Testa conexão com a API do PandaVideo
 */
export async function testPandaConnection(): Promise<{
  success: boolean
  message: string
  videosCount?: number
}> {
  // Modo desenvolvimento - simular resposta se estiver em localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 Modo desenvolvimento: Simulando conexão Panda Video')
    return {
      success: true,
      message: 'Conexão simulada (modo desenvolvimento)',
      videosCount: 15, // Simular 15 vídeos
    }
  }

  try {
    const response = await getPandaVideos({ per_page: 1 })
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
