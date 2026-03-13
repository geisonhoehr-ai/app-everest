import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type {
  CorrectionTemplate,
  CorrectionResult,
  CorrectionType,
  ExpressionError,
  StructureAnalysis,
  ContentAnalysis,
  ImprovementSuggestion,
  CompetencyScore,
} from '@/types/essay-correction'
import { calculateFinalGrade, calculateEnemGrade } from '@/types/essay-correction'

/**
 * Serviço CRUD para dados de correção (CIAAR + ENEM).
 * Gerencia templates e os dados de correção detalhados.
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

  async getTemplateById(id: string): Promise<CorrectionTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('correction_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) return null
      return data as CorrectionTemplate
    } catch {
      return null
    }
  },

  async saveTemplate(template: Partial<CorrectionTemplate> & { name: string }): Promise<CorrectionTemplate | null> {
    try {
      const payload: Record<string, unknown> = {
        name: template.name,
        description: template.description ?? null,
        correction_type: template.correction_type ?? 'ciaar',
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
  // Correction Data - Save
  // ---------------------------------------------------------------------------

  /**
   * Salva os dados completos de uma correção para uma redação.
   * Suporta tanto CIAAR quanto ENEM.
   */
  async saveCorrection(
    essayId: string,
    result: CorrectionResult,
    templateId: string,
    teacherId: string,
    rawAiResponse?: Record<string, unknown>
  ): Promise<void> {
    try {
      const correctionType = result.correctionType || 'ciaar'

      if (correctionType === 'enem') {
        await this.saveEnemCorrection(essayId, result, templateId, teacherId, rawAiResponse)
      } else {
        await this.saveCiaarCorrection(essayId, result, templateId, teacherId, rawAiResponse)
      }
    } catch (err) {
      logger.error('Erro ao salvar correção:', err)
      throw err
    }
  },

  async saveCiaarCorrection(
    essayId: string,
    result: CorrectionResult,
    templateId: string,
    teacherId: string,
    rawAiResponse?: Record<string, unknown>
  ): Promise<void> {
    // 1. Delete existing CIAAR data
    await Promise.all([
      supabase.from('essay_expression_errors').delete().eq('essay_id', essayId),
      supabase.from('essay_structure_analysis').delete().eq('essay_id', essayId),
      supabase.from('essay_content_analysis').delete().eq('essay_id', essayId),
      supabase.from('essay_improvement_suggestions').delete().eq('essay_id', essayId),
    ])

    // 2. Insert new data
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
            source: e.source || 'ai',
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
            source: s.source || 'ai',
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
            source: c.source || 'ai',
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

    // 3. Update essays table
    const { error: updateError } = await supabase
      .from('essays')
      .update({
        correction_type: 'ciaar',
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

    if (updateError) throw updateError

    logger.info(`Correção CIAAR salva para essay ${essayId}. Nota: ${result.finalGrade}`)
  },

  async saveEnemCorrection(
    essayId: string,
    result: CorrectionResult,
    templateId: string,
    teacherId: string,
    rawAiResponse?: Record<string, unknown>
  ): Promise<void> {
    // 1. Delete existing ENEM data
    await supabase.from('essay_competency_scores').delete().eq('essay_id', essayId)

    // 2. Insert competency scores
    if (result.competencyScores.length > 0) {
      const { error } = await supabase.from('essay_competency_scores').insert(
        result.competencyScores.map((c) => ({
          essay_id: essayId,
          competency_number: c.competency_number,
          competency_name: c.competency_name,
          score: c.score,
          max_score: c.max_score,
          justification: c.justification || '',
          source: c.source || 'manual',
          created_by: teacherId,
        }))
      )
      if (error) throw error
    }

    // 3. Save improvement suggestions (shared between formats)
    if (result.improvementSuggestions.length > 0) {
      await supabase.from('essay_improvement_suggestions').delete().eq('essay_id', essayId)
      const { error } = await supabase.from('essay_improvement_suggestions').insert(
        result.improvementSuggestions.map((s) => ({
          essay_id: essayId,
          category: s.category,
          suggestion_text: s.suggestion_text,
        }))
      )
      if (error) throw error
    }

    // 4. Update essays table
    const { error: updateError } = await supabase
      .from('essays')
      .update({
        correction_type: 'enem',
        final_grade_enem: result.finalGrade,
        correction_template_id: templateId,
        ai_correction_raw: rawAiResponse ?? null,
        status: 'corrected',
        teacher_id: teacherId,
        correction_date: new Date().toISOString(),
      })
      .eq('id', essayId)

    if (updateError) throw updateError

    logger.info(`Correção ENEM salva para essay ${essayId}. Nota: ${result.finalGrade}`)
  },

  // ---------------------------------------------------------------------------
  // Correction Data - Load
  // ---------------------------------------------------------------------------

  /**
   * Carrega os dados completos de correção de uma redação.
   * Detecta automaticamente o tipo (CIAAR ou ENEM).
   */
  async loadCorrection(essayId: string): Promise<CorrectionResult | null> {
    try {
      // First check the essay's correction_type
      const { data: essayData } = await supabase
        .from('essays')
        .select('correction_type, final_grade_ciaar, final_grade_enem, expression_debit_total, structure_debit_total, content_debit_total')
        .eq('id', essayId)
        .single()

      const correctionType: CorrectionType = (essayData?.correction_type as CorrectionType) || 'ciaar'

      if (correctionType === 'enem') {
        return this.loadEnemCorrection(essayId, essayData)
      }

      return this.loadCiaarCorrection(essayId, essayData)
    } catch (err) {
      logger.error('Erro ao carregar correção:', err)
      return null
    }
  },

  async loadCiaarCorrection(essayId: string, essayData: any): Promise<CorrectionResult | null> {
    const [expressionRes, structureRes, contentRes, suggestionsRes] = await Promise.all([
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
    ])

    const expressionErrors = (expressionRes.data ?? []) as ExpressionError[]
    const structureAnalysis = (structureRes.data ?? []) as StructureAnalysis[]
    const contentAnalysis = (contentRes.data ?? []) as ContentAnalysis[]
    const improvementSuggestions = (suggestionsRes.data ?? []) as ImprovementSuggestion[]

    if (
      expressionErrors.length === 0 &&
      structureAnalysis.length === 0 &&
      contentAnalysis.length === 0
    ) {
      return null
    }

    return {
      correctionType: 'ciaar',
      expressionErrors,
      structureAnalysis,
      contentAnalysis,
      improvementSuggestions,
      competencyScores: [],
      totalExpressionDebit: essayData?.expression_debit_total ?? 0,
      totalStructureDebit: essayData?.structure_debit_total ?? 0,
      totalContentDebit: essayData?.content_debit_total ?? 0,
      finalGrade: essayData?.final_grade_ciaar ?? 0,
    }
  },

  async loadEnemCorrection(essayId: string, essayData: any): Promise<CorrectionResult | null> {
    const [competencyRes, suggestionsRes] = await Promise.all([
      supabase
        .from('essay_competency_scores')
        .select('*')
        .eq('essay_id', essayId)
        .order('competency_number', { ascending: true }),
      supabase
        .from('essay_improvement_suggestions')
        .select('*')
        .eq('essay_id', essayId),
    ])

    const competencyScores = (competencyRes.data ?? []) as CompetencyScore[]
    const improvementSuggestions = (suggestionsRes.data ?? []) as ImprovementSuggestion[]

    if (competencyScores.length === 0) {
      return null
    }

    return {
      correctionType: 'enem',
      expressionErrors: [],
      structureAnalysis: [],
      contentAnalysis: [],
      improvementSuggestions,
      competencyScores,
      totalExpressionDebit: 0,
      totalStructureDebit: 0,
      totalContentDebit: 0,
      finalGrade: essayData?.final_grade_enem ?? calculateEnemGrade(competencyScores),
    }
  },
}
