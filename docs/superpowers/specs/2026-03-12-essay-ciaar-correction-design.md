# Essay Correction System — CIAAR Model Design

## Summary

Redesign the essay correction system to support the CIAAR military exam correction model with three dimensions of analysis (Expression, Structure, Content), automatic debit calculation, AI-powered correction with multi-provider support, OCR transcription for handwritten essays, and PDF report generation matching the current manual process.

## Problem

The current system uses a generic ENEM model (5 competencies x 200 pts). The professor (Prof. Tiago Costa) manually corrects each essay following the CIAAR format, which takes 30-40 minutes per essay. This includes transcribing handwritten text, identifying expression errors with exact paragraph/sentence references, analyzing structure against expected patterns, evaluating content criteria with debit levels, calculating the final grade, and writing improvement suggestions. This is the biggest bottleneck in the operation.

## Solution

AI-powered correction that generates the complete CIAAR analysis, with the professor reviewing and approving. Multi-provider adapter pattern (Claude, OpenAI, Antigravity, Dify) so the best AI can be chosen. OCR for handwritten essay transcription. Interactive web view + downloadable PDF for students.

## Migration Strategy for Existing Data

- The existing `evaluation_criteria_templates` table is **replaced** by `correction_templates`. A migration will drop the old table and its FK from `essay_prompts.criteria_template_id`.
- The existing `essay_annotations` table is **deprecated**. Old essays that used it remain viewable via a legacy read-only component. New corrections use the new tables.
- The existing `essayCorrectionService.ts` and `difyService.ts` are **replaced** by the new `src/services/ai/` architecture. The Dify adapter wraps the new interface. Old service files are deleted.
- The phantom `essay_corrections` table (referenced in code but never created) is not created. All references to it in `essayCorrectionService.ts` are removed when that file is deleted.
- Existing essays with old-format corrections (`ai_analysis`, `ai_suggested_grade` JSONB columns) remain readable. The student detail page checks: if CIAAR tables have data, show new format; otherwise fall back to legacy view.

## Architecture

### Data Model

#### `correction_templates` — Replaces `evaluation_criteria_templates`
```sql
CREATE TABLE correction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- e.g. "CIAAR 2025"
  description TEXT,
  expression_debit_value NUMERIC(5,3) NOT NULL DEFAULT 0.200,
  max_grade NUMERIC(6,3) NOT NULL DEFAULT 10.000,
  structure_criteria JSONB NOT NULL,           -- expected structure per paragraph type
  content_criteria JSONB NOT NULL,             -- pertinence, argumentation, informativity levels
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update trigger
CREATE TRIGGER update_correction_templates_updated_at
  BEFORE UPDATE ON correction_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**structure_criteria** JSONB example:
```json
{
  "introduction": {
    "expected_periods": [
      "Apresentação temática neutra",
      "Indicação da TESE (opinião com marcas de autoria)",
      "Indicação do desfecho (encaminhamento dos argumentos)"
    ],
    "connectives": {
      "theme_to_thesis": ["Nesse contexto", "Nesse viés", "Nesse prisma", "Nessa perspectiva"],
      "thesis_to_closing": ["Dessa forma", "Logo", "Assim", "Desse modo", "Por conseguinte"]
    }
  },
  "development": {
    "expected_periods": [
      "Indicação clara do argumento (tópico frasal)",
      "Elemento de informatividade (dados, exemplos, citações)",
      "Desfecho com conclusão do parágrafo"
    ],
    "connectives": {
      "intro_to_dev": ["Nesse contexto", "Nesse viés", "Nesse prisma"],
      "arg_to_info": ["Isso pode ser visto", "Isso pode ser evidenciado", "Esse fato se observa"],
      "info_to_closing": ["Dessa forma", "Logo", "Assim", "Desse modo"]
    },
    "connectives_between_devs": {
      "same_polarity": ["Ademais", "Outrossim", "Em soma", "Além disso"],
      "diverse_polarity": ["Porém", "Todavia", "Entretanto", "Contudo"]
    }
  },
  "conclusion": {
    "expected_periods": [
      "Retomada do tema/tese",
      "Proposta de solução detalhada (Agente, Ação, Meio, Finalidade)",
      "Indicação dos resultados esperados"
    ],
    "connectives": {
      "dev_to_conclusion": ["Portanto", "Logo", "Assim", "Com isso", "Diante do exposto"],
      "retake_to_proposal": ["Portanto, é urgente que...", "Logo, é necessário que..."],
      "proposal_to_results": ["Assim, será possível amenizar...", "Com isso, estaremos próximos de reverter..."]
    }
  }
}
```

**content_criteria** JSONB example:
```json
{
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
}
```

#### `essay_expression_errors` — Inline expression errors
```sql
CREATE TABLE essay_expression_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  paragraph_number INTEGER NOT NULL,
  sentence_number INTEGER NOT NULL,
  error_text TEXT NOT NULL,               -- the erroneous excerpt
  error_explanation TEXT NOT NULL,         -- why it's wrong
  suggested_correction TEXT NOT NULL,      -- the fix
  debit_value NUMERIC(5,3) NOT NULL,      -- e.g. 0.200 (stored positive, displayed as negative)
  source TEXT NOT NULL DEFAULT 'manual',  -- 'ai', 'manual', 'ai_reviewed'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `essay_structure_analysis` — Structure analysis per paragraph
```sql
CREATE TABLE essay_structure_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  paragraph_number INTEGER NOT NULL,
  paragraph_type TEXT NOT NULL,            -- 'introduction', 'development_1', 'development_2', 'conclusion'
  expected_structure JSONB,                -- from correction_template
  analysis_text TEXT NOT NULL,             -- the analysis
  debit_value NUMERIC(5,3) NOT NULL DEFAULT 0.000,
  source TEXT NOT NULL DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `essay_content_analysis` — Content analysis per criterion
```sql
CREATE TABLE essay_content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  criterion_type TEXT NOT NULL,            -- 'pertinence', 'argumentation', 'informativity'
  criterion_name TEXT NOT NULL,            -- display name
  criterion_description TEXT,
  analysis_text TEXT NOT NULL,
  debit_level TEXT NOT NULL,               -- e.g. "Pertinente", "Leve fuga"
  debit_value NUMERIC(5,3) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `essay_improvement_suggestions` — Suggestions for the student
```sql
CREATE TABLE essay_improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  category TEXT NOT NULL,                  -- 'expression', 'structure', 'content'
  suggestion_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### New columns on `essays` table
```sql
ALTER TABLE essays ADD COLUMN IF NOT EXISTS transcribed_text TEXT;
ALTER TABLE essays ADD COLUMN IF NOT EXISTS correction_template_id UUID REFERENCES correction_templates(id);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS expression_debit_total NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS structure_debit_total NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS content_debit_total NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS final_grade_ciaar NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS ai_correction_raw JSONB;  -- raw AI response for audit
```

#### `ai_provider_configs` — AI provider settings (admin integrations page)
```sql
CREATE TABLE ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,                  -- 'claude', 'openai', 'antigravity', 'dify'
  display_name TEXT NOT NULL,              -- 'Claude (Anthropic)', etc.
  api_key TEXT,                            -- stored plain, protected by RLS (admin-only)
  model_name TEXT,                         -- e.g. 'claude-sonnet-4-5-20250514', 'gpt-4o'
  base_url TEXT,                           -- for custom endpoints
  is_active BOOLEAN DEFAULT false,
  config JSONB,                            -- provider-specific settings
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update trigger
CREATE TRIGGER update_ai_provider_configs_updated_at
  BEFORE UPDATE ON ai_provider_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### RLS Policies

```sql
-- correction_templates: all authenticated can read, only admin/teacher can write
ALTER TABLE correction_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view correction templates" ON correction_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage correction templates" ON correction_templates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- essay_expression_errors: students see own essay's errors, staff see all
ALTER TABLE essay_expression_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own expression errors" ON essay_expression_errors
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_id AND essays.student_id = auth.uid()));
CREATE POLICY "Staff manage all expression errors" ON essay_expression_errors
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- essay_structure_analysis: same pattern
ALTER TABLE essay_structure_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own structure analysis" ON essay_structure_analysis
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_id AND essays.student_id = auth.uid()));
CREATE POLICY "Staff manage all structure analysis" ON essay_structure_analysis
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- essay_content_analysis: same pattern
ALTER TABLE essay_content_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own content analysis" ON essay_content_analysis
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_id AND essays.student_id = auth.uid()));
CREATE POLICY "Staff manage all content analysis" ON essay_content_analysis
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- essay_improvement_suggestions: same pattern
ALTER TABLE essay_improvement_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own suggestions" ON essay_improvement_suggestions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_id AND essays.student_id = auth.uid()));
CREATE POLICY "Staff manage all suggestions" ON essay_improvement_suggestions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- ai_provider_configs: admin-only
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins manage AI providers" ON ai_provider_configs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'));
```

### Grade Calculation Formula

```
final_grade = max_grade - expression_debit_total - structure_debit_total - content_debit_total
```

Rules:
1. `expression_debit_total` = SUM of all `essay_expression_errors.debit_value` for the essay
2. `structure_debit_total` = SUM of all `essay_structure_analysis.debit_value` for the essay
3. `content_debit_total` = SUM of all `essay_content_analysis.debit_value` for the essay
4. **"Fuga TOTAL" override**: if any content criterion has `debit_level = "Fuga TOTAL"` (where `debit` is null in template), `final_grade` is forced to `0.000` regardless of other debits
5. **Floor**: `final_grade` cannot go below `0.000`
6. All debit values stored as positive numbers, displayed with minus sign (e.g. stored `0.200`, shown `-0,200`)

### Essay Status Transitions

```
draft → submitted → correcting → corrected
```

- `draft`: student started but hasn't submitted
- `submitted`: student submitted, awaiting correction
- `correcting`: professor opened correction page OR AI correction is in progress
- `corrected`: professor finalized correction, student can view

### AI Adapter Architecture

```
src/services/ai/
  ├── types.ts                    -- CorrectionRequest, CorrectionResult interfaces
  ├── correctionPrompt.ts         -- CIAAR correction prompt template
  ├── aiCorrectionService.ts      -- main service (picks active provider, calls adapter)
  ├── adapters/
  │   ├── claudeAdapter.ts
  │   ├── openaiAdapter.ts
  │   ├── antigravityAdapter.ts
  │   └── difyAdapter.ts
  └── ocrService.ts               -- OCR transcription via AI vision APIs
```

**Interface:**
```typescript
interface CorrectionRequest {
  essayText: string;
  theme: string;
  correctionTemplate: CorrectionTemplate;
  studentName?: string;
}

interface CorrectionResult {
  expressionErrors: ExpressionError[];
  structureAnalysis: StructureAnalysis[];
  contentAnalysis: ContentAnalysis[];
  improvementSuggestions: ImprovementSuggestion[];
  totalExpressionDebit: number;
  totalStructureDebit: number;
  totalContentDebit: number;
  finalGrade: number;
}

interface AICorrectionAdapter {
  correct(request: CorrectionRequest): Promise<CorrectionResult>;
  transcribe(imageUrls: string[]): Promise<string>;  // OCR — supports multiple pages
}
```

### AI API Key Security

API keys in `ai_provider_configs` are protected by RLS (admin-only read/write). The AI calls are made from the **frontend** via Supabase Edge Functions that:

1. Frontend calls Edge Function `ai-essay-correction` with essay data (no API key)
2. Edge Function reads `ai_provider_configs` using service_role key to get the active provider's API key
3. Edge Function calls the AI provider API
4. Edge Function returns the `CorrectionResult` to the frontend

Edge Functions needed:
- `supabase/functions/ai-essay-correction/index.ts` — handles correction requests
- `supabase/functions/ai-essay-ocr/index.ts` — handles OCR transcription

This ensures API keys never reach the client bundle.

### OCR Flow

1. Student uploads essay image(s) → stored in `essays` storage bucket
2. Professor clicks "Transcrever com IA" on correction page
3. Frontend gets signed URL(s) for the image(s) from Supabase Storage
4. Frontend calls `ai-essay-ocr` Edge Function with signed URLs
5. Edge Function uses the active AI provider's vision API to transcribe
6. Returns transcribed text → professor reviews/edits in a textarea
7. Professor approves → saved as `essays.transcribed_text`
8. Multiple images supported (multi-page handwritten essays) — concatenated in order

### AI Correction Prompt

The CIAAR correction prompt will be stored in `correctionPrompt.ts` and will instruct the AI to:

1. Split the essay into paragraphs
2. Analyze each paragraph's expression errors (grammar, spelling, punctuation, register) with P/Per references
3. Analyze structure per paragraph against expected patterns (3 periods, connectives)
4. Analyze content (pertinence, argumentation, informativity) with debit levels
5. Calculate total debits and final grade
6. Generate improvement suggestions per category
7. Return structured JSON matching `CorrectionResult`

The prompt includes the `correction_template` data (expected structures, connectives, debit values) so it's fully configurable per exam board.

### User Flows

#### Flow 1: Student Submits Essay

1. Student navigates to `/redacoes/nova`
2. Selects theme (from assigned themes or "free submission")
3. Either types text OR uploads photo/scan (multiple images allowed)
4. Submits → status = `submitted`

#### Flow 2: Professor Corrects Essay

1. Professor opens essay in correction page → status set to `correcting`
2. **If uploaded image**: system shows image + "Transcrever com IA" button
   - Calls `ai-essay-ocr` Edge Function with signed URLs
   - AI transcribes handwritten text → professor reviews/edits transcription
   - Professor approves transcription → saved as `transcribed_text`
3. Professor clicks **"Corrigir com IA"**
   - Calls `ai-essay-correction` Edge Function
   - AI returns complete `CorrectionResult`
   - Results displayed in review panel with 3 tabs: Expressão / Estrutura / Conteúdo
4. **Review panel** for each section:
   - Expression: list of errors, each can be accepted/edited/rejected
   - Structure: analysis per paragraph, can edit text and debit
   - Content: each criterion with selected level and analysis, can change level
5. Professor adjusts anything needed
6. Clicks **"Finalizar Correção"** → debits summed, grade calculated, saved, status = `corrected`
7. Student notified

#### Flow 3: Student Views Correction

1. Student opens essay → system checks if CIAAR correction data exists
2. **If CIAAR data**: shows interactive correction view with 4 tabs
   - **Tab Expressão**: essay text with highlighted errors, click to expand explanation
   - **Tab Estrutura**: paragraph-by-paragraph analysis with expected vs actual
   - **Tab Conteúdo**: criteria cards with debit levels and analysis
   - **Tab Nota + Sugestões**: grade breakdown (Expression/Structure/Content debits) + suggestions
3. **If legacy data only**: shows old format (annotations + competency scores)
4. **Button "Baixar PDF"**: downloads complete correction report matching current manual format

#### Flow 4: Admin Configures System

1. `/admin/essays/settings` → manage correction templates (CIAAR, future boards)
2. `/admin/integrations` → configure AI providers (API keys, select active provider, test connection)

### Pages (new or modified)

| Page | Action | Key Changes |
|------|--------|-------------|
| `AdminEssayCorrectionPage` | **Major rewrite** | New 3-tab review panel, AI correction button, OCR transcription, status transitions |
| `EssayDetails` / `EssayReportPage` | **Major rewrite** | New interactive 4-tab view with legacy fallback |
| `AdminEssaySettingsPage` | **Extend** | Add correction template CRUD (replace criteria templates) |
| `EssaySubmission` | **Minor** | Support multiple image uploads |
| Admin Integrations | **Extend** | Add AI provider configuration section |
| New: `EssayPDFReport` | **New component** | PDF generation matching current manual format |

### PDF Report

Uses `@react-pdf/renderer` (~500KB gzipped) to generate a PDF matching the current Folha de Correção format:
- Page 1: Header (Everest logo), student name, theme, essay text by paragraphs
- Page 2-3: Erros de Expressão (per paragraph with P/Per references)
- Page 3-4: Erros de Estrutura (table: paragraph | expected | analysis | debit)
- Page 5: Erros de Conteúdo (pertinence, argumentation, informativity with levels)
- Page 6: Cálculo Final (debit totals + final grade)
- Page 7: Sugestões para Melhoria (per category)
- Footer: Avaliador name

### New Dependencies

- `@react-pdf/renderer` — PDF generation (~500KB gzipped)
- No new AI SDK dependencies — Edge Functions use `fetch()` directly to call provider APIs

### Security

- AI API keys in `ai_provider_configs` protected by admin-only RLS, accessed only by Edge Functions via service_role
- AI calls made server-side via Supabase Edge Functions (never from client)
- RLS on all new tables (see RLS Policies section above)
- OCR images accessed via time-limited signed URLs from Supabase Storage

### What stays the same

- Essay submission flow (text + file upload)
- Storage bucket for essay files
- Essay prompts system (themes assigned to classes)
- Basic essay listing pages
- Notification system
- Old essays with legacy corrections remain viewable

### Out of scope (future)

- Real-time collaborative correction
- Student self-assessment before submission
- Comparison reports across multiple essays
- Batch AI correction (multiple essays at once)
