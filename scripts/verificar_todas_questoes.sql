-- ============================================
-- VERIFICAR TODAS AS QUESTÕES DO SISTEMA
-- ============================================

-- 1. Resumo por matéria
SELECT
  s.name as materia,
  COUNT(DISTINCT t.id) as total_topicos,
  COUNT(DISTINCT q.id) as total_quizzes,
  COUNT(qq.id) as total_questoes
FROM subjects s
LEFT JOIN topics t ON t.subject_id = s.id
LEFT JOIN quizzes q ON q.topic_id = t.id
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
GROUP BY s.name
ORDER BY s.name;

-- 2. Detalhamento por tópico e quiz
SELECT
  s.name as materia,
  t.name as topico,
  q.title as quiz,
  COUNT(qq.id) as questoes
FROM subjects s
LEFT JOIN topics t ON t.subject_id = s.id
LEFT JOIN quizzes q ON q.topic_id = t.id
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
GROUP BY s.name, t.name, q.title
ORDER BY s.name, t.name, q.title;

-- 3. Quizzes vazios (que ainda precisam de questões)
SELECT
  s.name as materia,
  t.name as topico,
  q.title as quiz,
  'VAZIO - Precisa de questões' as status
FROM subjects s
LEFT JOIN topics t ON t.subject_id = s.id
LEFT JOIN quizzes q ON q.topic_id = t.id
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
WHERE q.id IS NOT NULL
GROUP BY s.name, t.name, q.title
HAVING COUNT(qq.id) = 0
ORDER BY s.name, t.name;

-- 4. Top 10 quizzes com mais questões
SELECT
  s.name as materia,
  q.title as quiz,
  COUNT(qq.id) as total_questoes
FROM quizzes q
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
LEFT JOIN topics t ON q.topic_id = t.id
LEFT JOIN subjects s ON t.subject_id = s.id
GROUP BY s.name, q.title
ORDER BY total_questoes DESC
LIMIT 10;
