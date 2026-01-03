/**
 * Serviço de integração com Dify AI
 * Para correção automática de redações e assistente inteligente
 */

interface DifyConfig {
  apiKey: string
  baseUrl: string
  workflowId: string
}

interface EssayCorrectionRequest {
  essay: string
  theme: string
  criteria: 'ENEM' | 'VESTIBULAR'
}

interface EssayCorrectionResponse {
  totalScore: number
  competencies: {
    structure: { score: number; feedback: string }
    language: { score: number; feedback: string }
    theme: { score: number; feedback: string }
    argumentation: { score: number; feedback: string }
    intervention: { score: number; feedback: string }
  }
  suggestions: string[]
  strengths: string[]
  improvements: string[]
}

interface ChatRequest {
  message: string
  context?: string
  userId: string
}

interface ChatResponse {
  response: string
  sources?: string[]
  suggestions?: string[]
}

class DifyService {
  private config: DifyConfig | null = null

  /**
   * Configurar o serviço Dify
   */
  configure(config: DifyConfig): void {
    this.config = config
  }

  /**
   * Verificar se o serviço está configurado
   */
  isConfigured(): boolean {
    return this.config !== null && this.config.apiKey.length > 0
  }

  /**
   * Testar conexão com Dify
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Serviço não configurado' }
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/workflows/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            test: 'connection_test'
          }
        })
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
   * Corrigir redação usando IA
   */
  async correctEssay(request: EssayCorrectionRequest): Promise<EssayCorrectionResponse> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Dify não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/workflows/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            redacao: request.essay,
            tema: request.theme,
            criterios: request.criteria,
            tipo_correcao: 'completa'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      return this.parseEssayCorrection(data)
    } catch (error) {
      console.error('Erro ao corrigir redação:', error)
      throw new Error('Falha na correção da redação')
    }
  }

  /**
   * Chat com assistente inteligente
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Dify não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            message: request.message,
            context: request.context || '',
            user_id: request.userId
          },
          query: request.message,
          response_mode: 'blocking',
          user: request.userId
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      return {
        response: data.answer,
        sources: data.metadata?.sources || [],
        suggestions: data.suggestions || []
      }
    } catch (error) {
      console.error('Erro no chat:', error)
      throw new Error('Falha na comunicação com o assistente')
    }
  }

  /**
   * Gerar questões baseadas em conteúdo
   */
  async generateQuestions(content: string, subject: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Dify não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/workflows/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            conteudo: content,
            materia: subject,
            dificuldade: difficulty,
            quantidade: 5
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      return data.questions || []
    } catch (error) {
      console.error('Erro ao gerar questões:', error)
      throw new Error('Falha na geração de questões')
    }
  }

  /**
   * Analisar performance do aluno
   */
  async analyzePerformance(userId: string, subject: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Dify não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/workflows/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            user_id: userId,
            materia: subject,
            tipo_analise: 'performance'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      return data.analysis || {}
    } catch (error) {
      console.error('Erro na análise:', error)
      throw new Error('Falha na análise de performance')
    }
  }

  /**
   * Parsear resposta de correção de redação
   */
  private parseEssayCorrection(data: any): EssayCorrectionResponse {
    // Parsear resposta do Dify para formato padronizado
    return {
      totalScore: data.total_score || 0,
      competencies: {
        structure: {
          score: data.competencies?.structure?.score || 0,
          feedback: data.competencies?.structure?.feedback || ''
        },
        language: {
          score: data.competencies?.language?.score || 0,
          feedback: data.competencies?.language?.feedback || ''
        },
        theme: {
          score: data.competencies?.theme?.score || 0,
          feedback: data.competencies?.theme?.feedback || ''
        },
        argumentation: {
          score: data.competencies?.argumentation?.score || 0,
          feedback: data.competencies?.argumentation?.feedback || ''
        },
        intervention: {
          score: data.competencies?.intervention?.score || 0,
          feedback: data.competencies?.intervention?.feedback || ''
        }
      },
      suggestions: data.suggestions || [],
      strengths: data.strengths || [],
      improvements: data.improvements || []
    }
  }

  /**
   * Obter estatísticas de uso
   */
  async getUsageStats(): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Dify não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/v1/statistics`, {
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
export const difyService = new DifyService()
