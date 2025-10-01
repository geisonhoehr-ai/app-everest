-- =====================================================
-- FIX: Corrigir TODOS os problemas da gestão de turmas
-- =====================================================
-- Este script resolve:
-- 1. Coluna 'status' faltando em classes (Erro 400/PGRST204)
-- 2. Tabela 'teachers' com RLS incorreto (Erro 406)
-- 3. VIEW 'class_stats' não existente (Erro 404)

-- =====================================================
-- PARTE 1: Corrigir tabela CLASSES
-- =====================================================

-- Adicionar coluna status se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'status'
  ) THEN
    ALTER TABLE classes ADD COLUMN status TEXT DEFAULT 'active';
    ALTER TABLE classes ADD CONSTRAINT classes_status_check CHECK (status IN ('active', 'inactive', 'archived'));
  END IF;
END $$;

COMMENT ON COLUMN classes.status IS 'Status da turma: active (ativa), inactive (inativa), archived (arquivada)';

-- Atualizar turmas existentes
UPDATE classes SET status = 'active' WHERE status IS NULL;

-- Tornar NOT NULL
ALTER TABLE classes ALTER COLUMN status SET NOT NULL;
ALTER TABLE classes ALTER COLUMN status SET DEFAULT 'active';

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

-- Tornar class_type NOT NULL com padrão 'standard'
DO $$
BEGIN
  UPDATE classes SET class_type = 'standard' WHERE class_type IS NULL;
  ALTER TABLE classes ALTER COLUMN class_type SET NOT NULL;
  ALTER TABLE classes ALTER COLUMN class_type SET DEFAULT 'standard';
END $$;

-- =====================================================
-- PARTE 2: Corrigir tabela TEACHERS
-- =====================================================

-- Criar tabela teachers se não existir
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id_number TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Remover constraint de UNIQUE em employee_id_number se existir (pode dar conflito)
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_employee_id_number_key;

COMMENT ON TABLE teachers IS 'Informações adicionais de professores';

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

-- Criar trigger para updated_at
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

-- =====================================================
-- PARTE 3: POLÍTICAS RLS CORRETAS (resolver erro 406)
-- =====================================================

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Remover todas as políticas antigas
DROP POLICY IF EXISTS "Admins podem gerenciar professores" ON teachers;
DROP POLICY IF EXISTS "Professores podem ver seus dados" ON teachers;
DROP POLICY IF EXISTS "Professores podem atualizar seus dados" ON teachers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON teachers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON teachers;
DROP POLICY IF EXISTS "Enable update for users based on id" ON teachers;

-- POLÍTICA 1: Admins e o próprio professor podem ler
CREATE POLICY "teachers_select_policy"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (
    -- Admin pode ver tudo
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
    OR
    -- Professor pode ver seus próprios dados
    user_id = auth.uid()
    OR
    -- Outros usuários autenticados podem ver dados básicos dos professores
    true
  );

-- POLÍTICA 2: Admins podem inserir
CREATE POLICY "teachers_insert_policy"
  ON teachers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

-- POLÍTICA 3: Admins e o próprio professor podem atualizar
CREATE POLICY "teachers_update_policy"
  ON teachers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
    OR
    user_id = auth.uid()
  );

-- POLÍTICA 4: Apenas admins podem deletar
CREATE POLICY "teachers_delete_policy"
  ON teachers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

-- =====================================================
-- PARTE 4: Popular tabela TEACHERS
-- =====================================================

-- Criar registros teacher para TODOS os usuários com role teacher ou administrator
INSERT INTO teachers (user_id, employee_id_number)
SELECT
  u.id,
  COALESCE(u.employee_id_number, 'EMP-' || SUBSTRING(u.id::text, 1, 8))
FROM users u
WHERE u.role IN ('teacher', 'administrator')
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- PARTE 5: Trigger automático para criar TEACHER
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

-- =====================================================
-- PARTE 6: Criar VIEW class_stats (resolver erro 404)
-- =====================================================

DROP VIEW IF EXISTS class_stats;

CREATE OR REPLACE VIEW class_stats AS
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
  COUNT(DISTINCT sc.user_id) as student_count,
  COUNT(DISTINCT cfp.id) as enabled_features_count
FROM classes c
LEFT JOIN student_classes sc ON sc.class_id = c.id
LEFT JOIN class_feature_permissions cfp ON cfp.class_id = c.id
GROUP BY c.id, c.name, c.description, c.teacher_id, c.start_date, c.end_date,
         c.status, c.class_type, c.created_at, c.updated_at,
         c.trial_duration_days, c.trial_flashcard_limit_per_day,
         c.trial_quiz_limit_per_day, c.trial_essay_submission_limit;

COMMENT ON VIEW class_stats IS 'View com estatísticas agregadas de turmas';

-- Dar permissão para usuários autenticados lerem a view
GRANT SELECT ON class_stats TO authenticated;

-- =====================================================
-- PARTE 7: Garantir políticas RLS em CLASSES
-- =====================================================

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON classes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON classes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON classes;

-- POLÍTICA: Todos os usuários autenticados podem ler turmas
CREATE POLICY "classes_select_policy"
  ON classes
  FOR SELECT
  TO authenticated
  USING (true);

-- POLÍTICA: Admins e professores podem inserir
CREATE POLICY "classes_insert_policy"
  ON classes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('administrator', 'teacher')
    )
  );

-- POLÍTICA: Admins e o professor da turma podem atualizar
CREATE POLICY "classes_update_policy"
  ON classes
  FOR UPDATE
  TO authenticated
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

-- POLÍTICA: Apenas admins podem deletar
CREATE POLICY "classes_delete_policy"
  ON classes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

-- =====================================================
-- PARTE 8: REFRESH SCHEMA CACHE do PostgREST
-- =====================================================

-- Notificar PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- 1. Verificar coluna status
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'classes' AND column_name = 'status';

-- 2. Verificar tabela teachers
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'teachers';

-- 3. Contar professores
SELECT COUNT(*) as total_teachers FROM teachers;

-- 4. Verificar view class_stats
SELECT table_name
FROM information_schema.views
WHERE table_name = 'class_stats';

-- 5. Testar consulta em class_stats
SELECT id, name, status, class_type, student_count, enabled_features_count
FROM class_stats
ORDER BY created_at DESC
LIMIT 5;

-- 6. Verificar políticas RLS
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('classes', 'teachers')
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ CONCLUÍDO!
-- =====================================================
-- Após executar este script:
-- 1. Recarregue a página do painel admin (F5)
-- 2. Tente criar uma turma novamente
-- 3. Deve funcionar sem erros!
-- =====================================================
