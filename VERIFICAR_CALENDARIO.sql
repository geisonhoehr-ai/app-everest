-- Execute este SQL no Supabase Dashboard para verificar o problema do calendário

-- 1. Verificar se a tabela calendar_events existe
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'calendar_events'
);

-- 2. Ver a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'calendar_events'
ORDER BY ordinal_position;

-- 3. Verificar se há eventos cadastrados
SELECT COUNT(*) as total_eventos FROM calendar_events;

-- 4. Ver alguns eventos de exemplo
SELECT * FROM calendar_events LIMIT 5;

-- 5. Verificar as políticas RLS (Row Level Security)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'calendar_events';

-- 6. Se não houver dados, inserir eventos de teste
INSERT INTO calendar_events (title, event_type, start_time, end_time, class_id)
VALUES
  ('Simulado de Matemática', 'SIMULATION', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '3 hours', NULL),
  ('Prazo de Redação', 'ESSAY_DEADLINE', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days', NULL),
  ('Aula ao Vivo - História', 'LIVE_CLASS', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '2 hours', NULL),
  ('Evento Geral', 'GENERAL', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '1 hour', NULL)
ON CONFLICT DO NOTHING;
