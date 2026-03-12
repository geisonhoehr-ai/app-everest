-- ============================================================
-- CIAAR Correction System Migration
-- ============================================================

-- 1. correction_templates
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

-- 2. essay_expression_errors
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

-- 3. essay_structure_analysis
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

-- 4. essay_content_analysis
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

-- 5. essay_improvement_suggestions
CREATE TABLE IF NOT EXISTS essay_improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ai_provider_configs
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

-- 7. New columns on essays table
ALTER TABLE essays ADD COLUMN IF NOT EXISTS transcribed_text TEXT;
ALTER TABLE essays ADD COLUMN IF NOT EXISTS correction_template_id UUID REFERENCES correction_templates(id);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS expression_debit_total NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS structure_debit_total NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS content_debit_total NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS final_grade_ciaar NUMERIC(6,3);
ALTER TABLE essays ADD COLUMN IF NOT EXISTS ai_correction_raw JSONB;

-- 8. RLS Policies

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

-- ai_provider_configs (admin only)
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins manage AI providers" ON ai_provider_configs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'));

-- 9. Seed default CIAAR correction template
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
