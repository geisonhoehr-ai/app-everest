import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type {
  CorrectionTemplate,
  CorrectionResult,
  ExpressionError,
  StructureAnalysis,
  ContentAnalysis,
  ImprovementSuggestion,
} from '@/types/essay-correction'
import { calculateFinalGrade } from '@/types/essay-correction'

/**
 * Serviço CRUD para dados de correção CIAAR.
 * Gerencia templates e os dados de correção detalhados (erros, estrutura, conteúdo, sugestões).
 */
export const ciaarCorrectionService = {
  // ---------------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------------

  async getDefaultTemplate(): Promise<CorrectionTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('correction_templates')
        .select('*')
        .eq('is_default', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return data as CorrectionTemplate
    } catch (err) {
      logger.error('Erro ao buscar template padrão:', err)
      return null
    }
  },

  async getAllTemplates(): Promise<CorrectionTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('correction_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []) as CorrectionTemplate[]
    } catch (err) {
      logger.error('Erro ao buscar templates:', err)
      return []
    }
  },

  async saveTemplate(template: Partial<CorrectionTemplate> & { name: string }): Promise<CorrectionTemplate | null> {
    try {
      const payload: Record<string, unknown> = {
        name: template.name,
        description: template.description ?? null,
        expression_debit_value: template.expression_debit_value ?? 0.200,
        max_grade: template.max_grade ?? 10.000,
        structure_criteria: template.structure_criteria ?? {},
        content_criteria: template.content_criteria ?? {},
        is_default: template.is_default ?? false,
        updated_at: new Date().toISOString(),
      }

      if (template.id) {
        payload.id = template.id
      }

      const { data, error } = await supabase
        .from('correction_templates')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()

      if (error) throw error

      return data as CorrectionTemplate
    } catch (err) {
      logger.error('Erro ao salvar template:', err)
      throw err
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('correction_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      logger.error('Erro ao deletar template:', err)
      throw err
    }
  },

  // ---------------------------------------------------------------------------
  // Correction Data
  // ---------------------------------------------------------------------------

  /**
   * Salva os dados completos de uma correção CIAAR para uma redação.
   * Remove dados anteriores e insere os novos, depois atualiza a tabela essays.
   */
  async saveCorrection(
    essayId: string,
    result: CorrectionResult,
    templateId: string,
    teacherId: string,
    rawAiResponse?: Record<string, unknown>
  ): Promise<void> {
    try {
      // 1. Deletar dados CIAAR existentes para esta redação
      await Promise.all([
        supabase.from('essay_expression_errors').delete().eq('essay_id', essayId),
        supabase.from('essay_structure_analysis').delete().eq('essay_id', essayId),
        supabase.from('essay_content_analysis').delete().eq('essay_id', essayId),
        supabase.from('essay_improvement_suggestions').delete().eq('essay_id', essayId),
      ])

      // 2. Inserir novos dados em paralelo
      const insertions = []

      if (result.expressionErrors.length > 0) {
        insertions.push(
          supabase.from('essay_expression_errors').insert(
            result.expressionErrors.map((e) => ({
              essay_id: essayId,
              paragraph_number: e.paragraph_number,
              sentence_number: e.sentence_number,
              error_text: e.error_text,
              error_explanation: e.error_explanation,
              suggested_correction: e.suggested_correction,
              debit_value: e.debit_value,
              source: 'ai',
              created_by: teacherId,
            }))
          )
        )
      }

      if (result.structureAnalysis.length > 0) {
        insertions.push(
          supabase.from('essay_structure_analysis').insert(
            result.structureAnalysis.map((s) => ({
              essay_id: essayId,
              paragraph_number: s.paragraph_number,
              paragraph_type: s.paragraph_type,
              analysis_text: s.analysis_text,
              debit_value: s.debit_value,
              source: 'ai',
              created_by: teacherId,
            }))
          )
        )
      }

      if (result.contentAnalysis.length > 0) {
        insertions.push(
          supabase.from('essay_content_analysis').insert(
            result.contentAnalysis.map((c) => ({
              essay_id: essayId,
              criterion_type: c.criterion_type,
              criterion_name: c.criterion_name,
              analysis_text: c.analysis_text,
              debit_level: c.debit_level,
              debit_value: c.debit_value,
              source: 'ai',
              created_by: teacherId,
            }))
          )
        )
      }

      if (result.improvementSuggestions.length > 0) {
        insertions.push(
          supabase.from('essay_improvement_suggestions').insert(
            result.improvementSuggestions.map((s) => ({
              essay_id: essayId,
              category: s.category,
              suggestion_text: s.suggestion_text,
            }))
          )
        )
      }

      const insertResults = await Promise.all(insertions)
      for (const res of insertResults) {
        if (res.error) {
          logger.error('Erro ao inserir dados de correção:', res.error)
          throw res.error
        }
      }

      // 3. Atualizar a tabela essays com totais e nota final
      const { error: updateError } = await supabase
        .from('essays')
        .update({
          expression_debit_total: result.totalExpressionDebit,
          structure_debit_total: result.totalStructureDebit,
          content_debit_total: result.totalContentDebit,
          final_grade_ciaar: result.finalGrade,
          correction_template_id: templateId,
          ai_correction_raw: rawAiResponse ?? null,
          status: 'corrected',
          teacher_id: teacherId,
          correction_date: new Date().toISOString(),
        })
        .eq('id', essayId)

      if (updateError) {
        logger.error('Erro ao atualizar essay com nota final:', updateError)
        throw updateError
      }

      logger.info(`Correção CIAAR salva para essay ${essayId}. Nota: ${result.finalGrade}`)
    } catch (err) {
      logger.error('Erro ao salvar correção CIAAR:', err)
      throw err
    }
  },

  /**
   * Carrega os dados completos de correção CIAAR de uma redação.
   */
  async loadCorrection(essayId: string): Promise<CorrectionResult | null> {
    try {
      const [expressionRes, structureRes, contentRes, suggestionsRes, essayRes] = await Promise.all([
        supabase
          .from('essay_expression_errors')
          .select('*')
          .eq('essay_id', essayId)
          .order('paragraph_number', { ascending: true }),
        supabase
          .from('essay_structure_analysis')
          .select('*')
          .eq('essay_id', essayId)
          .order('paragraph_number', { ascending: true }),
        supabase
          .from('essay_content_analysis')
          .select('*')
          .eq('essay_id', essayId),
        supabase
          .from('essay_improvement_suggestions')
          .select('*')
          .eq('essay_id', essayId),
        supabase
          .from('essays')
          .select('final_grade_ciaar, expression_debit_total, structure_debit_total, content_debit_total')
          .eq('id', essayId)
          .single(),
      ])

      const expressionErrors = (expressionRes.data ?? []) as ExpressionError[]
      const structureAnalysis = (structureRes.data ?? []) as StructureAnalysis[]
      const contentAnalysis = (contentRes.data ?? []) as ContentAnalysis[]
      const improvementSuggestions = (suggestionsRes.data ?? []) as ImprovementSuggestion[]

      // Se não há dados de correção, retornar null
      if (
        expressionErrors.length === 0 &&
        structureAnalysis.length === 0 &&
        contentAnalysis.length === 0
      ) {
        return null
      }

      const essay = essayRes.data

      return {
        expressionErrors,
        structureAnalysis,
        contentAnalysis,
        improvementSuggestions,
        totalExpressionDebit: essay?.expression_debit_total ?? 0,
        totalStructureDebit: essay?.structure_debit_total ?? 0,
        totalContentDebit: essay?.content_debit_total ?? 0,
        finalGrade: essay?.final_grade_ciaar ?? 0,
      }
    } catch (err) {
      logger.error('Erro ao carregar correção CIAAR:', err)
      return null
    }
  },
}
