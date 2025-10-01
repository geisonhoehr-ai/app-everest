-- =====================================================
-- 🚀 EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR
-- =====================================================
-- Este script cria TUDO que está faltando no banco:
-- ✅ Coluna status em classes
-- ✅ Tabela teachers
-- ✅ Colunas trial em classes
-- ✅ Tabela trial_allowed_content
-- ✅ VIEW class_stats
-- ✅ Políticas RLS
-- ✅ Triggers automáticos
-- =====================================================

-- =====================================================
-- PARTE 1: EXTENSÕES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PARTE 2: TABELA CLASSES - Adicionar colunas faltantes
-- =====================================================

-- Adicionar coluna status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'status'
  ) THEN
    ALTER TABLE classes ADD COLUMN status TEXT DEFAULT 'active';
    RAISE NOTICE '✅ Coluna status adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna status já existe';
  END IF;
END $$;

-- Adicionar constraint de status
DO $$
BEGIN
  ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_status_check;
  ALTER TABLE classes ADD CONSTRAINT classes_status_check CHECK (status IN ('active', 'inactive', 'archived'));
  RAISE NOTICE '✅ Constraint de status adicionada';
END $$;

-- Atualizar turmas existentes
UPDATE classes SET status = 'active' WHERE status IS NULL;
ALTER TABLE classes ALTER COLUMN status SET NOT NULL;
ALTER TABLE classes ALTER COLUMN status SET DEFAULT 'active';

-- Adicionar colunas de trial
ALTER TABLE classes ADD COLUMN IF NOT EXISTS trial_duration_days INTEGER DEFAULT 7;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS trial_flashcard_limit_per_day INTEGER DEFAULT 10;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS trial_quiz_limit_per_day INTEGER DEFAULT 1;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS trial_essay_submission_limit INTEGER DEFAULT 0;

-- Garantir que class_type não seja NULL
UPDATE classes SET class_type = 'standard' WHERE class_type IS NULL;
ALTER TABLE classes ALTER COLUMN class_type SET NOT NULL;
ALTER TABLE classes ALTER COLUMN class_type SET DEFAULT 'standard';

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

RAISE NOTICE '✅ Tabela classes atualizada';

-- =====================================================
-- PARTE 3: TABELA TEACHERS
-- =====================================================

-- Criar tabela teachers
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id_number TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT teachers_user_id_unique UNIQUE(user_id)
);

-- Remover constraint antiga de UNIQUE em employee_id se existir
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_employee_id_number_key;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_teachers_updated_at ON teachers;
CREATE TRIGGER trigger_update_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_teachers_updated_at();

-- Popular tabela teachers com usuários existentes
INSERT INTO teachers (user_id, employee_id_number)
SELECT
  u.id,
  COALESCE(u.employee_id_number, 'EMP-' || SUBSTRING(u.id::text, 1, 8))
FROM users u
WHERE u.role IN ('teacher', 'administrator')
ON CONFLICT (user_id) DO NOTHING;

RAISE NOTICE '✅ Tabela teachers criada e populada';

-- =====================================================
-- PARTE 4: POLÍTICAS RLS PARA TEACHERS
-- =====================================================

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins podem gerenciar professores" ON teachers;
DROP POLICY IF EXISTS "Professores podem ver seus dados" ON teachers;
DROP POLICY IF EXISTS "Professores podem atualizar seus dados" ON teachers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON teachers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON teachers;
DROP POLICY IF EXISTS "Enable update for users based on id" ON teachers;
DROP POLICY IF EXISTS "teachers_select_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_insert_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_update_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_delete_policy" ON teachers;

-- Criar políticas novas
CREATE POLICY "teachers_select_policy"
  ON teachers FOR SELECT TO authenticated
  USING (true); -- Todos podem ver professores

CREATE POLICY "teachers_insert_policy"
  ON teachers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

CREATE POLICY "teachers_update_policy"
  ON teachers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "teachers_delete_policy"
  ON teachers FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

RAISE NOTICE '✅ Políticas RLS para teachers configuradas';

-- =====================================================
-- PARTE 5: TRIGGER AUTOMÁTICO PARA CRIAR TEACHER
-- =====================================================

CREATE OR REPLACE FUNCTION create_teacher_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('teacher', 'administrator') THEN
    INSERT INTO teachers (user_id, employee_id_number)
    VALUES (NEW.id, COALESCE(NEW.employee_id_number, 'EMP-' || SUBSTRING(NEW.id::text, 1, 8)))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_teacher_on_user_insert ON users;
CREATE TRIGGER trigger_create_teacher_on_user_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_teacher_on_user_insert();

RAISE NOTICE '✅ Trigger automático criado';

-- =====================================================
-- PARTE 6: TABELA TRIAL_ALLOWED_CONTENT
-- =====================================================

CREATE TABLE IF NOT EXISTS trial_allowed_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('subject', 'topic', 'quiz', 'flashcard_set', 'lesson')),
  content_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT trial_allowed_content_unique UNIQUE(class_id, content_type, content_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trial_content_class ON trial_allowed_content(class_id);
CREATE INDEX IF NOT EXISTS idx_trial_content_type ON trial_allowed_content(content_type);
CREATE INDEX IF NOT EXISTS idx_trial_content_composite ON trial_allowed_content(class_id, content_type);

-- Trigger para updated_at
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

RAISE NOTICE '✅ Tabela trial_allowed_content criada';

-- =====================================================
-- PARTE 7: POLÍTICAS RLS PARA TRIAL_ALLOWED_CONTENT
-- =====================================================

ALTER TABLE trial_allowed_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem gerenciar conteúdo trial" ON trial_allowed_content;
DROP POLICY IF EXISTS "Usuários podem ver conteúdo liberado para suas turmas" ON trial_allowed_content;

CREATE POLICY "Admins podem gerenciar conteúdo trial"
  ON trial_allowed_content FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

CREATE POLICY "Usuários podem ver conteúdo liberado para suas turmas"
  ON trial_allowed_content FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_classes
      WHERE student_classes.user_id = auth.uid()
      AND student_classes.class_id = trial_allowed_content.class_id
    )
  );

RAISE NOTICE '✅ Políticas RLS para trial_allowed_content configuradas';

-- =====================================================
-- PARTE 8: VIEW CLASS_STATS
-- =====================================================

DROP VIEW IF EXISTS class_stats;

CREATE VIEW class_stats AS
SELECT
  c.id,
  c.name,
  c.description,
  c.teacher_id,
  c.start_date,
  c.end_date,
  c.status,
  c.class_type,
  c.created_at,
  c.updated_at,
  c.trial_duration_days,
  c.trial_flashcard_limit_per_day,
  c.trial_quiz_limit_per_day,
  c.trial_essay_submission_limit,
  COALESCE(COUNT(DISTINCT sc.user_id), 0) as student_count,
  COALESCE(COUNT(DISTINCT cfp.id), 0) as enabled_features_count
FROM classes c
LEFT JOIN student_classes sc ON sc.class_id = c.id
LEFT JOIN class_feature_permissions cfp ON cfp.class_id = c.id
GROUP BY
  c.id, c.name, c.description, c.teacher_id, c.start_date, c.end_date,
  c.status, c.class_type, c.created_at, c.updated_at,
  c.trial_duration_days, c.trial_flashcard_limit_per_day,
  c.trial_quiz_limit_per_day, c.trial_essay_submission_limit;

-- Permissões na view
GRANT SELECT ON class_stats TO authenticated;
GRANT SELECT ON class_stats TO anon;

RAISE NOTICE '✅ View class_stats criada';

-- =====================================================
-- PARTE 9: POLÍTICAS RLS PARA CLASSES
-- =====================================================

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON classes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON classes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON classes;
DROP POLICY IF EXISTS "classes_select_policy" ON classes;
DROP POLICY IF EXISTS "classes_insert_policy" ON classes;
DROP POLICY IF EXISTS "classes_update_policy" ON classes;
DROP POLICY IF EXISTS "classes_delete_policy" ON classes;

-- Criar políticas
CREATE POLICY "classes_select_policy"
  ON classes FOR SELECT TO authenticated
  USING (true); -- Todos podem ver turmas

CREATE POLICY "classes_insert_policy"
  ON classes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('administrator', 'teacher')
    )
  );

CREATE POLICY "classes_update_policy"
  ON classes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
    OR
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.id = classes.teacher_id
      AND teachers.user_id = auth.uid()
    )
  );

CREATE POLICY "classes_delete_policy"
  ON classes FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

RAISE NOTICE '✅ Políticas RLS para classes configuradas';

-- =====================================================
-- PARTE 10: FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar se usuário é trial
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

-- Função para obter conteúdo liberado para trial
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

RAISE NOTICE '✅ Funções auxiliares criadas';

-- =====================================================
-- PARTE 11: NOTIFICAR POSTGREST
-- =====================================================

NOTIFY pgrst, 'reload schema';

-- =====================================================
-- PARTE 12: VERIFICAÇÕES FINAIS
-- =====================================================

DO $$
DECLARE
  v_status_exists BOOLEAN;
  v_teachers_exists BOOLEAN;
  v_trial_content_exists BOOLEAN;
  v_class_stats_exists BOOLEAN;
  v_teachers_count INTEGER;
BEGIN
  -- Verificar coluna status
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'status'
  ) INTO v_status_exists;

  -- Verificar tabela teachers
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'teachers'
  ) INTO v_teachers_exists;

  -- Verificar tabela trial_allowed_content
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'trial_allowed_content'
  ) INTO v_trial_content_exists;

  -- Verificar view class_stats
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'class_stats'
  ) INTO v_class_stats_exists;

  -- Contar professores
  SELECT COUNT(*) FROM teachers INTO v_teachers_count;

  -- Exibir resultados
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ VERIFICAÇÃO FINAL';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Coluna status em classes: %', CASE WHEN v_status_exists THEN '✅ OK' ELSE '❌ FALTA' END;
  RAISE NOTICE 'Tabela teachers: %', CASE WHEN v_teachers_exists THEN '✅ OK' ELSE '❌ FALTA' END;
  RAISE NOTICE 'Tabela trial_allowed_content: %', CASE WHEN v_trial_content_exists THEN '✅ OK' ELSE '❌ FALTA' END;
  RAISE NOTICE 'View class_stats: %', CASE WHEN v_class_stats_exists THEN '✅ OK' ELSE '❌ FALTA' END;
  RAISE NOTICE 'Total de professores: %', v_teachers_count;
  RAISE NOTICE '==========================================';
  RAISE NOTICE '🎉 SCRIPT EXECUTADO COM SUCESSO!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '📝 Próximos passos:';
  RAISE NOTICE '1. Recarregue a página do painel admin (F5)';
  RAISE NOTICE '2. Tente criar uma turma novamente';
  RAISE NOTICE '==========================================';
END $$;

-- =====================================================
-- 🎉 CONCLUÍDO!
-- =====================================================
