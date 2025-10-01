-- =====================================================
-- MIGRATION 006: Adicionar coluna status à tabela classes
-- =====================================================
-- Adiciona coluna de status para controlar o estado da turma

-- 1. Adicionar coluna status
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));

COMMENT ON COLUMN classes.status IS 'Status da turma: active (ativa), inactive (inativa), archived (arquivada)';

-- 2. Atualizar turmas existentes para status 'active'
UPDATE classes
SET status = 'active'
WHERE status IS NULL;

-- 3. Tornar a coluna NOT NULL (agora que todos têm valor)
ALTER TABLE classes
  ALTER COLUMN status SET NOT NULL;

-- 4. Criar índice para consultas por status
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

-- =====================================================
-- ROLLBACK (caso necessário)
-- =====================================================
-- DROP INDEX IF EXISTS idx_classes_status;
-- ALTER TABLE classes DROP COLUMN IF EXISTS status;
