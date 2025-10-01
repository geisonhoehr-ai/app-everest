-- =====================================================
-- FIX: Corrigir estrutura de classes e teachers
-- =====================================================
-- Este script corrige os erros:
-- 1. Coluna 'status' faltando em classes
-- 2. Tabela 'teachers' faltando
-- 3. Políticas RLS necessárias

-- =====================================================
-- PARTE 1: Adicionar coluna status à tabela classes
-- =====================================================

-- Adicionar coluna status
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));

COMMENT ON COLUMN classes.status IS 'Status da turma: active (ativa), inactive (inativa), archived (arquivada)';

-- Atualizar turmas existentes para status 'active'
UPDATE classes
SET status = 'active'
WHERE status IS NULL;

-- Tornar a coluna NOT NULL
ALTER TABLE classes
  ALTER COLUMN status SET NOT NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

-- =====================================================
-- PARTE 2: Criar tabela teachers
-- =====================================================

-- Criar tabela teachers
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_employee_id ON teachers(employee_id_number);

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
-- PARTE 3: Políticas RLS para teachers
-- =====================================================

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

-- =====================================================
-- PARTE 4: Popular tabela teachers com usuários existentes
-- =====================================================

-- Criar registros teacher para usuários com role teacher
INSERT INTO teachers (user_id, employee_id_number)
SELECT
  id,
  COALESCE(employee_id_number, 'PROF-' || SUBSTRING(id::text, 1, 8))
FROM users
WHERE role = 'teacher'
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- PARTE 5: Trigger automático para criar teacher
-- =====================================================

-- Função para criar registro teacher automaticamente
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
-- PARTE 6: Atualizar teacher_id em classes para admins
-- =====================================================

-- Se você é admin criando turma mas não tem teacher_id,
-- podemos usar o primeiro professor disponível ou NULL
-- Descomente se necessário:

-- UPDATE classes
-- SET teacher_id = (SELECT id FROM teachers LIMIT 1)
-- WHERE teacher_id IS NULL;

-- =====================================================
-- VERIFICAÇÃO: Consultas para validar
-- =====================================================

-- Verificar se coluna status foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'classes' AND column_name = 'status';

-- Verificar se tabela teachers existe
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'teachers';

-- Contar professores criados
SELECT COUNT(*) as total_teachers FROM teachers;

-- Ver turmas com status
SELECT id, name, status, class_type
FROM classes
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- CONCLUÍDO!
-- =====================================================
-- Agora você pode:
-- 1. Criar turmas pelo painel admin
-- 2. O campo 'status' estará disponível
-- 3. A tabela 'teachers' existe e está populada
-- =====================================================
