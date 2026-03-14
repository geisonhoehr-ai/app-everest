// =============================================================================
// Essay Correction Types (Multi-format: CIAAR + ENEM)
// Aligned with DB schema
// =============================================================================

// --- Correction Type ---

export type CorrectionType = 'ciaar' | 'enem'

// --- Provider types (matches Edge Function) ---

export type AIProviderType = 'claude' | 'openai' | 'gemini' | 'antigravity' | 'dify'

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

export interface CorrectionTemplate {
  id?: string
  name: string
  description?: string
  correction_type: CorrectionType
  expression_debit_value: number
  max_grade: number
  structure_criteria: Record<string, unknown>
  content_criteria: Record<string, unknown>
  is_default: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

// --- CIAAR Types ---

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

export interface ImprovementSuggestion {
  id?: string
  essay_id?: string
  category: SuggestionCategory | string
  suggestion_text: string
  created_at?: string
}

// --- ENEM Types ---

export interface CompetencyScore {
  id?: string
  essay_id?: string
  competency_number: number
  competency_name: string
  score: number
  max_score: number
  justification: string
  source: CorrectionSource | string
  created_by?: string
  created_at?: string
}

/** ENEM competency level definition from template */
export interface EnemCompetencyLevel {
  score: number
  label: string
}

/** ENEM competency definition from template */
export interface EnemCompetencyDef {
  number: number
  name: string
  description?: string
  max_score: number
  levels: EnemCompetencyLevel[]
}

// --- Correction Request (sent to Edge Function) ---

export interface CorrectionRequest {
  essayText: string
  theme: string
  correctionTemplate: Record<string, unknown>
  studentName?: string
  imageUrls?: string[]
}

// --- CIAAR Correction Result ---

export interface CorrectionResult {
  correctionType: CorrectionType
  // CIAAR fields
  expressionErrors: ExpressionError[]
  structureAnalysis: StructureAnalysis[]
  contentAnalysis: ContentAnalysis[]
  improvementSuggestions: ImprovementSuggestion[]
  totalExpressionDebit: number
  totalStructureDebit: number
  totalContentDebit: number
  // ENEM fields
  competencyScores: CompetencyScore[]
  // Shared
  finalGrade: number
}

// --- Utility Functions ---

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

/**
 * Calcula a nota final ENEM.
 * Soma de todas as competências (0-1000).
 */
export function calculateEnemGrade(competencyScores: CompetencyScore[]): number {
  return competencyScores.reduce((sum, c) => sum + (c.score || 0), 0)
}

/**
 * Creates empty ENEM competency scores from template definition.
 */
export function createEmptyCompetencyScores(competencies: EnemCompetencyDef[]): CompetencyScore[] {
  return competencies.map(c => ({
    competency_number: c.number,
    competency_name: c.name,
    score: 0,
    max_score: c.max_score,
    justification: '',
    source: 'manual' as const,
  }))
}
