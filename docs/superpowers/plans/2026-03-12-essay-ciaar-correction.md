# Essay CIAAR Correction System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic ENEM essay correction system with a CIAAR-model correction system powered by AI, supporting OCR transcription, multi-provider AI adapters, and PDF report generation.

**Architecture:** New database tables for CIAAR-specific correction data (expression errors, structure analysis, content analysis). AI correction via Supabase Edge Functions with adapter pattern for multiple providers. Interactive review panel for professors. Student-facing correction view with 4 tabs + PDF download. Legacy essays remain viewable.

**Tech Stack:** React 19 + TypeScript, Supabase (Postgres + Edge Functions + Storage), @react-pdf/renderer, AI APIs (Claude/OpenAI/Antigravity/Dify via fetch)

**Spec:** `docs/superpowers/specs/2026-03-12-essay-ciaar-correction-design.md`

---

## Chunk 1: Database Schema & Migration

### Task 1: Create database migration for CIAAR tables

**Files:**
- Create: `supabase/migrations/20260312000001_ciaar_correction_system.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260312000001_ciaar_correction_system.sql

-- ============================================================
-- 1. correction_templates (replaces evaluation_criteria_templates)
-- ============================================================
CREATE TABLE IF NOT EXISTS correction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  expression_debit_value NUMERIC(5,3) NOT NULL DEFAULT 0.200,
  max_grade NUMERIC(6,3) NOT NULL DEFAULT 10.000,
  structure_criteria JSONB NOT NULL,
  content_criteria JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_correction_templates_updated_at
  BEFORE UPDATE ON correction_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. essay_expression_errors
-- ============================================================
CREATE TABLE IF NOT EXISTS essay_expression_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  paragraph_number INTEGER NOT NULL,
  sentence_number INTEGER NOT NULL,
  error_text TEXT NOT NULL,
  error_explanation TEXT NOT NULL,
  suggested_correction TEXT NOT NULL,
  debit_value NUMERIC(5,3) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. essay_structure_analysis
-- ============================================================
CREATE TABLE IF NOT EXISTS essay_structure_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  paragraph_number INTEGER NOT NULL,
  paragraph_type TEXT NOT NULL,
  expected_structure JSONB,
  analysis_text TEXT NOT NULL,
  debit_value NUMERIC(5,3) NOT NULL DEFAULT 0.000,
  source TEXT NOT NULL DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. essay_content_analysis
-- ============================================================
CREATE TABLE IF NOT EXISTS essay_content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  criterion_type TEXT NOT NULL,
  criterion_name TEXT NOT NULL,
  criterion_description TEXT,
  analysis_text TEXT NOT NULL,
  debit_level TEXT NOT NULL,
  debit_value NUMERIC(5,3) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. essay_improvement_suggestions
-- ============================================================
CREATE TABLE IF NOT EXISTS essay_improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. ai_provider_configs
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  api_key TEXT,
  model_name TEXT,
  base_url TEXT,
  is_active BOOLEAN DEFAULT false,
  config JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_ai_provider_configs_updated_at
  BEFORE UPDATE ON ai_provider_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. New columns on essays table
-- ============================================================
ALTER TABLE essays ADD COLUMN IF NOT EXISTS transcribed_text TEXT;
ALTER TABLE essays ADD COLUMN IF NOT EXISTS correction_template_id UUID REFERENCES correction_templates(id);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS expression_debit_total NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS structure_debit_total NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS content_debit_total NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS final_grade_ciaar NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS ai_correction_raw JSONB;

-- ============================================================
-- 8. RLS Policies
-- ============================================================

-- correction_templates
ALTER TABLE correction_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view correction templates" ON correction_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage correction templates" ON correction_templates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- essay_expression_errors
ALTER TABLE essay_expression_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own expression errors" ON essay_expression_errors
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_id AND essays.student_id = auth.uid()));
CREATE POLICY "Staff manage all expression errors" ON essay_expression_errors
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- essay_structure_analysis
ALTER TABLE essay_structure_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own structure analysis" ON essay_structure_analysis
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_id AND essays.student_id = auth.uid()));
CREATE POLICY "Staff manage all structure analysis" ON essay_structure_analysis
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- essay_content_analysis
ALTER TABLE essay_content_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own content analysis" ON essay_content_analysis
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_id AND essays.student_id = auth.uid()));
CREATE POLICY "Staff manage all content analysis" ON essay_content_analysis
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- essay_improvement_suggestions
ALTER TABLE essay_improvement_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own suggestions" ON essay_improvement_suggestions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_id AND essays.student_id = auth.uid()));
CREATE POLICY "Staff manage all suggestions" ON essay_improvement_suggestions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- ai_provider_configs
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins manage AI providers" ON ai_provider_configs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'));

-- ============================================================
-- 9. Seed default CIAAR correction template
-- ============================================================
INSERT INTO correction_templates (name, description, expression_debit_value, max_grade, structure_criteria, content_criteria, is_default)
VALUES (
  'CIAAR 2025',
  'Modelo de correção padrão CIAAR - Expressão, Estrutura e Conteúdo com sistema de débitos',
  0.200,
  10.000,
  '{
    "introduction": {
      "label": "Parágrafo 1 (Introdução)",
      "expected_periods": [
        "Apresentação temática neutra",
        "Indicação da TESE (opinião do autor, com marcas de autoria/modalizadores)",
        "Indicação do desfecho do parágrafo (encaminhamento dos argumentos)"
      ],
      "connectives": {
        "theme_to_thesis": ["Nesse contexto", "Nesse viés", "Nesse prisma", "Nessa perspectiva", "Nesse diapasão", "Nesse ínterim"],
        "thesis_to_closing": ["Dessa forma", "Logo", "Assim", "Desse modo", "Por conseguinte", "Destarte", "Sendo assim"]
      }
    },
    "development": {
      "label": "Parágrafo de Desenvolvimento",
      "expected_periods": [
        "Indicação clara do argumento (tópico frasal)",
        "Apresentação de elemento de informatividade (dados, exemplos, citações)",
        "Desfecho com conclusão do parágrafo"
      ],
      "connectives": {
        "intro_to_dev": ["Nesse contexto", "Nesse viés", "Nesse prisma", "Nessa perspectiva", "Nesse diapasão", "Nesse ínterim"],
        "arg_to_info": ["Isso pode ser visto", "Isso pode ser evidenciado", "Esse fato se observa", "Essa questão se comprova"],
        "info_to_closing": ["Dessa forma", "Logo", "Assim", "Desse modo", "Por conseguinte", "Destarte", "Sendo assim"]
      },
      "connectives_between_devs": {
        "same_polarity": ["Ademais", "Outrossim", "Em soma", "Além disso", "Somado a isso", "Ainda"],
        "diverse_polarity": ["Porém", "Todavia", "Entretanto", "Contudo", "Em contraponto", "Não obstante", "Em contrapartida"]
      }
    },
    "conclusion": {
      "label": "Parágrafo 4 (Conclusão)",
      "expected_periods": [
        "Retomada do tema/tese",
        "Proposta de solução detalhada (Agente, Ação, Meio, Finalidade)",
        "Indicação dos resultados esperados"
      ],
      "connectives": {
        "dev_to_conclusion": ["Portanto", "Logo", "Assim", "Com isso", "Diante do exposto", "Dessa forma", "Em suma", "Em síntese", "Por fim"],
        "retake_to_proposal": ["Portanto, é urgente que...", "Logo, é necessário que...", "Assim, torna-se primordial que...", "Com isso, mostra-se fundamental que..."],
        "proposal_to_results": ["Assim, será possível amenizar...", "Com isso, estaremos próximos de reverter...", "Diante do exposto, tais problemáticas estarão mais próximas de uma solução..."]
      }
    }
  }'::jsonb,
  '{
    "pertinence": {
      "name": "Pertinência ao tema",
      "description": "Se o texto aborda o tema proposto, e se a TESE e os argumentos abrangem os aspectos temáticos.",
      "levels": [
        { "label": "Fuga TOTAL", "debit": null, "note": "Nota 0 final" },
        { "label": "Grande fuga", "debit": 1.500 },
        { "label": "Média fuga", "debit": 1.000 },
        { "label": "Leve fuga", "debit": 0.400 },
        { "label": "Pertinente", "debit": 0.000 }
      ]
    },
    "argumentation": {
      "name": "Argumentação coerente",
      "description": "Se os argumentos explicam a TESE ou trazem causas/consequências.",
      "levels": [
        { "label": "Não apresenta", "debit": 1.500 },
        { "label": "Vagos", "debit": 1.000 },
        { "label": "Indireto", "debit": 0.500 },
        { "label": "Claros", "debit": 0.000 }
      ]
    },
    "informativity": {
      "name": "Informatividade",
      "description": "Presença de alusões, citações, dados, exemplos produtivos.",
      "levels": [
        { "label": "Nenhum", "debit": 1.500 },
        { "label": "Um elemento", "debit": 1.000 },
        { "label": "Dois elementos", "debit": 0.200 },
        { "label": "Três ou mais", "debit": 0.000 }
      ]
    }
  }'::jsonb,
  true
);
```

- [ ] **Step 2: Apply migration to remote database**

```bash
# Use Supabase Management API since migration history is out of sync
curl -s -X POST "https://api.supabase.com/v1/projects/hnhzindsfuqnaxosujay/database/query" \
  -H "Authorization: Bearer sbp_c47d0d25e969b5164bc92685507b69858bb8adb9" \
  -H "Content-Type: application/json" \
  -d '{"query": "<SQL from step 1>"}'
```

Split into individual statements if needed. Verify each returns `[]` (success).

- [ ] **Step 3: Verify tables were created**

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/hnhzindsfuqnaxosujay/database/query" \
  -H "Authorization: Bearer sbp_c47d0d25e969b5164bc92685507b69858bb8adb9" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name IN ('\''correction_templates'\'', '\''essay_expression_errors'\'', '\''essay_structure_analysis'\'', '\''essay_content_analysis'\'', '\''essay_improvement_suggestions'\'', '\''ai_provider_configs'\'') ORDER BY table_name;"}'
```

Expected: 6 rows returned.

- [ ] **Step 4: Verify default CIAAR template was seeded**

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/hnhzindsfuqnaxosujay/database/query" \
  -H "Authorization: Bearer sbp_c47d0d25e969b5164bc92685507b69858bb8adb9" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT name, is_default, max_grade, expression_debit_value FROM correction_templates;"}'
```

Expected: `[{"name":"CIAAR 2025","is_default":true,"max_grade":"10.000","expression_debit_value":"0.200"}]`

- [ ] **Step 5: Verify new columns on essays table**

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/hnhzindsfuqnaxosujay/database/query" \
  -H "Authorization: Bearer sbp_c47d0d25e969b5164bc92685507b69858bb8adb9" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name FROM information_schema.columns WHERE table_name = '\''essays'\'' AND column_name IN ('\''transcribed_text'\'', '\''correction_template_id'\'', '\''expression_debit_total'\'', '\''structure_debit_total'\'', '\''content_debit_total'\'', '\''final_grade_ciaar'\'', '\''ai_correction_raw'\'');"}'
```

Expected: 7 rows.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260312000001_ciaar_correction_system.sql
git commit -m "feat(essays): add CIAAR correction schema with 6 new tables and seed template"
```

---

## Chunk 2: TypeScript Types & AI Service Layer

### Task 2: Create TypeScript types for CIAAR correction system

**Files:**
- Create: `src/types/essay-correction.ts`

- [ ] **Step 1: Write the types file**

```typescript
// src/types/essay-correction.ts

// ============================================================
// Correction Template Types
// ============================================================

export interface ConnectiveSet {
  [key: string]: string[];
}

export interface ParagraphStructure {
  label: string;
  expected_periods: string[];
  connectives: ConnectiveSet;
  connectives_between_devs?: {
    same_polarity: string[];
    diverse_polarity: string[];
  };
}

export interface StructureCriteria {
  introduction: ParagraphStructure;
  development: ParagraphStructure;
  conclusion: ParagraphStructure;
}

export interface ContentLevel {
  label: string;
  debit: number | null;
  note?: string;
}

export interface ContentCriterion {
  name: string;
  description: string;
  levels: ContentLevel[];
}

export interface ContentCriteria {
  pertinence: ContentCriterion;
  argumentation: ContentCriterion;
  informativity: ContentCriterion;
}

export interface CorrectionTemplate {
  id: string;
  name: string;
  description: string | null;
  expression_debit_value: number;
  max_grade: number;
  structure_criteria: StructureCriteria;
  content_criteria: ContentCriteria;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Expression Error Types
// ============================================================

export type CorrectionSource = 'ai' | 'manual' | 'ai_reviewed';

export interface ExpressionError {
  id?: string;
  essay_id?: string;
  paragraph_number: number;
  sentence_number: number;
  error_text: string;
  error_explanation: string;
  suggested_correction: string;
  debit_value: number;
  source: CorrectionSource;
  created_by?: string | null;
}

// ============================================================
// Structure Analysis Types
// ============================================================

export type ParagraphType = 'introduction' | 'development_1' | 'development_2' | 'conclusion';

export interface StructureAnalysis {
  id?: string;
  essay_id?: string;
  paragraph_number: number;
  paragraph_type: ParagraphType;
  expected_structure: ParagraphStructure | null;
  analysis_text: string;
  debit_value: number;
  source: CorrectionSource;
  created_by?: string | null;
}

// ============================================================
// Content Analysis Types
// ============================================================

export type ContentCriterionType = 'pertinence' | 'argumentation' | 'informativity';

export interface ContentAnalysis {
  id?: string;
  essay_id?: string;
  criterion_type: ContentCriterionType;
  criterion_name: string;
  criterion_description: string | null;
  analysis_text: string;
  debit_level: string;
  debit_value: number;
  source: CorrectionSource;
  created_by?: string | null;
}

// ============================================================
// Improvement Suggestions
// ============================================================

export type SuggestionCategory = 'expression' | 'structure' | 'content';

export interface ImprovementSuggestion {
  id?: string;
  essay_id?: string;
  category: SuggestionCategory;
  suggestion_text: string;
}

// ============================================================
// AI Correction Request/Response
// ============================================================

export interface CorrectionRequest {
  essayText: string;
  theme: string;
  correctionTemplate: CorrectionTemplate;
  studentName?: string;
}

export interface CorrectionResult {
  expressionErrors: ExpressionError[];
  structureAnalysis: StructureAnalysis[];
  contentAnalysis: ContentAnalysis[];
  improvementSuggestions: ImprovementSuggestion[];
  totalExpressionDebit: number;
  totalStructureDebit: number;
  totalContentDebit: number;
  finalGrade: number;
}

// ============================================================
// AI Provider Config
// ============================================================

export type AIProvider = 'claude' | 'openai' | 'antigravity' | 'dify';

export interface AIProviderConfig {
  id: string;
  provider: AIProvider;
  display_name: string;
  api_key: string | null;
  model_name: string | null;
  base_url: string | null;
  is_active: boolean;
  config: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Grade Calculation
// ============================================================

export function calculateFinalGrade(
  maxGrade: number,
  expressionDebit: number,
  structureDebit: number,
  contentDebit: number,
  contentAnalyses: ContentAnalysis[]
): number {
  // "Fuga TOTAL" override — any content criterion with this level forces grade to 0
  const hasTotalFlight = contentAnalyses.some(
    (ca) => ca.debit_level === 'Fuga TOTAL'
  );
  if (hasTotalFlight) return 0;

  const grade = maxGrade - expressionDebit - structureDebit - contentDebit;
  return Math.max(0, Math.round(grade * 1000) / 1000); // floor at 0, 3 decimal places
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/essay-correction.ts
git commit -m "feat(essays): add TypeScript types for CIAAR correction system"
```

### Task 3: Create CIAAR correction prompt template

**Files:**
- Create: `src/services/ai/correctionPrompt.ts`

- [ ] **Step 1: Write the prompt builder**

This file builds the system prompt and user prompt for the AI correction. It takes a `CorrectionTemplate` and essay data, and returns prompts that instruct the AI to output structured JSON matching `CorrectionResult`.

```typescript
// src/services/ai/correctionPrompt.ts

import type { CorrectionTemplate, CorrectionResult } from '@/types/essay-correction'

export function buildCorrectionSystemPrompt(template: CorrectionTemplate): string {
  return `Você é um corretor de redações especializado no modelo de avaliação ${template.name}.
Sua tarefa é analisar redações de forma rigorosa seguindo EXATAMENTE o modelo de correção fornecido.

## MODELO DE CORREÇÃO

### Nota máxima: ${template.max_grade}
### Valor de cada débito de expressão: ${template.expression_debit_value}

### CRITÉRIOS DE ESTRUTURA (o que se espera de cada parágrafo):
${JSON.stringify(template.structure_criteria, null, 2)}

### CRITÉRIOS DE CONTEÚDO (níveis de débito):
${JSON.stringify(template.content_criteria, null, 2)}

## INSTRUÇÕES DE ANÁLISE

### 1. ERROS DE EXPRESSÃO
Para cada erro encontrado, indique:
- paragraph_number: número do parágrafo (1, 2, 3, 4)
- sentence_number: número do período dentro do parágrafo (1, 2, 3)
- error_text: o trecho exato com erro
- error_explanation: explicação detalhada do porquê é um erro (regra gramatical, regência, concordância, etc.)
- suggested_correction: a correção sugerida
- debit_value: ${template.expression_debit_value} (fixo por erro)

Tipos de erros a identificar: concordância nominal/verbal, regência verbal/nominal, crase, pontuação, ortografia, estrangeirismos, informalidade, uso inadequado de gerúndio, maiúscula/minúscula.

### 2. ANÁLISE DE ESTRUTURA
Para cada parágrafo, analise:
- Se contém os períodos esperados conforme o modelo
- Se os conectivos são adequados (compare com a lista de conectivos esperados)
- Escreva uma análise detalhada do parágrafo
- Atribua um débito (normalmente 0.000 se a estrutura está correta)

### 3. ANÁLISE DE CONTEÚDO
Para cada critério (pertinência, argumentação, informatividade):
- Analise o texto conforme a descrição do critério
- Selecione o nível de débito adequado dentre os níveis disponíveis
- Escreva uma análise detalhada justificando o nível escolhido

### 4. SUGESTÕES DE MELHORIA
Gere sugestões detalhadas e específicas para cada categoria:
- expression: dicas para evitar os erros de expressão encontrados
- structure: como melhorar a estrutura dos parágrafos
- content: como enriquecer o conteúdo (informatividade, argumentação)

## FORMATO DE RESPOSTA
Responda EXCLUSIVAMENTE com um JSON válido no formato especificado. Sem texto adicional antes ou depois do JSON.`
}

export function buildCorrectionUserPrompt(
  essayText: string,
  theme: string,
  studentName?: string
): string {
  const header = studentName
    ? `ALUNO: ${studentName}\n`
    : ''

  return `${header}TEMA DA REDAÇÃO: ${theme}

TEXTO DA REDAÇÃO:
${essayText}

Analise esta redação e retorne o resultado como JSON com a seguinte estrutura:
{
  "expressionErrors": [
    {
      "paragraph_number": 1,
      "sentence_number": 1,
      "error_text": "trecho com erro",
      "error_explanation": "explicação do erro",
      "suggested_correction": "correção sugerida",
      "debit_value": 0.200
    }
  ],
  "structureAnalysis": [
    {
      "paragraph_number": 1,
      "paragraph_type": "introduction",
      "analysis_text": "análise detalhada do parágrafo",
      "debit_value": 0.000
    }
  ],
  "contentAnalysis": [
    {
      "criterion_type": "pertinence",
      "criterion_name": "Pertinência ao tema",
      "analysis_text": "análise detalhada",
      "debit_level": "Pertinente",
      "debit_value": 0.000
    }
  ],
  "improvementSuggestions": [
    {
      "category": "expression",
      "suggestion_text": "sugestão detalhada"
    }
  ],
  "totalExpressionDebit": 0.000,
  "totalStructureDebit": 0.000,
  "totalContentDebit": 0.000,
  "finalGrade": 10.000
}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/ai/correctionPrompt.ts
git commit -m "feat(essays): add CIAAR correction prompt builder"
```

### Task 4: Create AI adapter interfaces and service

**Files:**
- Create: `src/services/ai/types.ts`
- Create: `src/services/ai/aiCorrectionService.ts`

- [ ] **Step 1: Write the adapter interface**

```typescript
// src/services/ai/types.ts

import type { CorrectionRequest, CorrectionResult } from '@/types/essay-correction'

export interface AICorrectionAdapter {
  /** Run full CIAAR correction on essay text */
  correct(request: CorrectionRequest): Promise<CorrectionResult>;
  /** Transcribe handwritten essay image(s) to text via OCR/vision */
  transcribe(imageUrls: string[]): Promise<string>;
}
```

- [ ] **Step 2: Write the main service that picks the active adapter**

```typescript
// src/services/ai/aiCorrectionService.ts

import { supabase } from '@/lib/supabase'
import type { CorrectionRequest, CorrectionResult, AIProviderConfig } from '@/types/essay-correction'
import { logger } from '@/lib/logger'

/**
 * Main AI correction service.
 * Calls Supabase Edge Functions which handle adapter selection and API key management server-side.
 */
export const aiCorrectionService = {
  /** Get the active AI provider config (without API key) */
  async getActiveProvider(): Promise<AIProviderConfig | null> {
    const { data, error } = await supabase
      .from('ai_provider_configs')
      .select('id, provider, display_name, model_name, base_url, is_active, config, created_at, updated_at')
      .eq('is_active', true)
      .single()

    if (error) {
      logger.error('Error fetching active AI provider:', error)
      return null
    }
    return data
  },

  /** Run AI correction via Edge Function */
  async correctEssay(request: CorrectionRequest): Promise<CorrectionResult> {
    const { data, error } = await supabase.functions.invoke('ai-essay-correction', {
      body: {
        action: 'correct',
        essayText: request.essayText,
        theme: request.theme,
        correctionTemplate: request.correctionTemplate,
        studentName: request.studentName,
      },
    })

    if (error) {
      logger.error('AI correction failed:', error)
      throw new Error(`Erro na correção IA: ${error.message}`)
    }

    return data as CorrectionResult
  },

  /** Transcribe essay image(s) via Edge Function */
  async transcribeEssay(imageUrls: string[]): Promise<string> {
    const { data, error } = await supabase.functions.invoke('ai-essay-correction', {
      body: {
        action: 'transcribe',
        imageUrls,
      },
    })

    if (error) {
      logger.error('OCR transcription failed:', error)
      throw new Error(`Erro na transcrição: ${error.message}`)
    }

    return data.text as string
  },

  /** Get all AI provider configs (admin) */
  async getAllProviders(): Promise<AIProviderConfig[]> {
    const { data, error } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .order('display_name')

    if (error) {
      logger.error('Error fetching AI providers:', error)
      return []
    }
    return data || []
  },

  /** Save/update AI provider config (admin) */
  async saveProvider(config: Partial<AIProviderConfig> & { provider: string; display_name: string }): Promise<AIProviderConfig | null> {
    // If setting as active, deactivate all others first
    if (config.is_active) {
      await supabase
        .from('ai_provider_configs')
        .update({ is_active: false })
        .neq('id', config.id || '')
    }

    if (config.id) {
      const { data, error } = await supabase
        .from('ai_provider_configs')
        .update(config)
        .eq('id', config.id)
        .select()
        .single()
      if (error) { logger.error('Error updating AI provider:', error); return null }
      return data
    } else {
      const { data, error } = await supabase
        .from('ai_provider_configs')
        .insert(config)
        .select()
        .single()
      if (error) { logger.error('Error creating AI provider:', error); return null }
      return data
    }
  },

  /** Delete AI provider config (admin) */
  async deleteProvider(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('ai_provider_configs')
      .delete()
      .eq('id', id)
    if (error) { logger.error('Error deleting AI provider:', error); return false }
    return true
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/ai/types.ts src/services/ai/aiCorrectionService.ts
git commit -m "feat(essays): add AI correction service with Edge Function integration"
```

### Task 5: Create CIAAR correction data service

**Files:**
- Create: `src/services/ciaarCorrectionService.ts`

- [ ] **Step 1: Write the service for CRUD on CIAAR correction tables**

```typescript
// src/services/ciaarCorrectionService.ts

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type {
  CorrectionTemplate,
  ExpressionError,
  StructureAnalysis,
  ContentAnalysis,
  ImprovementSuggestion,
  CorrectionResult,
  calculateFinalGrade,
} from '@/types/essay-correction'

export const ciaarCorrectionService = {
  // ============================================================
  // Correction Templates
  // ============================================================

  async getDefaultTemplate(): Promise<CorrectionTemplate | null> {
    const { data, error } = await supabase
      .from('correction_templates')
      .select('*')
      .eq('is_default', true)
      .single()
    if (error) { logger.error('Error fetching default template:', error); return null }
    return data
  },

  async getAllTemplates(): Promise<CorrectionTemplate[]> {
    const { data, error } = await supabase
      .from('correction_templates')
      .select('*')
      .order('name')
    if (error) { logger.error('Error fetching templates:', error); return [] }
    return data || []
  },

  async saveTemplate(template: Partial<CorrectionTemplate>): Promise<CorrectionTemplate | null> {
    if (template.id) {
      const { data, error } = await supabase
        .from('correction_templates')
        .update(template)
        .eq('id', template.id)
        .select()
        .single()
      if (error) { logger.error('Error updating template:', error); return null }
      return data
    }
    const { data, error } = await supabase
      .from('correction_templates')
      .insert(template)
      .select()
      .single()
    if (error) { logger.error('Error creating template:', error); return null }
    return data
  },

  async deleteTemplate(id: string): Promise<boolean> {
    const { error } = await supabase.from('correction_templates').delete().eq('id', id)
    if (error) { logger.error('Error deleting template:', error); return false }
    return true
  },

  // ============================================================
  // Save Full Correction Result
  // ============================================================

  async saveCorrection(
    essayId: string,
    result: CorrectionResult,
    templateId: string,
    teacherId: string
  ): Promise<boolean> {
    try {
      // 1. Delete existing CIAAR correction data for this essay
      await Promise.all([
        supabase.from('essay_expression_errors').delete().eq('essay_id', essayId),
        supabase.from('essay_structure_analysis').delete().eq('essay_id', essayId),
        supabase.from('essay_content_analysis').delete().eq('essay_id', essayId),
        supabase.from('essay_improvement_suggestions').delete().eq('essay_id', essayId),
      ])

      // 2. Insert expression errors
      if (result.expressionErrors.length > 0) {
        const { error } = await supabase.from('essay_expression_errors').insert(
          result.expressionErrors.map((e) => ({
            essay_id: essayId,
            paragraph_number: e.paragraph_number,
            sentence_number: e.sentence_number,
            error_text: e.error_text,
            error_explanation: e.error_explanation,
            suggested_correction: e.suggested_correction,
            debit_value: e.debit_value,
            source: e.source || 'ai_reviewed',
            created_by: teacherId,
          }))
        )
        if (error) throw error
      }

      // 3. Insert structure analysis
      if (result.structureAnalysis.length > 0) {
        const { error } = await supabase.from('essay_structure_analysis').insert(
          result.structureAnalysis.map((s) => ({
            essay_id: essayId,
            paragraph_number: s.paragraph_number,
            paragraph_type: s.paragraph_type,
            expected_structure: s.expected_structure,
            analysis_text: s.analysis_text,
            debit_value: s.debit_value,
            source: s.source || 'ai_reviewed',
            created_by: teacherId,
          }))
        )
        if (error) throw error
      }

      // 4. Insert content analysis
      if (result.contentAnalysis.length > 0) {
        const { error } = await supabase.from('essay_content_analysis').insert(
          result.contentAnalysis.map((c) => ({
            essay_id: essayId,
            criterion_type: c.criterion_type,
            criterion_name: c.criterion_name,
            criterion_description: c.criterion_description,
            analysis_text: c.analysis_text,
            debit_level: c.debit_level,
            debit_value: c.debit_value,
            source: c.source || 'ai_reviewed',
            created_by: teacherId,
          }))
        )
        if (error) throw error
      }

      // 5. Insert improvement suggestions
      if (result.improvementSuggestions.length > 0) {
        const { error } = await supabase.from('essay_improvement_suggestions').insert(
          result.improvementSuggestions.map((s) => ({
            essay_id: essayId,
            category: s.category,
            suggestion_text: s.suggestion_text,
          }))
        )
        if (error) throw error
      }

      // 6. Update essay with totals and grade
      const { error: updateError } = await supabase
        .from('essays')
        .update({
          correction_template_id: templateId,
          expression_debit_total: result.totalExpressionDebit,
          structure_debit_total: result.totalStructureDebit,
          content_debit_total: result.totalContentDebit,
          final_grade_ciaar: result.finalGrade,
          ai_correction_raw: result,
          status: 'corrected',
          teacher_id: teacherId,
          correction_date: new Date().toISOString(),
        })
        .eq('id', essayId)

      if (updateError) throw updateError
      return true
    } catch (error) {
      logger.error('Error saving CIAAR correction:', error)
      return false
    }
  },

  // ============================================================
  // Load Full Correction for an Essay
  // ============================================================

  async loadCorrection(essayId: string): Promise<CorrectionResult | null> {
    try {
      const [exprRes, structRes, contentRes, suggestRes] = await Promise.all([
        supabase.from('essay_expression_errors').select('*').eq('essay_id', essayId).order('paragraph_number').order('sentence_number'),
        supabase.from('essay_structure_analysis').select('*').eq('essay_id', essayId).order('paragraph_number'),
        supabase.from('essay_content_analysis').select('*').eq('essay_id', essayId).order('criterion_type'),
        supabase.from('essay_improvement_suggestions').select('*').eq('essay_id', essayId).order('category'),
      ])

      if (!exprRes.data && !structRes.data && !contentRes.data) return null

      const expressionErrors = exprRes.data || []
      const structureAnalysis = structRes.data || []
      const contentAnalysis = contentRes.data || []
      const improvementSuggestions = suggestRes.data || []

      const totalExpressionDebit = expressionErrors.reduce((sum, e) => sum + Number(e.debit_value), 0)
      const totalStructureDebit = structureAnalysis.reduce((sum, s) => sum + Number(s.debit_value), 0)
      const totalContentDebit = contentAnalysis.reduce((sum, c) => sum + Number(c.debit_value), 0)

      return {
        expressionErrors,
        structureAnalysis,
        contentAnalysis,
        improvementSuggestions,
        totalExpressionDebit,
        totalStructureDebit,
        totalContentDebit,
        finalGrade: 0, // will be read from essays table
      }
    } catch (error) {
      logger.error('Error loading CIAAR correction:', error)
      return null
    }
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/ciaarCorrectionService.ts
git commit -m "feat(essays): add CIAAR correction data service for CRUD operations"
```

---

## Chunk 3: Supabase Edge Function for AI Proxy

### Task 6: Create the AI essay correction Edge Function

**Files:**
- Create: `supabase/functions/ai-essay-correction/index.ts`

- [ ] **Step 1: Write the Edge Function**

This Edge Function handles both correction and OCR transcription. It reads the active AI provider from the database and calls the appropriate API.

```typescript
// supabase/functions/ai-essay-correction/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  action: 'correct' | 'transcribe'
  essayText?: string
  theme?: string
  correctionTemplate?: Record<string, unknown>
  studentName?: string
  imageUrls?: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get active AI provider (using service_role to read api_key)
    const { data: provider, error: providerError } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq('is_active', true)
      .single()

    if (providerError || !provider) {
      return new Response(
        JSON.stringify({ error: 'Nenhum provedor de IA ativo configurado. Configure em Admin > Integrações.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: RequestBody = await req.json()

    if (body.action === 'transcribe') {
      const text = await handleTranscribe(provider, body.imageUrls || [])
      return new Response(
        JSON.stringify({ text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.action === 'correct') {
      const result = await handleCorrection(provider, body)
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================
// Provider-specific API calls
// ============================================================

async function callProvider(
  provider: Record<string, unknown>,
  systemPrompt: string,
  userPrompt: string,
  imageUrls?: string[]
): Promise<string> {
  const providerType = provider.provider as string
  const apiKey = provider.api_key as string
  const model = provider.model_name as string
  const baseUrl = provider.base_url as string | null

  if (providerType === 'claude') {
    return await callClaude(apiKey, model || 'claude-sonnet-4-5-20250514', systemPrompt, userPrompt, imageUrls)
  }
  if (providerType === 'openai') {
    return await callOpenAI(apiKey, model || 'gpt-4o', baseUrl, systemPrompt, userPrompt, imageUrls)
  }
  if (providerType === 'antigravity') {
    // Antigravity uses OpenAI-compatible API
    return await callOpenAI(apiKey, model || 'default', baseUrl || 'https://api.antigravity.ai/v1', systemPrompt, userPrompt, imageUrls)
  }

  throw new Error(`Provedor não suportado: ${providerType}`)
}

async function callClaude(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  imageUrls?: string[]
): Promise<string> {
  const messages: Record<string, unknown>[] = []

  if (imageUrls && imageUrls.length > 0) {
    // Vision: include images in the user message
    const content: Record<string, unknown>[] = imageUrls.map((url) => ({
      type: 'image',
      source: { type: 'url', url },
    }))
    content.push({ type: 'text', text: userPrompt })
    messages.push({ role: 'user', content })
  } else {
    messages.push({ role: 'user', content: userPrompt })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function callOpenAI(
  apiKey: string,
  model: string,
  baseUrl: string | null,
  systemPrompt: string,
  userPrompt: string,
  imageUrls?: string[]
): Promise<string> {
  const messages: Record<string, unknown>[] = [
    { role: 'system', content: systemPrompt },
  ]

  if (imageUrls && imageUrls.length > 0) {
    const content: Record<string, unknown>[] = imageUrls.map((url) => ({
      type: 'image_url',
      image_url: { url },
    }))
    content.push({ type: 'text', text: userPrompt })
    messages.push({ role: 'user', content })
  } else {
    messages.push({ role: 'user', content: userPrompt })
  }

  const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// ============================================================
// Action Handlers
// ============================================================

async function handleCorrection(
  provider: Record<string, unknown>,
  body: RequestBody
): Promise<Record<string, unknown>> {
  const { buildCorrectionSystemPrompt, buildCorrectionUserPrompt } = await import('./prompts.ts')

  const systemPrompt = buildCorrectionSystemPrompt(body.correctionTemplate)
  const userPrompt = buildCorrectionUserPrompt(body.essayText!, body.theme!, body.studentName)

  const responseText = await callProvider(provider, systemPrompt, userPrompt)

  // Parse JSON from AI response (may be wrapped in markdown code blocks)
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/) || responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI não retornou JSON válido')
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0]
  return JSON.parse(jsonStr)
}

async function handleTranscribe(
  provider: Record<string, unknown>,
  imageUrls: string[]
): Promise<string> {
  if (imageUrls.length === 0) throw new Error('Nenhuma imagem fornecida')

  const systemPrompt = `Você é um sistema de OCR especializado em transcrever textos manuscritos em português brasileiro.
Transcreva o texto da imagem EXATAMENTE como escrito, mantendo parágrafos e quebras de linha.
Não corrija erros — transcreva fielmente o que está escrito.
Se não conseguir ler algum trecho, indique com [ilegível].
Retorne APENAS o texto transcrito, sem comentários adicionais.`

  const userPrompt = 'Transcreva o texto manuscrito desta(s) imagem(ns) de redação:'

  return await callProvider(provider, systemPrompt, userPrompt, imageUrls)
}
```

- [ ] **Step 2: Create prompts helper for Edge Function**

Since the Edge Function can't import from `src/`, duplicate the prompt builder:

```typescript
// supabase/functions/ai-essay-correction/prompts.ts

export function buildCorrectionSystemPrompt(template: Record<string, unknown>): string {
  return `Você é um corretor de redações especializado no modelo de avaliação ${template.name}.
Sua tarefa é analisar redações de forma rigorosa seguindo EXATAMENTE o modelo de correção fornecido.

## MODELO DE CORREÇÃO

### Nota máxima: ${template.max_grade}
### Valor de cada débito de expressão: ${template.expression_debit_value}

### CRITÉRIOS DE ESTRUTURA:
${JSON.stringify(template.structure_criteria, null, 2)}

### CRITÉRIOS DE CONTEÚDO:
${JSON.stringify(template.content_criteria, null, 2)}

## INSTRUÇÕES DE ANÁLISE

### 1. ERROS DE EXPRESSÃO
Para cada erro encontrado, indique:
- paragraph_number: número do parágrafo (1, 2, 3, 4)
- sentence_number: número do período dentro do parágrafo (1, 2, 3)
- error_text: o trecho exato com erro
- error_explanation: explicação detalhada do porquê é um erro
- suggested_correction: a correção sugerida
- debit_value: ${template.expression_debit_value}

Tipos de erros: concordância nominal/verbal, regência, crase, pontuação, ortografia, estrangeirismos, informalidade, gerúndio inadequado, maiúscula/minúscula.

### 2. ANÁLISE DE ESTRUTURA
Para cada parágrafo: verifique períodos esperados, conectivos, e escreva análise detalhada.

### 3. ANÁLISE DE CONTEÚDO
Para pertinência, argumentação, informatividade: selecione o nível de débito e justifique.

### 4. SUGESTÕES DE MELHORIA
Gere sugestões detalhadas por categoria (expression, structure, content).

## FORMATO
Responda EXCLUSIVAMENTE com JSON válido, sem texto antes ou depois.`
}

export function buildCorrectionUserPrompt(
  essayText: string,
  theme: string,
  studentName?: string
): string {
  const header = studentName ? `ALUNO: ${studentName}\n` : ''
  return `${header}TEMA: ${theme}

TEXTO:
${essayText}

Retorne JSON:
{
  "expressionErrors": [{"paragraph_number":1,"sentence_number":1,"error_text":"","error_explanation":"","suggested_correction":"","debit_value":0.200}],
  "structureAnalysis": [{"paragraph_number":1,"paragraph_type":"introduction","analysis_text":"","debit_value":0.000}],
  "contentAnalysis": [{"criterion_type":"pertinence","criterion_name":"","analysis_text":"","debit_level":"","debit_value":0.000}],
  "improvementSuggestions": [{"category":"expression","suggestion_text":""}],
  "totalExpressionDebit":0,"totalStructureDebit":0,"totalContentDebit":0,"finalGrade":10
}`
}
```

- [ ] **Step 3: Deploy Edge Function**

```bash
npx supabase functions deploy ai-essay-correction --project-ref hnhzindsfuqnaxosujay
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ai-essay-correction/
git commit -m "feat(essays): add AI essay correction Edge Function with multi-provider support"
```

---

## Chunk 4: Admin UI — AI Provider Configuration & Correction Templates

### Task 7: Add AI provider config to Admin Integrations page

**Files:**
- Modify: `src/pages/admin/integrations/AdminIntegrationsPage.tsx`
- Create: `src/components/admin/integrations/AIProviderConfig.tsx`

- [ ] **Step 1: Create the AIProviderConfig component**

This component renders a card for each AI provider (Claude, OpenAI, Antigravity, Dify) where admin can enter API key, model name, base URL, and toggle active. Uses `aiCorrectionService.ts`.

Key features:
- List of provider cards (one per configured provider)
- "Adicionar Provedor" button → dialog with provider dropdown, API key, model, base URL
- Toggle "Ativo" on one provider at a time (radio-style)
- Test connection button (calls Edge Function with a simple test)
- Save/delete actions

- [ ] **Step 2: Integrate into AdminIntegrationsPage**

Add a new section "Inteligência Artificial — Correção de Redações" to the existing integrations page, below the existing Panda/MemberKit/Dify sections.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/integrations/AIProviderConfig.tsx src/pages/admin/integrations/AdminIntegrationsPage.tsx
git commit -m "feat(essays): add AI provider configuration to admin integrations page"
```

### Task 8: Rewrite AdminEssaySettingsPage with correction template CRUD

**Files:**
- Rewrite: `src/pages/admin/essays/AdminEssaySettingsPage.tsx` (currently 28 lines)
- Modify: `src/components/admin/essays/CriteriaTemplateManagement.tsx` → replace with correction template management
- Delete: `src/components/admin/essays/CriteriaTemplateForm.tsx` (replaced)

- [ ] **Step 1: Rewrite AdminEssaySettingsPage**

Two sections:
1. **Templates de Correção** — list of correction templates (CIAAR 2025 seeded), create/edit/delete. Edit form shows: name, description, expression debit value, max grade, structure criteria (JSON editor or structured form), content criteria (structured form with levels).
2. **Categorias de Erros** — keep existing ErrorCategoryManagement component.

- [ ] **Step 2: Remove old CriteriaTemplateForm and update CriteriaTemplateManagement**

Replace `CriteriaTemplateManagement.tsx` with a component that manages `correction_templates` instead of `evaluation_criteria_templates`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/essays/AdminEssaySettingsPage.tsx src/components/admin/essays/
git commit -m "feat(essays): rewrite settings page with CIAAR correction template management"
```

---

## Chunk 5: Admin Correction Page — Major Rewrite

### Task 9: Rewrite AdminEssayCorrectionPage with CIAAR review panel

**Files:**
- Rewrite: `src/pages/admin/essays/AdminEssayCorrectionPage.tsx` (currently 263 lines)
- Rewrite: `src/components/admin/essays/CorrectionPanel.tsx` (currently 212 lines)
- Create: `src/components/admin/essays/ExpressionErrorsReview.tsx`
- Create: `src/components/admin/essays/StructureAnalysisReview.tsx`
- Create: `src/components/admin/essays/ContentAnalysisReview.tsx`
- Create: `src/components/admin/essays/TranscriptionPanel.tsx`

- [ ] **Step 1: Create TranscriptionPanel component**

Shows uploaded essay image(s) on the left. "Transcrever com IA" button. After transcription, shows editable textarea on the right for professor to review/fix. "Aprovar Transcrição" button saves to `essays.transcribed_text`.

- [ ] **Step 2: Create ExpressionErrorsReview component**

List of expression errors returned by AI. Each error card shows:
- P{paragraph}, Per.{sentence} — error_text (highlighted)
- Explanation and suggested correction
- Accept (checkmark) / Edit (pencil) / Reject (X) buttons
- Edit mode: inline edit of all fields
- Summary at bottom: {N} débitos, total: -{total}

- [ ] **Step 3: Create StructureAnalysisReview component**

One card per paragraph (Introdução, Desenvolvimento 1, Desenvolvimento 2, Conclusão).
Each card shows:
- "O que se espera" section (from template)
- "Análise do texto" (editable textarea)
- Débito applied (editable number input)

- [ ] **Step 4: Create ContentAnalysisReview component**

One card per criterion (Pertinência, Argumentação, Informatividade).
Each card shows:
- Criterion description
- Dropdown to select debit level (from template levels)
- Analysis text (editable textarea)
- Debit value auto-fills from selected level

- [ ] **Step 5: Rewrite CorrectionPanel to use 3 tabs**

Tabs: Expressão | Estrutura | Conteúdo
Each tab renders the corresponding review component.
Bottom bar: "Nota Final: {calculated}" + "Finalizar Correção" button.

- [ ] **Step 6: Rewrite AdminEssayCorrectionPage**

Layout:
- Top: essay info (student name, theme, date)
- Left panel: essay text (or image + transcription panel)
- Right panel: CorrectionPanel with 3 tabs
- Top action bar: "Transcrever com IA" (if image) + "Corrigir com IA" button
- Status transitions: set to 'correcting' on page open, 'corrected' on finalize

Uses: `aiCorrectionService.correctEssay()`, `ciaarCorrectionService.saveCorrection()`

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/essays/AdminEssayCorrectionPage.tsx src/components/admin/essays/
git commit -m "feat(essays): rewrite correction page with CIAAR 3-tab review panel and AI integration"
```

---

## Chunk 6: Student Views — Interactive Correction & PDF

### Task 10: Rewrite EssayDetails with 4-tab CIAAR view

**Files:**
- Rewrite: `src/pages/EssayDetails.tsx` (currently 228 lines)
- Create: `src/components/essays/ExpressionErrorsView.tsx`
- Create: `src/components/essays/StructureAnalysisView.tsx`
- Create: `src/components/essays/ContentAnalysisView.tsx`
- Create: `src/components/essays/GradeSummaryView.tsx`
- Rewrite: `src/components/essays/FeedbackReport.tsx` (currently 93 lines)

- [ ] **Step 1: Create ExpressionErrorsView (student read-only)**

Shows essay text with highlighted error excerpts. Click an error to expand: shows explanation + suggested correction in a popover/tooltip. Bottom summary: total errors and debit.

- [ ] **Step 2: Create StructureAnalysisView (student read-only)**

Accordion per paragraph. Each shows: "O que se espera" (expected structure + connectives from template) and "Análise do texto" (the teacher/AI analysis). Debit shown per paragraph.

- [ ] **Step 3: Create ContentAnalysisView (student read-only)**

Cards for each criterion. Shows: criterion name, description, selected level (badge with color), analysis text, debit.

- [ ] **Step 4: Create GradeSummaryView**

Grade breakdown table:
| Categoria | Débitos |
|-----------|---------|
| Expressão | -{expression_debit_total} |
| Estrutura | -{structure_debit_total} |
| Conteúdo  | -{content_debit_total} |
| **NOTA FINAL** | **{final_grade}** |

Plus: improvement suggestions grouped by category below.

- [ ] **Step 5: Rewrite EssayDetails page**

Check if essay has CIAAR correction data (`final_grade_ciaar` is not null).
- If yes: show 4-tab view (Expressão, Estrutura, Conteúdo, Nota + Sugestões)
- If no (legacy): show old FeedbackReport component
- "Baixar PDF" button at top

- [ ] **Step 6: Commit**

```bash
git add src/pages/EssayDetails.tsx src/components/essays/
git commit -m "feat(essays): add student CIAAR correction view with 4-tab interactive display"
```

### Task 11: Create PDF report generation

**Files:**
- Create: `src/components/essays/EssayPDFReport.tsx`

- [ ] **Step 1: Install @react-pdf/renderer**

```bash
npm install @react-pdf/renderer
```

- [ ] **Step 2: Create EssayPDFReport component**

Uses `@react-pdf/renderer` to generate a PDF matching the current manual format (Folha de Correção):
- Page 1: Everest header, student name, theme, essay text by paragraphs
- Pages 2-3: ERROS DE EXPRESSÃO — each error with P/Per reference, explanation, correction
- Pages 3-4: ERROS DE ESTRUTURA — table with paragraph, expected, analysis, debit
- Page 5: ERROS DE CONTEÚDO — each criterion with levels and analysis
- Page 6: CÁLCULO FINAL — debit totals + final grade
- Pages 7+: SUGESTÕES PARA MELHORIA — grouped by category
- Footer: "AVALIADOR: {teacher name}"

The component exports a `downloadEssayPDF(essayData)` function.

- [ ] **Step 3: Wire PDF download button in EssayDetails**

Add "Baixar PDF" button that calls `downloadEssayPDF()`.

- [ ] **Step 4: Commit**

```bash
git add src/components/essays/EssayPDFReport.tsx src/pages/EssayDetails.tsx package.json
git commit -m "feat(essays): add PDF report generation matching CIAAR correction format"
```

---

## Chunk 7: Cleanup & Final Integration

### Task 12: Clean up legacy essay correction code

**Files:**
- Delete: `src/services/essayCorrectionService.ts`
- Delete: `src/services/difyService.ts`
- Delete: `src/components/admin/essays/CriteriaTemplateForm.tsx`
- Modify: `src/services/essayService.ts` — remove references to old correction service
- Modify: `src/pages/EssayReportPage.tsx` — redirect to EssayDetails or update to use new data
- Modify: Router config — ensure all essay routes are correctly mapped

- [ ] **Step 1: Delete old services and update imports**

Remove `essayCorrectionService.ts` and `difyService.ts`. Search for all imports of these files and update to use `aiCorrectionService` or `ciaarCorrectionService`.

- [ ] **Step 2: Update EssayReportPage**

Either redirect to EssayDetails (since it now has the full view) or update to use the new CIAAR data.

- [ ] **Step 3: Update essay listing pages**

Ensure `Essays.tsx` (student) and `AdminEssaysPage.tsx` show the CIAAR grade when available (`final_grade_ciaar`) instead of `final_grade`.

- [ ] **Step 4: Test all flows end-to-end**

1. Configure AI provider in Admin > Integrations
2. Create a theme in Admin > Essays
3. Submit an essay as student (text + image upload)
4. Open essay as teacher in correction page
5. Transcribe image (if applicable)
6. Run AI correction
7. Review and adjust results
8. Finalize correction
9. View correction as student (4 tabs)
10. Download PDF report

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(essays): complete CIAAR correction system with cleanup of legacy code"
```

### Task 13: Final commit and push

- [ ] **Step 1: Push all changes**

```bash
git push origin main
```
