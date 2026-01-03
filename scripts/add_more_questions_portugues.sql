-- ============================================
-- SCRIPT PARA ADICIONAR MAIS QUESTÕES - PORTUGUÊS
-- ============================================
-- Data: 2025-10-19
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Este script adiciona mais questões aos quizzes de Português existentes

-- ============================================
-- QUESTÕES ADICIONAIS - REGÊNCIA (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%Regência%' LIMIT 1;

  IF quiz_id IS NOT NULL THEN
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
    (quiz_id, 'O verbo "assistir" no sentido de "ver" exige qual preposição?', 'multiple_choice',
    '["a", "em", "de", "para"]',
    'a',
    'O verbo "assistir" no sentido de "ver" é transitivo indireto e exige a preposição "a". Ex: Assistir ao filme.', 10),

    (quiz_id, 'Qual a regência correta: "Prefiro café _____ chá"?', 'multiple_choice',
    '["do que", "que", "a", "de"]',
    'a',
    'O verbo "preferir" exige a preposição "a" (preferir algo A algo). Evite usar "do que".', 10),

    (quiz_id, 'O verbo "visar" no sentido de "almejar" exige qual preposição?', 'multiple_choice',
    '["a", "em", "de", "por"]',
    'a',
    'O verbo "visar" no sentido de "almejar" é transitivo indireto e exige a preposição "a".', 10),

    (quiz_id, 'Qual está correto: "Aspiro _____ uma vida melhor"?', 'multiple_choice',
    '["a", "por", "em", "de"]',
    'a',
    'O verbo "aspirar" no sentido de "almejar" exige a preposição "a" (aspirar A algo).', 10),

    (quiz_id, 'O verbo "obedecer" exige qual complemento?', 'multiple_choice',
    '["Objeto direto", "Objeto indireto", "Predicativo", "Adjunto adverbial"]',
    'Objeto indireto',
    'O verbo "obedecer" é transitivo indireto e exige objeto indireto com a preposição "a".', 10)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- QUESTÕES ADICIONAIS - ORTOGRAFIA (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%Ortografia%' LIMIT 1;

  IF quiz_id IS NOT NULL THEN
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
    (quiz_id, 'Qual a forma correta?', 'multiple_choice',
    '["Beneficiente", "Beneficente", "Benefiscente", "Beneficiente"]',
    'Beneficente',
    'A forma correta é "beneficente" (com "e" após o "c").', 10),

    (quiz_id, 'Como se escreve corretamente?', 'multiple_choice',
    '["Xuxu", "Chuchu", "Xuchu", "Chuxu"]',
    'Chuchu',
    'A forma correta é "chuchu" (com "ch").', 10),

    (quiz_id, 'Qual está correta?', 'multiple_choice',
    '["Privilégio", "Previlégio", "Privilégio", "Previllégio"]',
    'Privilégio',
    'A forma correta é "privilégio" (com "i" após pr e acento agudo em é).', 10),

    (quiz_id, 'Como se escreve?', 'multiple_choice',
    '["Ancioso", "Ansioso", "Ânsioso", "Ançioso"]',
    'Ansioso',
    'A forma correta é "ansioso" (com "s").', 10),

    (quiz_id, 'Qual a grafia correta?', 'multiple_choice',
    '["Exceção", "Excessão", "Esceção", "Essceção"]',
    'Exceção',
    'A forma correta é "exceção" (com "xc").', 10)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- QUESTÕES ADICIONAIS - PONTUAÇÃO (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%Pontuação%' LIMIT 1;

  IF quiz_id IS NOT NULL THEN
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
    (quiz_id, 'Quando usar vírgula antes do "e"?', 'multiple_choice',
    '["Nunca", "Sempre", "Quando os sujeitos são diferentes", "Apenas no início da frase"]',
    'Quando os sujeitos são diferentes',
    'Usa-se vírgula antes de "e" quando os sujeitos das orações são diferentes ou para evitar ambiguidade.', 10),

    (quiz_id, 'O ponto e vírgula é usado para:', 'multiple_choice',
    '["Separar orações coordenadas longas", "Finalizar frases", "Indicar citações", "Substituir vírgulas sempre"]',
    'Separar orações coordenadas longas',
    'O ponto e vírgula separa orações coordenadas mais longas ou complexas.', 10),

    (quiz_id, 'Quando usar dois-pontos?', 'multiple_choice',
    '["Antes de enumeração ou citação", "No final de frases", "Para substituir vírgulas", "Apenas em diálogos"]',
    'Antes de enumeração ou citação',
    'Os dois-pontos introduzem enumeração, citação, explicação ou esclarecimento.', 10),

    (quiz_id, 'As reticências indicam:', 'multiple_choice',
    '["Interrupção ou suspensão do pensamento", "Fim de parágrafo", "Erro de digitação", "Ênfase absoluta"]',
    'Interrupção ou suspensão do pensamento',
    'As reticências indicam interrupção, suspensão do pensamento ou hesitação.', 10),

    (quiz_id, 'O travessão pode ser usado para:', 'multiple_choice',
    '["Indicar mudança de interlocutor", "Substituir vírgulas", "Finalizar frases", "Iniciar parágrafos"]',
    'Indicar mudança de interlocutor',
    'O travessão indica mudança de interlocutor em diálogos ou pode isolar explicações (como o parêntese).', 10)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- QUESTÕES ADICIONAIS - ACENTUAÇÃO (5 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%Acentuação%' LIMIT 1;

  IF quiz_id IS NOT NULL THEN
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
    (quiz_id, 'A palavra "heroico" tem acento?', 'multiple_choice',
    '["Sim, é heróico", "Não", "Sim, é heroíco", "Depende do contexto"]',
    'Não',
    'Após o Acordo Ortográfico, ditongos abertos "ei" e "oi" em paroxítonas não são mais acentuados.', 10),

    (quiz_id, 'Por que "conteúdo" é acentuada?', 'multiple_choice',
    '["Hiato com u tônico", "Oxítona terminada em o", "Proparoxítona", "Ditongo aberto"]',
    'Hiato com u tônico',
    'Acentua-se o "u" tônico em hiato precedido de vogal (con-te-ú-do).', 10),

    (quiz_id, 'A palavra "assembleia" tem acento?', 'multiple_choice',
    '["Sim, assembléia", "Não", "Sim, assembleía", "Depende"]',
    'Não',
    'Após o Acordo Ortográfico, "assembleia" não tem mais acento (ditongo aberto ei em paroxítona).', 10),

    (quiz_id, 'Por que "pôr" (verbo) tem acento?', 'multiple_choice',
    '["Para diferenciar de por (preposição)", "Porque é oxítona", "Porque é proparoxítona", "Não tem acento"]',
    'Para diferenciar de por (preposição)',
    'O verbo "pôr" recebe acento diferencial para distinguir da preposição "por".', 10),

    (quiz_id, 'Qual palavra está correta?', 'multiple_choice',
    '["Vôo", "Voo", "Voô", "Vóo"]',
    'Voo',
    'Após o Acordo Ortográfico, "voo" não tem mais acento circunflexo.', 10)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

SELECT
  q.id,
  q.title,
  t.name as topic_name,
  COUNT(qq.id) as total_questoes
FROM quizzes q
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
LEFT JOIN topics t ON q.topic_id = t.id
LEFT JOIN subjects s ON t.subject_id = s.id
WHERE s.name = 'Português'
  AND q.title IN (
    SELECT title FROM quizzes
    WHERE title LIKE '%Regência%'
       OR title LIKE '%Ortografia%'
       OR title LIKE '%Pontuação%'
       OR title LIKE '%Acentuação%'
  )
GROUP BY q.id, q.title, t.name
ORDER BY t.name, q.title;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Total de questões adicionadas: 20
-- Distribuição: 5 por tópico (Regência, Ortografia, Pontuação, Acentuação)
-- ============================================
