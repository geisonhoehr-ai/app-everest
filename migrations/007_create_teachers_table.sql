-- =====================================================
-- MIGRATION 007: Criar tabela teachers
-- =====================================================
-- A tabela teachers pode não existir, então vamos criá-la

-- 1. Criar tabela teachers (se não existir)
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id_number TEXT UNIQUE,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

COMMENT ON TABLE teachers IS 'Informações adicionais de professores';
COMMENT ON COLUMN teachers.employee_id_number IS 'Número de matrícula do professor';
COMMENT ON COLUMN teachers.specialization IS 'Especialização do professor';

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_employee_id ON teachers(employee_id_number);

-- 3. Criar trigger para updated_at
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

-- 4. Políticas RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Admins podem tudo
DROP POLICY IF EXISTS "Admins podem gerenciar professores" ON teachers;
CREATE POLICY "Admins podem gerenciar professores"
  ON teachers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

-- Professores podem ver seus próprios dados
DROP POLICY IF EXISTS "Professores podem ver seus dados" ON teachers;
CREATE POLICY "Professores podem ver seus dados"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Professores podem atualizar seus próprios dados
DROP POLICY IF EXISTS "Professores podem atualizar seus dados" ON teachers;
CREATE POLICY "Professores podem atualizar seus dados"
  ON teachers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Popular automaticamente a tabela teachers com usuários existentes que são professores
INSERT INTO teachers (user_id, employee_id_number)
SELECT
  id,
  COALESCE(employee_id_number, 'PROF-' || SUBSTRING(id::text, 1, 8))
FROM users
WHERE role = 'teacher'
ON CONFLICT (user_id) DO NOTHING;

-- 6. Criar função para criar registro teacher automaticamente quando um user com role teacher é criado
CREATE OR REPLACE FUNCTION create_teacher_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'teacher' THEN
    INSERT INTO teachers (user_id, employee_id_number)
    VALUES (NEW.id, COALESCE(NEW.employee_id_number, 'PROF-' || SUBSTRING(NEW.id::text, 1, 8)))
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
-- ROLLBACK (caso necessário)
-- =====================================================
-- DROP TRIGGER IF EXISTS trigger_create_teacher_on_user_insert ON users;
-- DROP FUNCTION IF EXISTS create_teacher_on_user_insert();
-- DROP POLICY IF EXISTS "Admins podem gerenciar professores" ON teachers;
-- DROP POLICY IF EXISTS "Professores podem ver seus dados" ON teachers;
-- DROP POLICY IF EXISTS "Professores podem atualizar seus dados" ON teachers;
-- DROP TABLE IF EXISTS teachers;
