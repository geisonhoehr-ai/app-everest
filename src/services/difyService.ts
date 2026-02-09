import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

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
  /**
   * Verificar se o serviço está disponível (via Edge Function)
   */
  isConfigured(): boolean {
    return true // Agora é gerenciado pelo backend
  }

  /**
   * Testar conexão com Dify via Proxy
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('dify-proxy', {
        body: { action: 'stats' }
      })

      if (error) throw error

      return { success: true, message: 'Conexão estabelecida com sucesso via Edge Function' }
    } catch (error) {
      logger.error('Erro de conexão Dify:', error)
      return { success: false, message: 'Erro de conexão: ' + error }
    }
  }

  /**
   * Corrigir redação usando IA via Edge Function
   */
  async correctEssay(request: EssayCorrectionRequest): Promise<EssayCorrectionResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('dify-proxy', {
        body: {
          action: 'workflow',
          payload: {
            inputs: {
              redacao: request.essay,
              tema: request.theme,
              criterios: request.criteria,
              tipo_correcao: 'completa'
            }
          }
        }
      })

      if (error) throw error

      return this.parseEssayCorrection(data)
    } catch (error) {
      logger.error('Erro ao corrigir redação:', error)
      throw new Error('Falha na correção da redação')
    }
  }

  /**
   * Chat com assistente inteligente via Edge Function
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('dify-proxy', {
        body: {
          action: 'chat',
          payload: {
            inputs: {
              message: request.message,
              context: request.context || '',
              user_id: request.userId
            },
            query: request.message,
            response_mode: 'blocking',
            user: request.userId
          }
        }
      })

      if (error) throw error

      return {
        response: data.answer,
        sources: data.metadata?.sources || [],
        suggestions: data.suggestions || []
      }
    } catch (error) {
      logger.error('Erro no chat:', error)
      throw new Error('Falha na comunicação com o assistente')
    }
  }

  /**
   * Gerar questões baseadas em conteúdo via Edge Function
   */
  async generateQuestions(content: string, subject: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('dify-proxy', {
        body: {
          action: 'workflow',
          payload: {
            inputs: {
              conteudo: content,
              materia: subject,
              dificuldade: difficulty,
              quantidade: 5
            }
          }
        }
      })

      if (error) throw error
      return data.questions || []
    } catch (error) {
      logger.error('Erro ao gerar questões:', error)
      throw new Error('Falha na geração de questões')
    }
  }

  /**
   * Analisar performance do aluno via Edge Function
   */
  async analyzePerformance(userId: string, subject: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('dify-proxy', {
        body: {
          action: 'workflow',
          payload: {
            inputs: {
              user_id: userId,
              materia: subject,
              tipo_analise: 'performance'
            }
          }
        }
      })

      if (error) throw error
      return data.analysis || {}
    } catch (error) {
      logger.error('Erro na análise:', error)
      throw new Error('Falha na análise de performance')
    }
  }

  /**
   * Parsear resposta de correção de redação
   */
  private parseEssayCorrection(data: any): EssayCorrectionResponse {
    // Se vier do workflow do Dify, os dados podem estar dentro de 'data' ou 'outputs'
    const result = data.data || data.outputs || data;

    return {
      totalScore: result.total_score || 0,
      competencies: {
        structure: {
          score: result.competencies?.structure?.score || 0,
          feedback: result.competencies?.structure?.feedback || ''
        },
        language: {
          score: result.competencies?.language?.score || 0,
          feedback: result.competencies?.language?.feedback || ''
        },
        theme: {
          score: result.competencies?.theme?.score || 0,
          feedback: result.competencies?.theme?.feedback || ''
        },
        argumentation: {
          score: result.competencies?.argumentation?.score || 0,
          feedback: result.competencies?.argumentation?.feedback || ''
        },
        intervention: {
          score: result.competencies?.intervention?.score || 0,
          feedback: result.competencies?.intervention?.feedback || ''
        }
      },
      suggestions: result.suggestions || [],
      strengths: result.strengths || [],
      improvements: result.improvements || []
    }
  }

  /**
   * Obter estatísticas de uso via Edge Function
   */
  async getUsageStats(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('dify-proxy', {
        body: { action: 'stats' }
      })

      if (error) throw error
      return data
    } catch (error) {
      logger.error('Erro ao obter estatísticas:', error)
      throw new Error('Falha ao obter estatísticas')
    }
  }
}

// Singleton instance
export const difyService = new DifyService()

