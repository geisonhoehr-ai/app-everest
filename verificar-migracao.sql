-- Verificar se as colunas foram adicionadas na tabela quizzes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'quizzes'
ORDER BY ordinal_position;
