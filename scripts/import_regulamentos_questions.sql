-- ============================================
-- SCRIPT PARA IMPORTAR QUESTÕES DE REGULAMENTOS
-- ============================================
-- Data: 2025-10-19
-- Fonte: Backup everest-preparatorios (118_gerar_questoes_regulamentos.sql)
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Este script irá popular as tabelas de quiz com questões de Regulamentos Militares

-- ============================================
-- QUESTÕES - ICA 111-6 (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%ICA 111-6%' LIMIT 1;

  -- Se não encontrou o quiz, exibir erro
  IF quiz_id IS NULL THEN
    RAISE EXCEPTION 'Quiz ICA 111-6 não encontrado. Verifique se o quiz existe no banco.';
  END IF;

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
(quiz_id, 'Qual é o objetivo principal do ICA 111-6?', 'multiple_choice',
'["Estabelecer normas de voo", "Regulamentar inspeções na Aeronáutica", "Definir hierarquia militar", "Organizar treinamentos"]',
'Regulamentar inspeções na Aeronáutica',
'O ICA 111-6 tem como objetivo principal regulamentar as inspeções realizadas na Aeronáutica.', 10),

(quiz_id, 'Quem pode realizar inspeções conforme o ICA 111-6?', 'multiple_choice',
'["Apenas oficiais", "Apenas sargentos", "Pessoal autorizado", "Apenas civis"]',
'Pessoal autorizado',
'As inspeções conforme o ICA 111-6 podem ser realizadas por pessoal devidamente autorizado.', 10),

(quiz_id, 'Qual a frequência mínima das inspeções de segurança?', 'multiple_choice',
'["Mensal", "Trimestral", "Semestral", "Anual"]',
'Semestral',
'As inspeções de segurança devem ser realizadas com frequência mínima semestral.', 10),

(quiz_id, 'O que deve ser verificado em uma inspeção de segurança?', 'multiple_choice',
'["Apenas documentos", "Apenas equipamentos", "Documentos e equipamentos", "Apenas pessoal"]',
'Documentos e equipamentos',
'Uma inspeção de segurança deve verificar tanto documentos quanto equipamentos.', 10),

(quiz_id, 'Qual documento deve ser elaborado após uma inspeção?', 'multiple_choice',
'["Relatório de inspeção", "Apenas checklist", "Apenas fotos", "Apenas assinatura"]',
'Relatório de inspeção',
'Após uma inspeção, deve ser elaborado um relatório detalhado da inspeção.', 10)
ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- QUESTÕES - ESTATUTO DOS MILITARES (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%Estatuto%Militares%' LIMIT 1;

  IF quiz_id IS NULL THEN
    RAISE EXCEPTION 'Quiz Estatuto dos Militares não encontrado. Verifique se o quiz existe no banco.';
  END IF;

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
(quiz_id, 'Qual lei estabelece o Estatuto dos Militares?', 'multiple_choice',
'["Lei 6.880/1980", "Lei 6.880/1981", "Lei 6.880/1982", "Lei 6.880/1983"]',
'Lei 6.880/1980',
'O Estatuto dos Militares é estabelecido pela Lei 6.880/1980.', 10),

(quiz_id, 'Quais são os deveres fundamentais do militar?', 'multiple_choice',
'["Apenas obedecer", "Apenas estudar", "Obedecer, estudar e servir", "Apenas servir"]',
'Obedecer, estudar e servir',
'Os deveres fundamentais do militar incluem obedecer, estudar e servir.', 10),

(quiz_id, 'Qual a hierarquia militar?', 'multiple_choice',
'["Apenas oficial e praça", "Oficial, sargento e praça", "Oficial, sargento, cabo e soldado", "Apenas sargento e praça"]',
'Oficial, sargento, cabo e soldado',
'A hierarquia militar inclui oficial, sargento, cabo e soldado.', 10),

(quiz_id, 'O que é a disciplina militar?', 'multiple_choice',
'["Apenas obediência", "Obediência e respeito à hierarquia", "Apenas respeito", "Apenas hierarquia"]',
'Obediência e respeito à hierarquia',
'A disciplina militar é a obediência e respeito à hierarquia estabelecida.', 10),

(quiz_id, 'Qual a pena máxima para crime militar?', 'multiple_choice',
'["Reclusão", "Detenção", "Prisão simples", "Multa"]',
'Reclusão',
'A pena máxima para crime militar é a reclusão.', 10)
ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- QUESTÕES - ICA 111-3 (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%ICA 111-3%' LIMIT 1;

  IF quiz_id IS NULL THEN
    RAISE EXCEPTION 'Quiz ICA 111-3 não encontrado. Verifique se o quiz existe no banco.';
  END IF;

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
(quiz_id, 'Qual é o objetivo do ICA 111-3?', 'multiple_choice',
'["Regulamentar voos civis", "Regulamentar tráfego aéreo militar", "Regulamentar aeroportos", "Regulamentar pilotos"]',
'Regulamentar tráfego aéreo militar',
'O ICA 111-3 tem como objetivo regulamentar o tráfego aéreo militar.', 10),

(quiz_id, 'Quem controla o tráfego aéreo militar?', 'multiple_choice',
'["Apenas civis", "Apenas militares", "Órgãos militares", "Apenas pilotos"]',
'Órgãos militares',
'O tráfego aéreo militar é controlado por órgãos militares.', 10),

(quiz_id, 'Qual a altitude mínima para voo VFR?', 'multiple_choice',
'["500 pés", "1000 pés", "1500 pés", "2000 pés"]',
'1000 pés',
'A altitude mínima para voo VFR é de 1000 pés.', 10),

(quiz_id, 'O que significa VFR?', 'multiple_choice',
'["Visual Flight Rules", "Very Fast Rules", "Visual Flying Rules", "Very Flight Rules"]',
'Visual Flight Rules',
'VFR significa Visual Flight Rules (Regras de Voo Visual).', 10),

(quiz_id, 'Qual a separação mínima entre aeronaves?', 'multiple_choice',
'["5 milhas", "10 milhas", "15 milhas", "20 milhas"]',
'10 milhas',
'A separação mínima entre aeronaves é de 10 milhas.', 10)
ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- QUESTÕES - RDAER (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%RDAER%' LIMIT 1;

  IF quiz_id IS NULL THEN
    RAISE EXCEPTION 'Quiz RDAER não encontrado. Verifique se o quiz existe no banco.';
  END IF;

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
(quiz_id, 'Qual é o objetivo do RDAER?', 'multiple_choice',
'["Regulamentar voos civis", "Regulamentar defesa aérea", "Regulamentar aeroportos", "Regulamentar pilotos"]',
'Regulamentar defesa aérea',
'O RDAER tem como objetivo regulamentar a defesa aérea.', 10),

(quiz_id, 'Quem coordena a defesa aérea?', 'multiple_choice',
'["Apenas Exército", "Apenas Marinha", "Apenas Aeronáutica", "Forças Armadas"]',
'Forças Armadas',
'A defesa aérea é coordenada pelas Forças Armadas.', 10),

(quiz_id, 'Qual a responsabilidade da defesa aérea?', 'multiple_choice',
'["Apenas vigilância", "Vigilância e controle", "Apenas controle", "Apenas interceptação"]',
'Vigilância e controle',
'A defesa aérea tem responsabilidade de vigilância e controle.', 10),

(quiz_id, 'O que é o CODAER?', 'multiple_choice',
'["Centro de Operações de Defesa Aérea", "Comando de Defesa Aérea", "Centro de Defesa Aérea", "Comando de Operações"]',
'Centro de Operações de Defesa Aérea',
'CODAER significa Centro de Operações de Defesa Aérea.', 10),

(quiz_id, 'Qual a prioridade da defesa aérea?', 'multiple_choice',
'["Apenas civis", "Apenas militares", "Segurança nacional", "Apenas aeronaves"]',
'Segurança nacional',
'A prioridade da defesa aérea é a segurança nacional.', 10)
ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- QUESTÕES - ICA 111-2 (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%ICA 111-2%' LIMIT 1;

  IF quiz_id IS NULL THEN
    RAISE EXCEPTION 'Quiz ICA 111-2 não encontrado. Verifique se o quiz existe no banco.';
  END IF;

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
(quiz_id, 'Qual é o objetivo do ICA 111-2?', 'multiple_choice',
'["Regulamentar voos civis", "Regulamentar navegação aérea militar", "Regulamentar aeroportos", "Regulamentar pilotos"]',
'Regulamentar navegação aérea militar',
'O ICA 111-2 tem como objetivo regulamentar a navegação aérea militar.', 10),

(quiz_id, 'Quem pode navegar em espaço aéreo militar?', 'multiple_choice',
'["Apenas civis", "Apenas militares", "Aeronaves autorizadas", "Apenas pilotos"]',
'Aeronaves autorizadas',
'Apenas aeronaves devidamente autorizadas podem navegar em espaço aéreo militar.', 10),

(quiz_id, 'Qual a altitude máxima para voo VFR?', 'multiple_choice',
'["FL 100", "FL 150", "FL 200", "FL 250"]',
'FL 100',
'A altitude máxima para voo VFR é FL 100.', 10),

(quiz_id, 'O que significa IFR?', 'multiple_choice',
'["Instrument Flight Rules", "International Flight Rules", "Instrument Flying Rules", "International Flying Rules"]',
'Instrument Flight Rules',
'IFR significa Instrument Flight Rules (Regras de Voo por Instrumentos).', 10),

(quiz_id, 'Qual a visibilidade mínima para voo VFR?', 'multiple_choice',
'["5 km", "8 km", "10 km", "15 km"]',
'8 km',
'A visibilidade mínima para voo VFR é de 8 km.', 10)
ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

-- Contar questões por quiz de Regulamentos
SELECT
  q.id,
  q.title,
  COUNT(qq.id) as total_questoes
FROM quizzes q
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
LEFT JOIN topics t ON q.topic_id = t.id
LEFT JOIN subjects s ON t.subject_id = s.id
WHERE s.name IN ('Regulamentos', 'Regulamentos Militares')
GROUP BY q.id, q.title
ORDER BY q.title;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Total de questões inseridas: 25
-- Matérias: Regulamentos Militares
-- 5 quizzes com 5 questões cada
-- ============================================
