-- =====================================================
-- MIGRATION 005: Sistema de Trial/Degustação
-- =====================================================
-- Adiciona funcionalidades para limitar acesso de usuários trial
-- e controlar quais conteúdos específicos eles podem acessar

-- 1. Adicionar colunas de limite trial na tabela classes
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS trial_duration_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS trial_flashcard_limit_per_day INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS trial_quiz_limit_per_day INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS trial_essay_submission_limit INTEGER DEFAULT 0;

COMMENT ON COLUMN classes.trial_duration_days IS 'Duração do período trial em dias (padrão: 7)';
COMMENT ON COLUMN classes.trial_flashcard_limit_per_day IS 'Limite de flashcards que um usuário trial pode revisar por dia';
COMMENT ON COLUMN classes.trial_quiz_limit_per_day IS 'Limite de quizzes que um usuário trial pode fazer por dia';
COMMENT ON COLUMN classes.trial_essay_submission_limit IS 'Limite total de redações que um usuário trial pode submeter';

-- 2. Criar tabela para conteúdo liberado em trial
CREATE TABLE IF NOT EXISTS trial_allowed_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('subject', 'topic', 'quiz', 'flashcard_set', 'lesson')),
  content_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, content_type, content_id)
);

COMMENT ON TABLE trial_allowed_content IS 'Controla quais conteúdos específicos estão liberados para cada turma trial';
COMMENT ON COLUMN trial_allowed_content.content_type IS 'Tipo de conteúdo: subject (matéria), topic (tópico), quiz, flashcard_set, lesson';
COMMENT ON COLUMN trial_allowed_content.content_id IS 'ID do conteúdo específico (UUID da tabela correspondente)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trial_content_class ON trial_allowed_content(class_id);
CREATE INDEX IF NOT EXISTS idx_trial_content_type ON trial_allowed_content(content_type);
CREATE INDEX IF NOT EXISTS idx_trial_content_composite ON trial_allowed_content(class_id, content_type);

-- 3. Atualizar trigger para updated_at
CREATE OR REPLACE FUNCTION update_trial_allowed_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trial_allowed_content_updated_at ON trial_allowed_content;
CREATE TRIGGER trigger_update_trial_allowed_content_updated_at
  BEFORE UPDATE ON trial_allowed_content
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_allowed_content_updated_at();

-- 4. Criar turma de Degustação padrão (exemplo)
-- NOTA: Execute apenas uma vez, ou ajuste o INSERT conforme necessário

INSERT INTO classes (
  name,
  description,
  class_type,
  start_date,
  trial_duration_days,
  trial_flashcard_limit_per_day,
  trial_quiz_limit_per_day,
  trial_essay_submission_limit
) VALUES (
  'Degustação Everest',
  'Turma especial para leads experimentarem a plataforma com conteúdo limitado',
  'trial',
  NOW(),
  7,  -- 7 dias de trial
  10, -- 10 flashcards por dia
  1,  -- 1 quiz por dia
  0   -- Sem redações
) ON CONFLICT DO NOTHING;

-- 5. Criar políticas RLS para trial_allowed_content

-- Admins podem fazer tudo
CREATE POLICY "Admins podem gerenciar conteúdo trial"
  ON trial_allowed_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

-- Usuários podem ver conteúdo liberado para suas turmas
CREATE POLICY "Usuários podem ver conteúdo liberado para suas turmas"
  ON trial_allowed_content
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_classes
      WHERE student_classes.user_id = auth.uid()
      AND student_classes.class_id = trial_allowed_content.class_id
    )
  );

-- 6. Função auxiliar para verificar se usuário é trial
CREATE OR REPLACE FUNCTION is_trial_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM student_classes sc
    JOIN classes c ON c.id = sc.class_id
    WHERE sc.user_id = $1
    AND c.class_type = 'trial'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para obter conteúdo liberado para um usuário trial
CREATE OR REPLACE FUNCTION get_trial_allowed_content_for_user(user_id UUID)
RETURNS TABLE (
  content_type TEXT,
  content_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tac.content_type,
    tac.content_id
  FROM trial_allowed_content tac
  JOIN student_classes sc ON sc.class_id = tac.class_id
  JOIN classes c ON c.id = sc.class_id
  WHERE sc.user_id = $1
  AND c.class_type = 'trial';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. View para estatísticas de trial
CREATE OR REPLACE VIEW trial_user_stats AS
SELECT
  sc.user_id,
  u.email,
  u.first_name,
  u.last_name,
  c.name AS class_name,
  sc.enrollment_date,
  c.trial_duration_days,
  EXTRACT(DAY FROM (NOW() - sc.enrollment_date)) AS days_since_enrollment,
  (c.trial_duration_days - EXTRACT(DAY FROM (NOW() - sc.enrollment_date))) AS days_remaining,
  CASE
    WHEN EXTRACT(DAY FROM (NOW() - sc.enrollment_date)) > c.trial_duration_days
    THEN 'expired'
    ELSE 'active'
  END AS trial_status
FROM student_classes sc
JOIN classes c ON c.id = sc.class_id AND c.class_type = 'trial'
JOIN users u ON u.id = sc.user_id;

COMMENT ON VIEW trial_user_stats IS 'Estatísticas de usuários em período trial';

-- =====================================================
-- EXEMPLO DE USO:
-- =====================================================

-- Exemplo 1: Liberar matéria de Português para trial
-- Assumindo que você tem o ID da matéria de Português e da turma Degustação

-- INSERT INTO trial_allowed_content (class_id, content_type, content_id)
-- SELECT
--   (SELECT id FROM classes WHERE name = 'Degustação Everest' AND class_type = 'trial' LIMIT 1),
--   'subject',
--   (SELECT id FROM subjects WHERE name = 'Português' LIMIT 1)
-- WHERE NOT EXISTS (
--   SELECT 1 FROM trial_allowed_content
--   WHERE class_id = (SELECT id FROM classes WHERE name = 'Degustação Everest' LIMIT 1)
--   AND content_type = 'subject'
--   AND content_id = (SELECT id FROM subjects WHERE name = 'Português' LIMIT 1)
-- );

-- Exemplo 2: Liberar tópico específico (Acentuação Gráfica)
-- INSERT INTO trial_allowed_content (class_id, content_type, content_id)
-- VALUES (
--   'UUID_DA_TURMA_DEGUSTACAO',
--   'topic',
--   'UUID_DO_TOPICO_ACENTUACAO'
-- );

-- Exemplo 3: Liberar 1 quiz específico
-- INSERT INTO trial_allowed_content (class_id, content_type, content_id)
-- VALUES (
--   'UUID_DA_TURMA_DEGUSTACAO',
--   'quiz',
--   'UUID_DO_QUIZ'
-- );

-- =====================================================
-- ROLLBACK (caso necessário)
-- =====================================================

-- DROP VIEW IF EXISTS trial_user_stats;
-- DROP FUNCTION IF EXISTS get_trial_allowed_content_for_user(UUID);
-- DROP FUNCTION IF EXISTS is_trial_user(UUID);
-- DROP POLICY IF EXISTS "Admins podem gerenciar conteúdo trial" ON trial_allowed_content;
-- DROP POLICY IF EXISTS "Usuários podem ver conteúdo liberado para suas turmas" ON trial_allowed_content;
-- DROP TABLE IF EXISTS trial_allowed_content;
-- ALTER TABLE classes
--   DROP COLUMN IF EXISTS trial_duration_days,
--   DROP COLUMN IF EXISTS trial_flashcard_limit_per_day,
--   DROP COLUMN IF EXISTS trial_quiz_limit_per_day,
--   DROP COLUMN IF EXISTS trial_essay_submission_limit;
