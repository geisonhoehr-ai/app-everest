-- ============================================
-- SCRIPT PARA LIMPAR QUIZZES DUPLICADOS
-- ============================================
-- Data: 2025-10-19
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Este script irá remover quizzes vazios que são duplicatas

-- ============================================
-- 1. VERIFICAR QUIZZES DUPLICADOS
-- ============================================

-- Ver quizzes de Regulamentos com contagem de questões
SELECT
  q.id,
  q.title,
  t.name as topic_name,
  COUNT(qq.id) as total_questoes,
  CASE
    WHEN COUNT(qq.id) = 0 THEN 'VAZIO - CANDIDATO A REMOÇÃO'
    ELSE 'TEM QUESTÕES - MANTER'
  END as status
FROM quizzes q
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
LEFT JOIN topics t ON q.topic_id = t.id
LEFT JOIN subjects s ON t.subject_id = s.id
WHERE s.name IN ('Regulamentos', 'Regulamentos Militares')
GROUP BY q.id, q.title, t.name
ORDER BY t.name, total_questoes DESC, q.title;

-- ============================================
-- 2. REMOVER QUIZZES DUPLICADOS VAZIOS
-- ============================================

-- Remover quiz duplicado "Quiz: ICA 111-6 - Regulamento de Inspeção" (vazio)
-- Manter "Quiz Básico ICA 111-6" (com 5 questões)
DELETE FROM quizzes
WHERE title = 'Quiz: ICA 111-6 - Regulamento de Inspeção'
  AND id NOT IN (SELECT DISTINCT quiz_id FROM quiz_questions WHERE quiz_id IS NOT NULL);

-- Remover quiz duplicado "Quiz: RDAER - Regulamento de Defesa Aérea" (vazio)
-- Manter "Quiz Básico RDAER" (com 5 questões)
DELETE FROM quizzes
WHERE title = 'Quiz: RDAER - Regulamento de Defesa Aérea'
  AND id NOT IN (SELECT DISTINCT quiz_id FROM quiz_questions WHERE quiz_id IS NOT NULL);

-- ============================================
-- 3. VERIFICAR RESULTADO
-- ============================================

-- Ver quizzes de Regulamentos após limpeza
SELECT
  q.id,
  q.title,
  t.name as topic_name,
  COUNT(qq.id) as total_questoes
FROM quizzes q
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
LEFT JOIN topics t ON q.topic_id = t.id
LEFT JOIN subjects s ON t.subject_id = s.id
WHERE s.name IN ('Regulamentos', 'Regulamentos Militares')
GROUP BY q.id, q.title, t.name
ORDER BY t.name, q.title;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Quizzes duplicados removidos
-- Sistema está mais limpo e organizado
-- ============================================
