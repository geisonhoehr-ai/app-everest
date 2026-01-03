/**
 * Serviço de correção de redações com integração Dify
 * Combina correção manual e automática
 */

import { difyService } from './difyService'
import { supabase } from '@/lib/supabase/client'

interface EssayCorrectionRequest {
  essayId: string
  essay: string
  theme: string
  criteria: 'ENEM' | 'VESTIBULAR'
  userId: string
}

interface EssayCorrectionResult {
  essayId: string
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
  correctedBy: 'AI' | 'MANUAL' | 'HYBRID'
  correctedAt: Date
  aiConfidence?: number
}

class EssayCorrectionService {
  /**
   * Corrigir redação usando IA (Dify)
   */
  async correctWithAI(request: EssayCorrectionRequest): Promise<EssayCorrectionResult> {
    try {
      // Verificar se Dify está configurado
      if (!difyService.isConfigured()) {
        throw new Error('Serviço de IA não configurado')
      }

      // Corrigir com Dify
      const aiResult = await difyService.correctEssay({
        essay: request.essay,
        theme: request.theme,
        criteria: request.criteria
      })

      // Salvar resultado no banco
      const { data, error } = await supabase
        .from('essay_corrections')
        .insert({
          essay_id: request.essayId,
          user_id: request.userId,
          total_score: aiResult.totalScore,
          competencies: aiResult.competencies,
          suggestions: aiResult.suggestions,
          strengths: aiResult.strengths,
          improvements: aiResult.improvements,
          corrected_by: 'AI',
          corrected_at: new Date().toISOString(),
          ai_confidence: this.calculateConfidence(aiResult)
        })
        .select()
        .single()

      if (error) throw error

      // Also update the main essays table for frontend compatibility
      await supabase.from('essays').update({
        ai_analysis: {
          competencies: aiResult.competencies,
          suggestions: aiResult.suggestions,
          strengths: aiResult.strengths,
          improvements: aiResult.improvements
        },
        ai_suggested_grade: {
          total: aiResult.totalScore,
          breakdown: aiResult.competencies
        }
      }).eq('id', request.essayId)

      return {
        essayId: request.essayId,
        totalScore: aiResult.totalScore,
        competencies: aiResult.competencies,
        suggestions: aiResult.suggestions,
        strengths: aiResult.strengths,
        improvements: aiResult.improvements,
        correctedBy: 'AI',
        correctedAt: new Date(),
        aiConfidence: this.calculateConfidence(aiResult)
      }
    } catch (error) {
      console.error('Erro na correção por IA:', error)
      throw new Error('Falha na correção automática')
    }
  }

  /**
   * Corrigir redação manualmente
   */
  async correctManually(
    essayId: string,
    corrections: Partial<EssayCorrectionResult>,
    teacherId: string
  ): Promise<EssayCorrectionResult> {
    try {
      const { data, error } = await supabase
        .from('essay_corrections')
        .insert({
          essay_id: essayId,
          teacher_id: teacherId,
          total_score: corrections.totalScore || 0,
          competencies: corrections.competencies,
          suggestions: corrections.suggestions || [],
          strengths: corrections.strengths || [],
          improvements: corrections.improvements || [],
          corrected_by: 'MANUAL',
          corrected_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        essayId,
        totalScore: corrections.totalScore || 0,
        competencies: corrections.competencies || {} as any,
        suggestions: corrections.suggestions || [],
        strengths: corrections.strengths || [],
        improvements: corrections.improvements || [],
        correctedBy: 'MANUAL',
        correctedAt: new Date()
      }
    } catch (error) {
      console.error('Erro na correção manual:', error)
      throw new Error('Falha na correção manual')
    }
  }

  /**
   * Correção híbrida (IA + revisão manual)
   */
  async correctHybrid(
    request: EssayCorrectionRequest,
    teacherId: string,
    manualAdjustments?: Partial<EssayCorrectionResult>
  ): Promise<EssayCorrectionResult> {
    try {
      // Primeiro, correção por IA
      const aiResult = await this.correctWithAI(request)

      // Aplicar ajustes manuais se fornecidos
      const finalResult = {
        ...aiResult,
        totalScore: manualAdjustments?.totalScore || aiResult.totalScore,
        competencies: manualAdjustments?.competencies || aiResult.competencies,
        suggestions: [...aiResult.suggestions, ...(manualAdjustments?.suggestions || [])],
        strengths: [...aiResult.strengths, ...(manualAdjustments?.strengths || [])],
        improvements: [...aiResult.improvements, ...(manualAdjustments?.improvements || [])],
        correctedBy: 'HYBRID' as const,
        correctedAt: new Date()
      }

      // Salvar resultado final
      const { error } = await supabase
        .from('essay_corrections')
        .update({
          total_score: finalResult.totalScore,
          competencies: finalResult.competencies,
          suggestions: finalResult.suggestions,
          strengths: finalResult.strengths,
          improvements: finalResult.improvements,
          corrected_by: 'HYBRID',
          teacher_id: teacherId,
          corrected_at: new Date().toISOString()
        })
        .eq('essay_id', request.essayId)

      if (error) throw error

      return finalResult
    } catch (error) {
      console.error('Erro na correção híbrida:', error)
      throw new Error('Falha na correção híbrida')
    }
  }

  /**
   * Obter correção de redação
   */
  async getCorrection(essayId: string): Promise<EssayCorrectionResult | null> {
    try {
      const { data, error } = await supabase
        .from('essay_corrections')
        .select('*')
        .eq('essay_id', essayId)
        .order('corrected_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Não encontrado
        }
        throw error
      }

      return {
        essayId: data.essay_id,
        totalScore: data.total_score,
        competencies: data.competencies,
        suggestions: data.suggestions,
        strengths: data.strengths,
        improvements: data.improvements,
        correctedBy: data.corrected_by,
        correctedAt: new Date(data.corrected_at),
        aiConfidence: data.ai_confidence
      }
    } catch (error) {
      console.error('Erro ao obter correção:', error)
      throw new Error('Falha ao obter correção')
    }
  }

  /**
   * Listar correções de um usuário
   */
  async getUserCorrections(userId: string, limit: number = 10): Promise<EssayCorrectionResult[]> {
    try {
      const { data, error } = await supabase
        .from('essay_corrections')
        .select('*')
        .eq('user_id', userId)
        .order('corrected_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map(item => ({
        essayId: item.essay_id,
        totalScore: item.total_score,
        competencies: item.competencies,
        suggestions: item.suggestions,
        strengths: item.strengths,
        improvements: item.improvements,
        correctedBy: item.corrected_by,
        correctedAt: new Date(item.corrected_at),
        aiConfidence: item.ai_confidence
      }))
    } catch (error) {
      console.error('Erro ao listar correções:', error)
      throw new Error('Falha ao listar correções')
    }
  }

  /**
   * Calcular confiança da IA baseada na consistência dos scores
   */
  private calculateConfidence(result: any): number {
    const scores = Object.values(result.competencies).map((comp: any) => comp.score)
    const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    const variance = scores.reduce((acc: number, score: number) => acc + Math.pow(score - avg, 2), 0) / scores.length
    const stdDev = Math.sqrt(variance)

    // Confiança baseada na baixa variância (scores consistentes)
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev * 2)))
    return Math.round(confidence)
  }

  /**
   * Obter estatísticas de correção
   */
  async getCorrectionStats(): Promise<{
    total: number
    ai: number
    manual: number
    hybrid: number
    averageScore: number
    averageConfidence: number
  }> {
    try {
      const { data, error } = await supabase
        .from('essay_corrections')
        .select('corrected_by, total_score, ai_confidence')

      if (error) throw error

      const stats = {
        total: data.length,
        ai: data.filter(item => item.corrected_by === 'AI').length,
        manual: data.filter(item => item.corrected_by === 'MANUAL').length,
        hybrid: data.filter(item => item.corrected_by === 'HYBRID').length,
        averageScore: 0,
        averageConfidence: 0
      }

      if (data.length > 0) {
        stats.averageScore = data.reduce((acc, item) => acc + item.total_score, 0) / data.length
        const aiCorrections = data.filter(item => item.ai_confidence !== null)
        if (aiCorrections.length > 0) {
          stats.averageConfidence = aiCorrections.reduce((acc, item) => acc + item.ai_confidence, 0) / aiCorrections.length
        }
      }

      return stats
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw new Error('Falha ao obter estatísticas')
    }
  }
}

// Singleton instance
export const essayCorrectionService = new EssayCorrectionService()
