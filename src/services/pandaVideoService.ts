/**
 * Serviço de integração com Panda Video
 * Para streaming de vídeos e aulas ao vivo
 */

interface PandaVideoConfig {
  apiKey: string
  baseUrl: string
  playerId: string
}

interface VideoUploadRequest {
  title: string
  description?: string
  file: File
  category?: string
  isPublic?: boolean
}

interface VideoUploadResponse {
  videoId: string
  uploadUrl: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
}

interface LiveStreamRequest {
  title: string
  description?: string
  scheduledAt?: Date
  isPublic?: boolean
}

interface LiveStreamResponse {
  streamId: string
  streamKey: string
  rtmpUrl: string
  playbackUrl: string
  status: 'scheduled' | 'live' | 'ended'
}

interface VideoAnalytics {
  videoId: string
  views: number
  watchTime: number
  completionRate: number
  engagement: number
}

class PandaVideoService {
  private config: PandaVideoConfig | null = null

  /**
   * Configurar o serviço Panda Video
   */
  configure(config: PandaVideoConfig): void {
    this.config = config
  }

  /**
   * Verificar se o serviço está configurado
   */
  isConfigured(): boolean {
    return this.config !== null && this.config.apiKey.length > 0
  }

  /**
   * Testar conexão com Panda Video
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Serviço não configurado' }
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        return { success: true, message: 'Conexão estabelecida com sucesso' }
      } else {
        return { success: false, message: 'Erro na autenticação' }
      }
    } catch (error) {
      return { success: false, message: 'Erro de conexão: ' + error }
    }
  }

  /**
   * Upload de vídeo
   */
  async uploadVideo(request: VideoUploadRequest): Promise<VideoUploadResponse> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Panda Video não configurado')
    }

    try {
      // Criar vídeo
      const createResponse = await fetch(`${this.config!.baseUrl}/v1/videos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: request.title,
          description: request.description,
          category: request.category,
          public: request.isPublic
        })
      })

      if (!createResponse.ok) {
        throw new Error(`Erro ao criar vídeo: ${createResponse.status}`)
      }

      const videoData = await createResponse.json()

      // Upload do arquivo
      const formData = new FormData()
      formData.append('file', request.file)

      const uploadResponse = await fetch(`${this.config!.baseUrl}/v1/videos/${videoData.id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error(`Erro no upload: ${uploadResponse.status}`)
      }

      return {
        videoId: videoData.id,
        uploadUrl: videoData.upload_url,
        status: 'uploading'
      }
    } catch (error) {
      console.error('Erro no upload do vídeo:', error)
      throw new Error('Falha no upload do vídeo')
    }
  }

  /**
   * Criar transmissão ao vivo
   */
  async createLiveStream(request: LiveStreamRequest): Promise<LiveStreamResponse> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Panda Video não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/live-streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: request.title,
          description: request.description,
          scheduled_at: request.scheduledAt?.toISOString(),
          public: request.isPublic
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ao criar stream: ${response.status}`)
      }

      const data = await response.json()
      return {
        streamId: data.id,
        streamKey: data.stream_key,
        rtmpUrl: data.rtmp_url,
        playbackUrl: data.playback_url,
        status: 'scheduled'
      }
    } catch (error) {
      console.error('Erro ao criar stream:', error)
      throw new Error('Falha ao criar transmissão ao vivo')
    }
  }

  /**
   * Obter informações do vídeo
   */
  async getVideoInfo(videoId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Panda Video não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/videos/${videoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao obter vídeo: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao obter vídeo:', error)
      throw new Error('Falha ao obter informações do vídeo')
    }
  }

  /**
   * Obter analytics do vídeo
   */
  async getVideoAnalytics(videoId: string): Promise<VideoAnalytics> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Panda Video não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/videos/${videoId}/analytics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao obter analytics: ${response.status}`)
      }

      const data = await response.json()
      return {
        videoId: videoId,
        views: data.views || 0,
        watchTime: data.watch_time || 0,
        completionRate: data.completion_rate || 0,
        engagement: data.engagement || 0
      }
    } catch (error) {
      console.error('Erro ao obter analytics:', error)
      throw new Error('Falha ao obter analytics do vídeo')
    }
  }

  /**
   * Listar vídeos
   */
  async listVideos(page: number = 1, limit: number = 20): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Panda Video não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/videos?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao listar vídeos: ${response.status}`)
      }

      const data = await response.json()
      return data.videos || []
    } catch (error) {
      console.error('Erro ao listar vídeos:', error)
      throw new Error('Falha ao listar vídeos')
    }
  }

  /**
   * Deletar vídeo
   */
  async deleteVideo(videoId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Panda Video não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao deletar vídeo: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro ao deletar vídeo:', error)
      throw new Error('Falha ao deletar vídeo')
    }
  }

  /**
   * Obter player embed
   */
  getPlayerEmbed(videoId: string): string {
    if (!this.isConfigured()) {
      throw new Error('Serviço Panda Video não configurado')
    }

    return `
      <div id="panda-video-player-${videoId}"></div>
      <script src="${this.config!.baseUrl}/player/${this.config!.playerId}.js"></script>
      <script>
        PandaPlayer.init({
          container: '#panda-video-player-${videoId}',
          videoId: '${videoId}',
          autoplay: false,
          controls: true
        });
      </script>
    `
  }

  /**
   * Obter estatísticas de uso
   */
  async getUsageStats(): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Panda Video não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/account/usage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw new Error('Falha ao obter estatísticas')
    }
  }
}

// Singleton instance
export const pandaVideoService = new PandaVideoService()
