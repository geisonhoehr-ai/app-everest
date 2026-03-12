// =============================================================================
// CIAAR Essay Correction Types
// =============================================================================

// --- Enums / Literal Types ---

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq'

export type CorrectionSource = 'ai' | 'manual' | 'ai_reviewed'

export type ParagraphType =
  | 'introduction'
  | 'development_1'
  | 'development_2'
  | 'conclusion'

export type ContentCriterionType =
  | 'pertinence'
  | 'argumentation'
  | 'informativity'

export type SuggestionCategory = 'expression' | 'structure' | 'content'

export type DebitLevel =
  | 'Fuga TOTAL'
  | 'Fuga PARCIAL'
  | 'Tangenciamento'
  | 'Sem Débito'

// --- Template Sub-types ---

export interface StructureCriteria {
  min_periods_per_paragraph: number
  max_periods_per_paragraph: number
  required_connectives: boolean
  connective_sets: ConnectiveSet[]
  paragraph_structures: ParagraphStructure[]
}

export interface ConnectiveSet {
  paragraph_type: ParagraphType
  connectives: string[]
}

export interface ParagraphStructure {
  paragraph_type: ParagraphType
  label: string
  description: string
  expected_periods: number
}

export interface ContentLevel {
  level: DebitLevel
  debit_percentage: number
  description: string
}

export interface ContentCriterion {
  type: ContentCriterionType
  label: string
  description: string
  levels: ContentLevel[]
}

export interface ContentCriteria {
  criteria: ContentCriterion[]
}

// --- Correction Template ---

export interface CorrectionTemplate {
  id?: string
  name: string
  description?: string
  max_grade: number
  expression_debit_per_error: number
  structure_criteria: StructureCriteria
  content_criteria: ContentCriteria
  is_default: boolean
  created_at?: string
  updated_at?: string
}

// --- Expression Error ---

export interface ExpressionError {
  id?: string
  essay_id?: string
  error_type: string
  original_text: string
  corrected_text: string
  explanation: string
  paragraph_index: number
  position_start?: number
  position_end?: number
  created_at?: string
}

// --- Structure Analysis ---

export interface StructureAnalysis {
  id?: string
  essay_id?: string
  paragraph_type: ParagraphType
  paragraph_index: number
  period_count: number
  has_required_connectives: boolean
  connectives_found: string[]
  connectives_missing: string[]
  debit: number
  observations: string
  created_at?: string
}

// --- Content Analysis ---

export interface ContentAnalysis {
  id?: string
  essay_id?: string
  criterion_type: ContentCriterionType
  debit_level: DebitLevel
  debit_percentage: number
  justification: string
  created_at?: string
}

// --- Improvement Suggestion ---

export interface ImprovementSuggestion {
  id?: string
  essay_id?: string
  category: SuggestionCategory
  title: string
  description: string
  example_before?: string
  example_after?: string
  priority: number
  created_at?: string
}

// --- Correction Request / Result ---

export interface CorrectionRequest {
  essay_text: string
  theme: string
  template_id: string
  student_name?: string
  student_id?: string
  essay_id?: string
}

export interface CorrectionResult {
  expression_errors: ExpressionError[]
  structure_analyses: StructureAnalysis[]
  content_analyses: ContentAnalysis[]
  improvement_suggestions: ImprovementSuggestion[]
  expression_debit_total: number
  structure_debit_total: number
  content_debit_total: number
  final_grade: number
  max_grade: number
  correction_source: CorrectionSource
  corrected_at: string
  summary?: string
}

// --- AI Provider Config ---

export interface AIProviderConfig {
  id?: string
  provider: AIProvider
  model: string
  api_key?: string
  is_active: boolean
  max_tokens?: number
  temperature?: number
  created_at?: string
  updated_at?: string
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
  return Math.max(0, maxGrade - totalDebit)
}
