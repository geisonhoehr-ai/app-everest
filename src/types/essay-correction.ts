// =============================================================================
// CIAAR Essay Correction Types
// Aligned with DB schema (20260312000001_ciaar_correction_system.sql)
// =============================================================================

// --- Provider types (matches Edge Function) ---

export type AIProviderType = 'claude' | 'openai' | 'antigravity' | 'dify'

export type CorrectionSource = 'ai' | 'manual' | 'ai_reviewed'

export type SuggestionCategory = 'expression' | 'structure' | 'content'

export type ContentCriterionType = 'pertinence' | 'argumentation' | 'informativity'

// --- AI Provider Config (matches ai_provider_configs table) ---

export interface AIProviderConfig {
  id?: string
  provider: AIProviderType
  display_name: string
  api_key?: string
  model_name?: string
  base_url?: string
  is_active: boolean
  config?: Record<string, unknown>
  created_by?: string
  created_at?: string
  updated_at?: string
}

// --- Correction Template (matches correction_templates table) ---
// structure_criteria and content_criteria are stored as JSONB

export interface CorrectionTemplate {
  id?: string
  name: string
  description?: string
  expression_debit_value: number  // e.g. 0.200
  max_grade: number               // e.g. 10.000
  structure_criteria: Record<string, unknown>  // JSONB with paragraph structures
  content_criteria: Record<string, unknown>    // JSONB with pertinence/argumentation/informativity
  is_default: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

// --- Expression Error (matches essay_expression_errors table) ---

export interface ExpressionError {
  id?: string
  essay_id?: string
  paragraph_number: number
  sentence_number: number
  error_text: string
  error_explanation: string
  suggested_correction: string
  debit_value: number
  source: CorrectionSource | string
  created_by?: string
  created_at?: string
}

// --- Structure Analysis (matches essay_structure_analysis table) ---

export interface StructureAnalysis {
  id?: string
  essay_id?: string
  paragraph_number: number
  paragraph_type: string
  expected_structure?: Record<string, unknown>
  analysis_text: string
  debit_value: number
  source: CorrectionSource | string
  created_by?: string
  created_at?: string
}

// --- Content Analysis (matches essay_content_analysis table) ---

export interface ContentAnalysis {
  id?: string
  essay_id?: string
  criterion_type: ContentCriterionType | string
  criterion_name: string
  criterion_description?: string
  analysis_text: string
  debit_level: string
  debit_value: number
  source: CorrectionSource | string
  created_by?: string
  created_at?: string
}

// --- Improvement Suggestion (matches essay_improvement_suggestions table) ---

export interface ImprovementSuggestion {
  id?: string
  essay_id?: string
  category: SuggestionCategory | string
  suggestion_text: string
  created_at?: string
}

// --- Correction Request (sent to Edge Function) ---

export interface CorrectionRequest {
  essayText: string
  theme: string
  correctionTemplate: Record<string, unknown>
  studentName?: string
  imageUrls?: string[]
}

// --- Correction Result (from Edge Function / AI response) ---

export interface CorrectionResult {
  expressionErrors: ExpressionError[]
  structureAnalysis: StructureAnalysis[]
  contentAnalysis: ContentAnalysis[]
  improvementSuggestions: ImprovementSuggestion[]
  totalExpressionDebit: number
  totalStructureDebit: number
  totalContentDebit: number
  finalGrade: number
}

// --- Utility Function ---

/**
 * Calcula a nota final CIAAR.
 * Se qualquer critério de conteúdo tiver "Fuga TOTAL", a nota é 0.
 * Caso contrário: max_grade - débitos, com piso em 0.
 */
export function calculateFinalGrade(
  maxGrade: number,
  expressionDebit: number,
  structureDebit: number,
  contentDebit: number,
  contentAnalyses: ContentAnalysis[]
): number {
  const hasTotalFuga = contentAnalyses.some(
    (a) => a.debit_level === 'Fuga TOTAL'
  )

  if (hasTotalFuga) {
    return 0
  }

  const totalDebit = expressionDebit + structureDebit + contentDebit
  return Math.max(0, Number((maxGrade - totalDebit).toFixed(3)))
}
