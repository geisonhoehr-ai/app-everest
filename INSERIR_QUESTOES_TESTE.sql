-- Inserir questões de teste com formatação rica no Supabase
-- Execute este SQL no Supabase Dashboard (SQL Editor)

-- PASSO 1: Criar um quiz de teste
-- Usando um usuário admin existente
INSERT INTO quizzes (topic_id, title, description, duration_minutes, created_by_user_id)
VALUES (
  '1de4455f-da37-49af-b461-2df72e9667dc', -- Fonética e Fonologia
  'Quiz de Teste - Formatação Rica',
  'Demonstração das novas funcionalidades de questões com formatação rica',
  30,
  (SELECT id FROM users WHERE role = 'administrator' LIMIT 1) -- Primeiro admin encontrado
)
RETURNING id;

-- PASSO 2: Inserir questões com formatação rica
-- Questão 1: Múltipla escolha básica com HTML
INSERT INTO quiz_questions (
  quiz_id,
  question_format,
  question_text,
  question_html,
  options,
  correct_answer,
  explanation,
  explanation_html,
  difficulty,
  points,
  question_type
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Quiz de Teste - Formatação Rica' ORDER BY created_at DESC LIMIT 1),
  'multiple_choice',
  'Qual é o resultado de 2 + 2?',
  '<p>Qual é o resultado de <strong>2 + 2</strong>?</p><p>Esta é uma questão <em>básica</em> de matemática.</p>',
  ARRAY['2', '3', '4', '5'],
  '4',
  'A soma de 2 + 2 é igual a 4.',
  '<p>A soma de <strong>2 + 2</strong> é igual a <span style="color: green; font-weight: bold;">4</span>.</p><p>Operação básica de adição.</p>',
  'easy',
  1,
  'multiple_choice'
);

-- Questão 2: Verdadeiro/Falso
INSERT INTO quiz_questions (
  quiz_id,
  question_format,
  question_text,
  question_html,
  correct_answer,
  explanation_html,
  difficulty,
  points,
  question_type
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Quiz de Teste - Formatação Rica' ORDER BY created_at DESC LIMIT 1),
  'true_false',
  'O número 7 é um número primo?',
  '<p>O número <strong style="color: #0EA5E9;">7</strong> é um número <em>primo</em>?</p><p><small>Números primos são divisíveis apenas por 1 e por eles mesmos</small></p>',
  'true',
  '<h4 style="color: green;">✓ Verdadeiro!</h4><p>O número 7 é primo porque só é divisível por:</p><ul><li>1</li><li>7 (ele mesmo)</li></ul>',
  'easy',
  1,
  'multiple_choice'
);

-- Questão 3: Múltipla escolha com formatação rica
INSERT INTO quiz_questions (
  quiz_id,
  question_format,
  question_text,
  question_html,
  options,
  correct_answer,
  explanation_html,
  difficulty,
  points,
  question_type
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Quiz de Teste - Formatação Rica' ORDER BY created_at DESC LIMIT 1),
  'multiple_choice',
  'Qual é a raiz quadrada de 16?',
  '<p>Calcule a <strong>raiz quadrada</strong> de <u>16</u>:</p><ul><li>Lembre-se: √16 = ?</li><li>Qual número multiplicado por ele mesmo resulta em 16?</li></ul>',
  ARRAY['2', '3', '4', '8'],
  '4',
  '<h4>Resposta correta: 4</h4><p><strong>Porque:</strong> 4 × 4 = 16</p><p>Portanto: <strong>√16 = 4</strong></p>',
  'medium',
  2,
  'multiple_choice'
);

-- Questão 4: Dissertativa
INSERT INTO quiz_questions (
  quiz_id,
  question_format,
  question_text,
  question_html,
  explanation_html,
  difficulty,
  points,
  time_limit_seconds,
  question_type
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Quiz de Teste - Formatação Rica' ORDER BY created_at DESC LIMIT 1),
  'essay',
  'Explique o que são números primos e dê 3 exemplos.',
  '<h3>Números Primos</h3><p>Responda:</p><ol><li>O que são números primos?</li><li>Liste <strong>3 exemplos</strong> de números primos</li><li>Por que o número 1 <em>não é</em> considerado primo?</li></ol>',
  '<p><strong>Pontos esperados:</strong></p><ul><li>Definição: divisível apenas por 1 e por ele mesmo</li><li>Exemplos: 2, 3, 5, 7, 11, 13...</li><li>O 1 não é primo porque só tem um divisor (ele mesmo)</li></ul>',
  'medium',
  3,
  300,
  'multiple_choice'
);

-- Questão 5: Preencher lacuna
INSERT INTO quiz_questions (
  quiz_id,
  question_format,
  question_text,
  question_html,
  explanation_html,
  difficulty,
  points,
  question_type
) VALUES (
  (SELECT id FROM quizzes WHERE title = 'Quiz de Teste - Formatação Rica' ORDER BY created_at DESC LIMIT 1),
  'fill_blank',
  'Complete: A soma dos ângulos internos de um triângulo é ___ graus.',
  '<p>Complete a frase abaixo:</p><blockquote style="border-left: 4px solid #0EA5E9; padding-left: 1rem;"><p>A soma dos ângulos internos de um <strong>triângulo</strong> é <u style="color: #0EA5E9;">______</u> graus.</p></blockquote>',
  '<h4>Resposta: 180 graus</h4><p>Em <strong>qualquer triângulo</strong>, a soma dos três ângulos internos sempre será <strong>180°</strong></p>',
  'easy',
  1,
  'multiple_choice'
);

-- PASSO 3: Verificar as questões inseridas
SELECT
  q.id,
  q.question_format,
  LEFT(q.question_text, 60) as preview,
  q.difficulty,
  q.points,
  quiz.title as quiz_title
FROM quiz_questions q
JOIN quizzes quiz ON q.quiz_id = quiz.id
WHERE quiz.title = 'Quiz de Teste - Formatação Rica'
ORDER BY q.created_at;

-- PASSO 4: Ver o ID do quiz criado (para usar em simulados)
SELECT id, title, description
FROM quizzes
WHERE title = 'Quiz de Teste - Formatação Rica';
