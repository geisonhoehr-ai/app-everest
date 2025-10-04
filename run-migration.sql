-- PASSO 1: Verificar estrutura atual da tabela quizzes
-- Copie e execute este SQL primeiro para ver a estrutura atual:

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'quizzes'
ORDER BY ordinal_position;
