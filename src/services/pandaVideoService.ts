/**
 * Serviço de integração com Panda Video via Supabase Edge Function Proxy
 * Para streaming de vídeos e aulas ao vivo sem expor chaves de API no cliente
 */
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

interface VideoUpload {
  id: string
  title: string
  status: 'processing' | 'ready' | 'error'
  previewUrl: string
  duration: number
}

interface LiveStream {
  id: string
  title: string
  status: 'idle' | 'live' | 'finished'
  streamUrl: string
  playbackUrl: string
}

class PandaVideoService {
  /**
   * Verificar se o serviço está configurado (Gerenciado pelo backend)
   */
  isConfigured(): boolean {
    return true
  }

  /**
   * Auxiliar para invocar o proxy do Panda Video
   */
  private async invokeProxy(endpoint: string, method: string = 'GET', body?: any) {
    const { data, error } = await supabase.functions.invoke('panda-proxy', {
      body: { endpoint, method, body }
    })
    if (error) throw error
    return data
  }

  /**
   * Fazer upload de vídeo via Proxy
   */
  async uploadVideo(file: File, title: string): Promise<VideoUpload> {
    try {
      // Nota: Upload de arquivos grandes via Edge Function pode ter limitações
      // Idealmente o proxy retorna uma URL pré-assinada ou processa o multipart
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)

      // Por enquanto, simulando a chamada JSON se o proxy suportar URL de upload
      const data = await this.invokeProxy('/videos', 'POST', { title })
      return data
    } catch (error) {
      logger.error('Erro no upload Panda Video:', error)
      throw new Error('Falha no upload do vídeo via Proxy')
    }
  }

  /**
   * Criar live stream via Proxy
   */
  async createLiveStream(title: string): Promise<LiveStream> {
    try {
      const data = await this.invokeProxy('/lives', 'POST', { title })
      return data
    } catch (error) {
      logger.error('Erro ao criar live:', error)
      throw new Error('Falha ao criar live via Proxy')
    }
  }

  /**
   * Obter informações de um vídeo via Proxy
   */
  async getVideoInfo(videoId: string): Promise<VideoUpload> {
    try {
      return await this.invokeProxy(`/videos/${videoId}`)
    } catch (error) {
      logger.error('Erro ao obter info do vídeo:', error)
      throw new Error('Falha ao obter dados do vídeo via Proxy')
    }
  }

  /**
   * Obter estatísticas de um vídeo via Proxy
   */
  async getVideoAnalytics(videoId: string): Promise<any> {
    try {
      return await this.invokeProxy(`/videos/${videoId}/analytics`)
    } catch (error) {
      logger.error('Erro nas estatísticas:', error)
      throw new Error('Falha ao obter analytics via Proxy')
    }
  }

  /**
   * Listar vídeos via Proxy
   */
  async listVideos(page: number = 1): Promise<VideoUpload[]> {
    try {
      const data = await this.invokeProxy(`/videos?page=${page}`)
      return data.videos || []
    } catch (error) {
      logger.error('Erro ao listar vídeos:', error)
      throw new Error('Falha ao listar vídeos via Proxy')
    }
  }

  /**
   * Deletar vídeo via Proxy
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      await this.invokeProxy(`/videos/${videoId}`, 'DELETE')
    } catch (error) {
      logger.error('Erro ao deletar vídeo:', error)
      throw new Error('Falha ao deletar vídeo via Proxy')
    }
  }

  /**
   * Obter código de incorporação do player
   */
  getEmbedCode(videoId: string): string {
    // Código do player geralmente é estático + ID
    return `<iframe src="https://player.pandavideo.com.br/embed/?v=${videoId}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`
  }
}

// Singleton instance
export const pandaVideoService = new PandaVideoService()
