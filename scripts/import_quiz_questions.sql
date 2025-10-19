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

INSERT INTO subjects (id, name, description, image_url) VALUES
('portugues', 'Português', 'Questões de Língua Portuguesa para concursos militares', 'https://img.usecurling.com/p/400/200?q=Portugu%C3%AAs'),
('regulamentos', 'Regulamentos Militares', 'Questões sobre regulamentos e normas das Forças Armadas', 'https://img.usecurling.com/p/400/200?q=Regulamentos')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- ============================================
-- 3. CRIAR TOPICS DE PORTUGUÊS
-- ============================================

INSERT INTO topics (id, subject_id, name, description) VALUES
('concordancia', 'portugues', 'Concordância', 'Concordância verbal e nominal'),
('fonetica-fonologia', 'portugues', 'Fonética e Fonologia', 'Fonemas, sílabas e encontros vocálicos'),
('crase', 'portugues', 'Crase', 'Uso correto da crase'),
('regencia', 'portugues', 'Regência', 'Regência verbal e nominal'),
('ortografia', 'portugues', 'Ortografia', 'Regras de ortografia'),
('pontuacao', 'portugues', 'Pontuação', 'Uso correto dos sinais de pontuação'),
('colocacao-pronominal', 'portugues', 'Colocação Pronominal', 'Próclise, mesóclise e ênclise'),
('vozes-verbais', 'portugues', 'Vozes Verbais', 'Voz ativa, passiva e reflexiva')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ============================================
-- 4. CRIAR QUIZZES DE PORTUGUÊS
-- ============================================

INSERT INTO quizzes (id, topic_id, title, description, duration_minutes) VALUES
('quiz-concordancia', 'concordancia', 'Quiz de Concordância Verbal e Nominal', 'Teste seus conhecimentos sobre concordância', 15),
('quiz-fonetica', 'fonetica-fonologia', 'Quiz de Fonética e Fonologia', 'Teste seus conhecimentos sobre fonemas e sílabas', 10),
('quiz-crase', 'crase', 'Quiz de Crase', 'Teste seus conhecimentos sobre o uso da crase', 10),
('quiz-regencia', 'regencia', 'Quiz de Regência', 'Teste seus conhecimentos sobre regência verbal e nominal', 15),
('quiz-ortografia', 'ortografia', 'Quiz de Ortografia', 'Teste seus conhecimentos sobre ortografia', 12),
('quiz-pontuacao', 'pontuacao', 'Quiz de Pontuação', 'Teste seus conhecimentos sobre pontuação', 12)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes;

-- ============================================
-- 5. QUESTÕES - CONCORDÂNCIA (10 questões)
-- ============================================

INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer, explanation, points) VALUES
('quiz-concordancia', 'Qual é a relação de harmonia entre o verbo e o sujeito chamada?',
'["Concordância verbal", "Concordância nominal", "Regência verbal", "Regência nominal"]',
'Concordância verbal',
'A concordância verbal é a relação de harmonia entre o verbo e o sujeito, de modo que o verbo deve concordar em número e pessoa com o sujeito da oração.', 10),

('quiz-concordancia', 'Em um sujeito simples, o verbo concorda com:',
'["Todos os termos do sujeito", "Apenas o núcleo do sujeito", "O termo mais próximo", "O último termo"]',
'Apenas o núcleo do sujeito',
'Em um sujeito simples, o verbo concorda em número e pessoa com o núcleo do sujeito, mesmo que haja termos acessórios ligados a ele.', 10),

('quiz-concordancia', 'Quando o sujeito é composto, o verbo fica:',
'["No singular", "No plural", "No infinitivo", "No gerúndio"]',
'No plural',
'Quando o sujeito é composto, o verbo fica no plural. Se os núcleos do sujeito não estiverem juntos, o verbo concorda com o núcleo mais próximo ou vai para o plural.', 10),

('quiz-concordancia', 'O verbo "haver" quando usado no sentido de existir é:',
'["Pessoal", "Impersonal", "Transitivo", "Intransitivo"]',
'Impersonal',
'O verbo "haver", quando usado no sentido de existir, é impessoal e deve ser empregado sempre na 3ª pessoa do singular.', 10),

('quiz-concordancia', 'A concordância nominal é a relação de harmonia entre:',
'["Verbo e sujeito", "Substantivo e seus determinantes", "Preposição e objeto", "Conjunção e oração"]',
'Substantivo e seus determinantes',
'A concordância nominal é a relação de harmonia entre o substantivo e seus determinantes e modificadores, que devem concordar em gênero e número.', 10),

('quiz-concordancia', 'Quando o adjetivo se refere a dois ou mais substantivos do mesmo gênero, pode:',
'["Ir apenas para o plural", "Concordar só com o mais próximo", "Ir para o plural ou concordar só com o mais próximo", "Ficar invariável"]',
'Ir para o plural ou concordar só com o mais próximo',
'Quando o adjetivo se refere a dois ou mais substantivos do mesmo gênero, pode ir para o plural ou concordar só com o mais próximo.', 10),

('quiz-concordancia', 'A concordância atrativa ocorre quando:',
'["O verbo concorda com o termo mais próximo", "O verbo concorda com o núcleo do sujeito", "O verbo fica no infinitivo", "O verbo fica no gerúndio"]',
'O verbo concorda com o termo mais próximo',
'A concordância atrativa ocorre quando o verbo concorda com o termo mais próximo, mesmo que não seja o núcleo do sujeito, por uma questão estilística.', 10),

('quiz-concordancia', 'Verbos que indicam fenômenos da natureza normalmente são:',
'["Pessoais", "Impersonais", "Transitivos", "Intransitivos"]',
'Impersonais',
'Verbos que indicam fenômenos da natureza normalmente são impessoais e empregados na 3ª pessoa do singular, exceto quando usados figuradamente.', 10),

('quiz-concordancia', 'Com expressões quantitativas como "mais de um", geralmente o verbo:',
'["Vai para o plural", "Permanece no singular", "Fica no infinitivo", "Fica no gerúndio"]',
'Permanece no singular',
'Com expressões quantitativas como "mais de um", geralmente o verbo permanece no singular, pois a ideia considerada é a de unidade.', 10),

('quiz-concordancia', 'A concordância ideológica, ou silepse, ocorre quando:',
'["A concordância se faz com a forma literal", "A concordância se faz com a ideia ou sentido", "A concordância se faz com o termo mais próximo", "A concordância se faz com o núcleo"]',
'A concordância se faz com a ideia ou sentido',
'A concordância ideológica, ou silepse, ocorre quando a concordância se faz com a ideia ou sentido, e não com a forma literal.', 10)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. QUESTÕES - FONÉTICA E FONOLOGIA (5 questões)
-- ============================================

INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer, explanation, points) VALUES
('quiz-fonetica', 'Qual o nome da menor unidade sonora da fala que distingue significados?',
'["Fonema", "Letra", "Sílaba", "Morfema"]',
'Fonema',
'O fonema é a menor unidade sonora capaz de diferenciar palavras.', 10),

('quiz-fonetica', 'Em qual das palavras abaixo ocorre um ditongo?',
'["Saída", "Canoa", "Quase", "Poesia"]',
'Quase',
'Em "quase", o "ua" forma um ditongo crescente (semivogal + vogal) na mesma sílaba.', 10),

('quiz-fonetica', 'A palavra "psicologia" possui quantos fonemas?',
'["9", "10", "8", "7"]',
'9',
'A palavra "psicologia" tem 9 fonemas: /p/, /s/, /i/, /k/, /o/, /l/, /o/, /ʒ/, /i/. O "ps" inicial representa apenas um som /s/.', 10),

('quiz-fonetica', 'Qual o tipo de encontro vocálico em "saída"?',
'["Ditongo", "Tritongo", "Hiato", "Dígrafo"]',
'Hiato',
'Em "saída", as vogais "a" e "í" ficam em sílabas separadas, formando um hiato.', 10),

('quiz-fonetica', 'Qual das alternativas apresenta um dígrafo?',
'["Planta", "Chuva", "Livro", "Prato"]',
'Chuva',
'Em "chuva", o "ch" representa um único som, sendo um dígrafo.', 10)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. QUESTÕES - CRASE (5 questões)
-- ============================================

INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer, explanation, points) VALUES
('quiz-crase', 'A crase é o encontro de:',
'["Duas vogais iguais", "Vogal + vogal", "Vogal + semivogal", "A + A"]',
'A + A',
'A crase é o encontro da preposição "a" com o artigo "a", formando "à".', 10),

('quiz-crase', 'Em qual frase há crase obrigatória?',
'["Vou a escola", "Vou à escola", "Vou para escola", "Vou na escola"]',
'Vou à escola',
'Há crase obrigatória quando a preposição "a" se junta ao artigo "a" antes de substantivo feminino.', 10),

('quiz-crase', 'Antes de verbos no infinitivo, há crase?',
'["Sempre", "Nunca", "Às vezes", "Depende do verbo"]',
'Nunca',
'Antes de verbos no infinitivo não há crase, pois não há artigo definido.', 10),

('quiz-crase', 'Em "às vezes", há crase porque:',
'["É uma expressão fixa", "Há preposição + artigo", "É uma exceção", "É uma regra especial"]',
'Há preposição + artigo',
'Em "às vezes" há crase porque há a preposição "a" + o artigo "as" (plural de "a").', 10),

('quiz-crase', 'Antes de nomes próprios femininos, há crase?',
'["Sempre", "Nunca", "Depende do contexto", "Apenas no plural"]',
'Depende do contexto',
'Antes de nomes próprios femininos, há crase apenas se a pessoa for de nossa intimidade (admite artigo).', 10)
ON CONFLICT DO NOTHING;

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
