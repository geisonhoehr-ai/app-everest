-- ============================================
-- SCRIPT PARA IMPORTAR QUESTÕES DE QUIZ
-- Português e Regulamentos Militares
-- ============================================
-- Data: 2025-10-18
-- Fonte: Backup everest-preparatorios
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Este script irá popular as tabelas de quiz com questões reais

-- ============================================
-- 1. VERIFICAR ESTRUTURA ATUAL
-- ============================================

-- Verificar subjects existentes
SELECT id, name FROM subjects ORDER BY name;

-- Verificar topics existentes
SELECT id, name, subject_id FROM topics ORDER BY name;

-- Verificar quizzes existentes
SELECT id, title, topic_id FROM quizzes ORDER BY title;

-- ============================================
-- 2. CRIAR SUBJECTS (se não existirem)
-- ============================================

-- Pegar o ID de um usuário admin/teacher para usar como created_by
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Tentar pegar um usuário admin ou teacher
  SELECT id INTO admin_user_id
  FROM users
  WHERE role IN ('administrator', 'teacher')
  LIMIT 1;

  -- Se não encontrar, pegar qualquer usuário
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users LIMIT 1;
  END IF;

  -- Inserir Português (se ainda não existir)
  INSERT INTO subjects (name, description, image_url, created_by_user_id)
  SELECT 'Português', 'Questões de Língua Portuguesa para concursos militares', 'https://img.usecurling.com/p/400/200?q=Portugu%C3%AAs', admin_user_id
  WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name = 'Português');

  -- Inserir Regulamentos (se ainda não existir)
  INSERT INTO subjects (name, description, image_url, created_by_user_id)
  SELECT 'Regulamentos Militares', 'Questões sobre regulamentos e normas das Forças Armadas', 'https://img.usecurling.com/p/400/200?q=Regulamentos', admin_user_id
  WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE name = 'Regulamentos Militares');

END $$;

-- ============================================
-- 3. CRIAR TOPICS DE PORTUGUÊS
-- ============================================

-- Primeiro pegamos o ID do subject Português e do usuário
DO $$
DECLARE
  portugues_id uuid;
  admin_user_id uuid;
BEGIN
  SELECT id INTO portugues_id FROM subjects WHERE name = 'Português' LIMIT 1;

  -- Pegar user_id que criou o subject
  SELECT created_by_user_id INTO admin_user_id FROM subjects WHERE id = portugues_id;

  -- Inserir topics
  INSERT INTO topics (subject_id, name, description, created_by_user_id) VALUES
  (portugues_id, 'Concordância', 'Concordância verbal e nominal', admin_user_id),
  (portugues_id, 'Fonética e Fonologia', 'Fonemas, sílabas e encontros vocálicos', admin_user_id),
  (portugues_id, 'Crase', 'Uso correto da crase', admin_user_id),
  (portugues_id, 'Regência', 'Regência verbal e nominal', admin_user_id),
  (portugues_id, 'Ortografia', 'Regras de ortografia', admin_user_id),
  (portugues_id, 'Pontuação', 'Uso correto dos sinais de pontuação', admin_user_id),
  (portugues_id, 'Colocação Pronominal', 'Próclise, mesóclise e ênclise', admin_user_id),
  (portugues_id, 'Vozes Verbais', 'Voz ativa, passiva e reflexiva', admin_user_id)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 4. CRIAR QUIZZES DE PORTUGUÊS
-- ============================================

-- Criar quizzes para cada tópico
DO $$
DECLARE
  concordancia_id uuid;
  fonetica_id uuid;
  crase_id uuid;
  regencia_id uuid;
  ortografia_id uuid;
  pontuacao_id uuid;
  admin_user_id uuid;
BEGIN
  -- Pegar IDs dos topics
  SELECT id INTO concordancia_id FROM topics WHERE name = 'Concordância' LIMIT 1;
  SELECT id INTO fonetica_id FROM topics WHERE name = 'Fonética e Fonologia' LIMIT 1;
  SELECT id INTO crase_id FROM topics WHERE name = 'Crase' LIMIT 1;
  SELECT id INTO regencia_id FROM topics WHERE name = 'Regência' LIMIT 1;
  SELECT id INTO ortografia_id FROM topics WHERE name = 'Ortografia' LIMIT 1;
  SELECT id INTO pontuacao_id FROM topics WHERE name = 'Pontuação' LIMIT 1;

  -- Pegar user_id que criou os topics
  SELECT created_by_user_id INTO admin_user_id FROM topics WHERE id = concordancia_id;

  -- Inserir quizzes
  INSERT INTO quizzes (topic_id, title, description, duration_minutes, created_by_user_id) VALUES
  (concordancia_id, 'Quiz de Concordância Verbal e Nominal', 'Teste seus conhecimentos sobre concordância', 15, admin_user_id),
  (fonetica_id, 'Quiz de Fonética e Fonologia', 'Teste seus conhecimentos sobre fonemas e sílabas', 10, admin_user_id),
  (crase_id, 'Quiz de Crase', 'Teste seus conhecimentos sobre o uso da crase', 10, admin_user_id),
  (regencia_id, 'Quiz de Regência', 'Teste seus conhecimentos sobre regência verbal e nominal', 15, admin_user_id),
  (ortografia_id, 'Quiz de Ortografia', 'Teste seus conhecimentos sobre ortografia', 12, admin_user_id),
  (pontuacao_id, 'Quiz de Pontuação', 'Teste seus conhecimentos sobre pontuação', 12, admin_user_id)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 5. QUESTÕES - CONCORDÂNCIA (10 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title = 'Quiz de Concordância Verbal e Nominal' LIMIT 1;

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
(quiz_id, 'Qual é a relação de harmonia entre o verbo e o sujeito chamada?', 'multiple_choice',
'["Concordância verbal", "Concordância nominal", "Regência verbal", "Regência nominal"]',
'Concordância verbal',
'A concordância verbal é a relação de harmonia entre o verbo e o sujeito, de modo que o verbo deve concordar em número e pessoa com o sujeito da oração.', 10),

(quiz_id, 'Em um sujeito simples, o verbo concorda com:', 'multiple_choice',
'["Todos os termos do sujeito", "Apenas o núcleo do sujeito", "O termo mais próximo", "O último termo"]',
'Apenas o núcleo do sujeito',
'Em um sujeito simples, o verbo concorda em número e pessoa com o núcleo do sujeito, mesmo que haja termos acessórios ligados a ele.', 10),

(quiz_id, 'Quando o sujeito é composto, o verbo fica:', 'multiple_choice',
'["No singular", "No plural", "No infinitivo", "No gerúndio"]',
'No plural',
'Quando o sujeito é composto, o verbo fica no plural. Se os núcleos do sujeito não estiverem juntos, o verbo concorda com o núcleo mais próximo ou vai para o plural.', 10),

(quiz_id, 'O verbo "haver" quando usado no sentido de existir é:', 'multiple_choice',
'["Pessoal", "Impersonal", "Transitivo", "Intransitivo"]',
'Impersonal',
'O verbo "haver", quando usado no sentido de existir, é impessoal e deve ser empregado sempre na 3ª pessoa do singular.', 10),

(quiz_id, 'A concordância nominal é a relação de harmonia entre:', 'multiple_choice',
'["Verbo e sujeito", "Substantivo e seus determinantes", "Preposição e objeto", "Conjunção e oração"]',
'Substantivo e seus determinantes',
'A concordância nominal é a relação de harmonia entre o substantivo e seus determinantes e modificadores, que devem concordar em gênero e número.', 10),

(quiz_id, 'Quando o adjetivo se refere a dois ou mais substantivos do mesmo gênero, pode:', 'multiple_choice',
'["Ir apenas para o plural", "Concordar só com o mais próximo", "Ir para o plural ou concordar só com o mais próximo", "Ficar invariável"]',
'Ir para o plural ou concordar só com o mais próximo',
'Quando o adjetivo se refere a dois ou mais substantivos do mesmo gênero, pode ir para o plural ou concordar só com o mais próximo.', 10),

(quiz_id, 'A concordância atrativa ocorre quando:', 'multiple_choice',
'["O verbo concorda com o termo mais próximo", "O verbo concorda com o núcleo do sujeito", "O verbo fica no infinitivo", "O verbo fica no gerúndio"]',
'O verbo concorda com o termo mais próximo',
'A concordância atrativa ocorre quando o verbo concorda com o termo mais próximo, mesmo que não seja o núcleo do sujeito, por uma questão estilística.', 10),

(quiz_id, 'Verbos que indicam fenômenos da natureza normalmente são:', 'multiple_choice',
'["Pessoais", "Impersonais", "Transitivos", "Intransitivos"]',
'Impersonais',
'Verbos que indicam fenômenos da natureza normalmente são impessoais e empregados na 3ª pessoa do singular, exceto quando usados figuradamente.', 10),

(quiz_id, 'Com expressões quantitativas como "mais de um", geralmente o verbo:', 'multiple_choice',
'["Vai para o plural", "Permanece no singular", "Fica no infinitivo", "Fica no gerúndio"]',
'Permanece no singular',
'Com expressões quantitativas como "mais de um", geralmente o verbo permanece no singular, pois a ideia considerada é a de unidade.', 10),

(quiz_id, 'A concordância ideológica, ou silepse, ocorre quando:', 'multiple_choice',
'["A concordância se faz com a forma literal", "A concordância se faz com a ideia ou sentido", "A concordância se faz com o termo mais próximo", "A concordância se faz com o núcleo"]',
'A concordância se faz com a ideia ou sentido',
'A concordância ideológica, ou silepse, ocorre quando a concordância se faz com a ideia ou sentido, e não com a forma literal.', 10)
ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- 6. QUESTÕES - FONÉTICA E FONOLOGIA (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title = 'Quiz de Fonética e Fonologia' LIMIT 1;

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
(quiz_id, 'Qual o nome da menor unidade sonora da fala que distingue significados?', 'multiple_choice',
'["Fonema", "Letra", "Sílaba", "Morfema"]',
'Fonema',
'O fonema é a menor unidade sonora capaz de diferenciar palavras.', 10),

(quiz_id, 'Em qual das palavras abaixo ocorre um ditongo?', 'multiple_choice',
'["Saída", "Canoa", "Quase", "Poesia"]',
'Quase',
'Em "quase", o "ua" forma um ditongo crescente (semivogal + vogal) na mesma sílaba.', 10),

(quiz_id, 'A palavra "psicologia" possui quantos fonemas?', 'multiple_choice',
'["9", "10", "8", "7"]',
'9',
'A palavra "psicologia" tem 9 fonemas: /p/, /s/, /i/, /k/, /o/, /l/, /o/, /ʒ/, /i/. O "ps" inicial representa apenas um som /s/.', 10),

(quiz_id, 'Qual o tipo de encontro vocálico em "saída"?', 'multiple_choice',
'["Ditongo", "Tritongo", "Hiato", "Dígrafo"]',
'Hiato',
'Em "saída", as vogais "a" e "í" ficam em sílabas separadas, formando um hiato.', 10),

(quiz_id, 'Qual das alternativas apresenta um dígrafo?', 'multiple_choice',
'["Planta", "Chuva", "Livro", "Prato"]',
'Chuva',
'Em "chuva", o "ch" representa um único som, sendo um dígrafo.', 10)
ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- 7. QUESTÕES - CRASE (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title = 'Quiz de Crase' LIMIT 1;

INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
(quiz_id, 'A crase é o encontro de:', 'multiple_choice',
'["Duas vogais iguais", "Vogal + vogal", "Vogal + semivogal", "A + A"]',
'A + A',
'A crase é o encontro da preposição "a" com o artigo "a", formando "à".', 10),

(quiz_id, 'Em qual frase há crase obrigatória?', 'multiple_choice',
'["Vou a escola", "Vou à escola", "Vou para escola", "Vou na escola"]',
'Vou à escola',
'Há crase obrigatória quando a preposição "a" se junta ao artigo "a" antes de substantivo feminino.', 10),

(quiz_id, 'Antes de verbos no infinitivo, há crase?', 'multiple_choice',
'["Sempre", "Nunca", "Às vezes", "Depende do verbo"]',
'Nunca',
'Antes de verbos no infinitivo não há crase, pois não há artigo definido.', 10),

(quiz_id, 'Em "às vezes", há crase porque:', 'multiple_choice',
'["É uma expressão fixa", "Há preposição + artigo", "É uma exceção", "É uma regra especial"]',
'Há preposição + artigo',
'Em "às vezes" há crase porque há a preposição "a" + o artigo "as" (plural de "a").', 10),

(quiz_id, 'Antes de nomes próprios femininos, há crase?', 'multiple_choice',
'["Sempre", "Nunca", "Depende do contexto", "Apenas no plural"]',
'Depende do contexto',
'Antes de nomes próprios femininos, há crase apenas se a pessoa for de nossa intimidade (admite artigo).', 10)
ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- 8. VERIFICAR RESULTADO
-- ============================================

-- Contar questões por quiz
SELECT
  q.id,
  q.title,
  COUNT(qq.id) as total_questoes
FROM quizzes q
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
GROUP BY q.id, q.title
ORDER BY q.title;

-- Verificar estrutura completa
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

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Total de questões inseridas: 25
-- Matérias: Português (25 questões)
-- Próximo passo: Adicionar questões de Regulamentos
-- ============================================
