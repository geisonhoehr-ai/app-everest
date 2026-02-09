import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

interface EssayCorrectionRequest {
  essay: string
  theme: string
  criteria: 'ENEM' | 'VESTIBULAR'
}

export interface EssayCorrectionResponse {
  score: number
  feedback: string
  criteriaScores: {
    c1: number
    c2: number
    c3: number
    c4: number
    c5: number
  }
  suggestions: string[]
  correctionId?: string
}

interface ChatRequest {
  message: string
  context?: string
  history?: { role: 'user' | 'assistant'; content: string }[]
}

interface ChatResponse {
  answer: string
  suggestions?: string[]
}

interface PerformanceAnalysisRequest {
  studentId: string
  period: 'week' | 'month' | 'all'
}

interface PerformanceAnalysisResponse {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

class DifyService {
  /**
   * Verificar se o serviço está configurado (Gerenciado pelo backend via secrets)
   */
  isConfigured(): boolean {
    return true
  }

  /**
   * Auxiliar para invocar o proxy do Dify
   */
  private async invokeProxy(action: string, payload: any) {
    const { data, error } = await supabase.functions.invoke('dify-proxy', {
      body: { action, payload }
    })
    if (error) throw error
    return data
  }

  /**
   * Corrigir redação usando IA via Proxy
   */
  async correctEssay(request: EssayCorrectionRequest): Promise<EssayCorrectionResponse> {
    try {
      const data = await this.invokeProxy('workflow', {
        inputs: {
          redacao: request.essay,
          tema: request.theme,
          criterios: request.criteria,
          tipo_correcao: 'completa'
        }
      })

      // O Dify Workflow retorna o output dentro de data.outputs
      const outputs = data.outputs || {}

      return {
        score: Number(outputs.nota_final || 0),
        feedback: outputs.feedback_geral || 'Processando correção...',
        criteriaScores: {
          c1: Number(outputs.nota_c1 || 0),
          c2: Number(outputs.nota_c2 || 0),
          c3: Number(outputs.nota_c3 || 0),
          c4: Number(outputs.nota_c4 || 0),
          c5: Number(outputs.nota_c5 || 0)
        },
        suggestions: Array.isArray(outputs.sugestoes) ? outputs.sugestoes : [],
        correctionId: data.workflow_run_id
      }
    } catch (error) {
      logger.error('Erro ao corrigir redação:', error)
      throw new Error('Falha na correção da redação via Proxy')
    }
  }

  /**
   * Chat interativo via Proxy
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const data = await this.invokeProxy('chat', {
        query: request.message,
        user: 'everest_student',
        conversation_id: request.context,
        inputs: {}
      })

      return {
        answer: data.answer || 'Desculpe, não consegui processar sua dúvida agora.',
        suggestions: data.metadata?.suggestions || []
      }
    } catch (error) {
      logger.error('Erro no chat:', error)
      throw new Error('Falha na comunicação com o assistente via Proxy')
    }
  }

  /**
   * Gerar questões automáticas via Proxy
   */
  async generateQuestions(topic: string, count: number = 5): Promise<any[]> {
    try {
      const data = await this.invokeProxy('workflow', {
        inputs: {
          tema: topic,
          quantidade: count,
          nivel: 'médio'
        }
      })

      return data.outputs?.questoes || []
    } catch (error) {
      logger.error('Erro ao gerar questões:', error)
      throw new Error('Falha na geração de questões via Proxy')
    }
  }

  /**
   * Analisar desempenho do aluno via Proxy
   */
  async analyzePerformance(request: PerformanceAnalysisRequest): Promise<PerformanceAnalysisResponse> {
    try {
      const data = await this.invokeProxy('stats', {
        student_id: request.studentId,
        period: request.period
      })

      return {
        strengths: data.outputs?.pontos_fortes || [],
        weaknesses: data.outputs?.pontos_fracos || [],
        recommendations: data.outputs?.recomendacoes || []
      }
    } catch (error) {
      logger.error('Erro ao analisar desempenho:', error)
      throw new Error('Falha na análise de desempenho via Proxy')
    }
  }
}

// Singleton instance
export const difyService = new DifyService()
