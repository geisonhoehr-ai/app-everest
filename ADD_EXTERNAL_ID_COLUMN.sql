-- Adicionar coluna external_id na tabela classes
-- Para armazenar o ID de origem (Memberkit, etc)

ALTER TABLE classes
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255) UNIQUE;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_classes_external_id ON classes(external_id);

-- Comentário na coluna
COMMENT ON COLUMN classes.external_id IS 'ID externo de origem (ex: memberkit_123)';
