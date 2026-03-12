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

  /**
   * Obtém o template de correção padrão.
   */
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

  /**
   * Obtém todos os templates de correção.
   */
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

  /**
   * Salva (cria ou atualiza) um template de correção.
   */
  async saveTemplate(template: CorrectionTemplate): Promise<CorrectionTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('correction_templates')
        .upsert(
          {
            ...template,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single()

      if (error) throw error

      return data as CorrectionTemplate
    } catch (err) {
      logger.error('Erro ao salvar template:', err)
      throw err
    }
  },

  /**
   * Remove um template de correção.
   */
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
    teacherId: string
  ): Promise<void> {
    try {
      // 1. Deletar dados CIAAR existentes para esta redação (4 tabelas filhas)
      await Promise.all([
        supabase.from('essay_expression_errors').delete().eq('essay_id', essayId),
        supabase.from('essay_structure_analyses').delete().eq('essay_id', essayId),
        supabase.from('essay_content_analyses').delete().eq('essay_id', essayId),
        supabase.from('essay_improvement_suggestions').delete().eq('essay_id', essayId),
      ])

      // 2. Inserir novos dados em paralelo
      const insertions = []

      if (result.expression_errors.length > 0) {
        insertions.push(
          supabase.from('essay_expression_errors').insert(
            result.expression_errors.map((e) => ({
              essay_id: essayId,
              error_type: e.error_type,
              original_text: e.original_text,
              corrected_text: e.corrected_text,
              explanation: e.explanation,
              paragraph_index: e.paragraph_index,
              position_start: e.position_start ?? null,
              position_end: e.position_end ?? null,
            }))
          )
        )
      }

      if (result.structure_analyses.length > 0) {
        insertions.push(
          supabase.from('essay_structure_analyses').insert(
            result.structure_analyses.map((s) => ({
              essay_id: essayId,
              paragraph_type: s.paragraph_type,
              paragraph_index: s.paragraph_index,
              period_count: s.period_count,
              has_required_connectives: s.has_required_connectives,
              connectives_found: s.connectives_found,
              connectives_missing: s.connectives_missing,
              debit: s.debit,
              observations: s.observations,
            }))
          )
        )
      }

      if (result.content_analyses.length > 0) {
        insertions.push(
          supabase.from('essay_content_analyses').insert(
            result.content_analyses.map((c) => ({
              essay_id: essayId,
              criterion_type: c.criterion_type,
              debit_level: c.debit_level,
              debit_percentage: c.debit_percentage,
              justification: c.justification,
            }))
          )
        )
      }

      if (result.improvement_suggestions.length > 0) {
        insertions.push(
          supabase.from('essay_improvement_suggestions').insert(
            result.improvement_suggestions.map((s) => ({
              essay_id: essayId,
              category: s.category,
              title: s.title,
              description: s.description,
              example_before: s.example_before ?? null,
              example_after: s.example_after ?? null,
              priority: s.priority,
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
          expression_debit_total: result.expression_debit_total,
          structure_debit_total: result.structure_debit_total,
          content_debit_total: result.content_debit_total,
          final_grade_ciaar: result.final_grade,
          correction_template_id: templateId,
          status: 'corrected',
          teacher_id: teacherId,
          correction_date: new Date().toISOString(),
        })
        .eq('id', essayId)

      if (updateError) {
        logger.error('Erro ao atualizar essay com nota final:', updateError)
        throw updateError
      }

      logger.info(`Correção CIAAR salva para essay ${essayId}. Nota: ${result.final_grade}`)
    } catch (err) {
      logger.error('Erro ao salvar correção CIAAR:', err)
      throw err
    }
  },

  /**
   * Carrega os dados completos de correção CIAAR de uma redação.
   * Retorna null se a redação não tiver sido corrigida pelo sistema CIAAR.
   */
  async loadCorrection(essayId: string): Promise<CorrectionResult | null> {
    try {
      // Carregar todas as 4 tabelas em paralelo
      const [expressionRes, structureRes, contentRes, suggestionsRes] = await Promise.all([
        supabase
          .from('essay_expression_errors')
          .select('*')
          .eq('essay_id', essayId)
          .order('paragraph_index', { ascending: true }),
        supabase
          .from('essay_structure_analyses')
          .select('*')
          .eq('essay_id', essayId)
          .order('paragraph_index', { ascending: true }),
        supabase
          .from('essay_content_analyses')
          .select('*')
          .eq('essay_id', essayId),
        supabase
          .from('essay_improvement_suggestions')
          .select('*')
          .eq('essay_id', essayId)
          .order('priority', { ascending: true }),
      ])

      const expressionErrors = (expressionRes.data ?? []) as ExpressionError[]
      const structureAnalyses = (structureRes.data ?? []) as StructureAnalysis[]
      const contentAnalyses = (contentRes.data ?? []) as ContentAnalysis[]
      const improvementSuggestions = (suggestionsRes.data ?? []) as ImprovementSuggestion[]

      // Se não há dados de correção, retornar null
      if (
        expressionErrors.length === 0 &&
        structureAnalyses.length === 0 &&
        contentAnalyses.length === 0
      ) {
        return null
      }

      // Calcular totais
      const expressionDebitTotal = expressionErrors.length // cada erro = 1 débito (ajustar com template)
      const structureDebitTotal = structureAnalyses.reduce((sum, s) => sum + s.debit, 0)

      // Para conteúdo, buscar o template padrão para obter max_grade
      const { data: essay } = await supabase
        .from('essays')
        .select('final_grade_ciaar, expression_debit_total, structure_debit_total, content_debit_total, correction_template_id')
        .eq('id', essayId)
        .single()

      const maxGrade = 100 // fallback
      const contentDebitTotal = contentAnalyses.reduce(
        (sum, c) => sum + (maxGrade * c.debit_percentage) / 100,
        0
      )

      const finalGrade = calculateFinalGrade(
        essay?.final_grade_ciaar ?? maxGrade,
        essay?.expression_debit_total ?? expressionDebitTotal,
        essay?.structure_debit_total ?? structureDebitTotal,
        essay?.content_debit_total ?? contentDebitTotal,
        contentAnalyses
      )

      return {
        expression_errors: expressionErrors,
        structure_analyses: structureAnalyses,
        content_analyses: contentAnalyses,
        improvement_suggestions: improvementSuggestions,
        expression_debit_total: essay?.expression_debit_total ?? expressionDebitTotal,
        structure_debit_total: essay?.structure_debit_total ?? structureDebitTotal,
        content_debit_total: essay?.content_debit_total ?? contentDebitTotal,
        final_grade: essay?.final_grade_ciaar ?? finalGrade,
        max_grade: maxGrade,
        correction_source: 'ai',
        corrected_at: new Date().toISOString(),
      }
    } catch (err) {
      logger.error('Erro ao carregar correção CIAAR:', err)
      return null
    }
  },
}
