-- ============================================================
-- Multi-Exam Correction System (CIAAR + ENEM support)
-- ============================================================

-- 1. Add correction_type to correction_templates and widen max_grade for ENEM (0-1000)
ALTER TABLE correction_templates ADD COLUMN IF NOT EXISTS correction_type TEXT NOT NULL DEFAULT 'ciaar';
ALTER TABLE correction_templates ALTER COLUMN max_grade TYPE NUMERIC(8,3);

-- 2. Add correction_type and ENEM grade to essays
ALTER TABLE essays ADD COLUMN IF NOT EXISTS correction_type TEXT DEFAULT 'ciaar';
ALTER TABLE essays ADD COLUMN IF NOT EXISTS final_grade_enem NUMERIC(6,1);

-- 3. Create essay_competency_scores table (for ENEM and other additive formats)
CREATE TABLE IF NOT EXISTS essay_competency_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  competency_number INTEGER NOT NULL,
  competency_name TEXT NOT NULL,
  score NUMERIC(6,1) NOT NULL DEFAULT 0,
  max_score NUMERIC(6,1) NOT NULL DEFAULT 200,
  justification TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS for essay_competency_scores
ALTER TABLE essay_competency_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own competency scores" ON essay_competency_scores
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_id AND essays.student_id = auth.uid()));

CREATE POLICY "Staff manage all competency scores" ON essay_competency_scores
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_essay_competency_scores_essay_id ON essay_competency_scores(essay_id);
CREATE INDEX IF NOT EXISTS idx_essays_correction_type ON essays(correction_type);

-- 6. Seed ENEM correction template
INSERT INTO correction_templates (name, description, correction_type, expression_debit_value, max_grade, structure_criteria, content_criteria, is_default)
VALUES (
  'ENEM 2025',
  'Modelo de correção ENEM - 5 competências, nota de 0 a 1000',
  'enem',
  0,
  1000,
  '{}'::jsonb,
  '{
    "competencies": [
      {
        "number": 1,
        "name": "Domínio da modalidade escrita formal",
        "description": "Demonstrar domínio da modalidade escrita formal da língua portuguesa.",
        "max_score": 200,
        "levels": [
          { "score": 0, "label": "Desconhecimento da modalidade escrita formal" },
          { "score": 40, "label": "Domínio precário da modalidade escrita formal" },
          { "score": 80, "label": "Domínio insuficiente da modalidade escrita formal" },
          { "score": 120, "label": "Domínio mediano da modalidade escrita formal" },
          { "score": 160, "label": "Bom domínio da modalidade escrita formal" },
          { "score": 200, "label": "Excelente domínio da modalidade escrita formal" }
        ]
      },
      {
        "number": 2,
        "name": "Compreensão da proposta",
        "description": "Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento para desenvolver o tema, dentro dos limites estruturais do texto dissertativo-argumentativo em prosa.",
        "max_score": 200,
        "levels": [
          { "score": 0, "label": "Fuga ao tema / não atende ao tipo textual" },
          { "score": 40, "label": "Tangenciamento do tema" },
          { "score": 80, "label": "Desenvolvimento do tema com muitas limitações" },
          { "score": 120, "label": "Desenvolvimento mediano do tema" },
          { "score": 160, "label": "Bom desenvolvimento do tema" },
          { "score": 200, "label": "Excelente desenvolvimento do tema" }
        ]
      },
      {
        "number": 3,
        "name": "Seleção e organização de argumentos",
        "description": "Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista.",
        "max_score": 200,
        "levels": [
          { "score": 0, "label": "Informações, fatos e opiniões não relacionados ao tema" },
          { "score": 40, "label": "Informações, fatos e opiniões pouco relacionados ao tema" },
          { "score": 80, "label": "Argumentação insuficiente" },
          { "score": 120, "label": "Argumentação mediana" },
          { "score": 160, "label": "Boa argumentação" },
          { "score": 200, "label": "Excelente argumentação" }
        ]
      },
      {
        "number": 4,
        "name": "Mecanismos linguísticos",
        "description": "Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação.",
        "max_score": 200,
        "levels": [
          { "score": 0, "label": "Não articula as partes do texto" },
          { "score": 40, "label": "Articulação precária das partes do texto" },
          { "score": 80, "label": "Articulação insuficiente" },
          { "score": 120, "label": "Articulação mediana" },
          { "score": 160, "label": "Boa articulação" },
          { "score": 200, "label": "Excelente articulação" }
        ]
      },
      {
        "number": 5,
        "name": "Proposta de intervenção",
        "description": "Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.",
        "max_score": 200,
        "levels": [
          { "score": 0, "label": "Não apresenta proposta de intervenção / fere os direitos humanos" },
          { "score": 40, "label": "Proposta vaga, precária ou apenas citada" },
          { "score": 80, "label": "Proposta insuficiente" },
          { "score": 120, "label": "Proposta mediana" },
          { "score": 160, "label": "Boa proposta de intervenção" },
          { "score": 200, "label": "Excelente proposta de intervenção, detalhada e articulada" }
        ]
      }
    ],
    "zero_conditions": [
      "Fuga total ao tema",
      "Não atendimento ao tipo textual (dissertativo-argumentativo)",
      "Texto com até 7 linhas",
      "Cópia integral de texto(s) motivador(es)",
      "Desrespeito aos direitos humanos",
      "Folha de redação em branco",
      "Texto ilegível"
    ]
  }'::jsonb,
  false
);
