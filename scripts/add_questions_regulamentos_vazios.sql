-- ============================================
-- SCRIPT PARA ADICIONAR QUESTÕES - REGULAMENTOS VAZIOS
-- ============================================
-- Data: 2025-10-19
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Este script adiciona questões aos quizzes vazios de Regulamentos

-- ============================================
-- QUESTÕES - LEI 13.954/2019 (10 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%13.954%' LIMIT 1;

  IF quiz_id IS NOT NULL THEN
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
    (quiz_id, 'O que a Lei 13.954/2019 regulamenta?', 'multiple_choice',
    '["Sistema de proteção social dos militares", "Estrutura hierárquica", "Regulamento de voos", "Apenas pensões"]',
    'Sistema de proteção social dos militares',
    'A Lei 13.954/2019 reestrutura o sistema de proteção social dos militares das Forças Armadas.', 10),

    (quiz_id, 'Qual o principal objetivo da Lei 13.954/2019?', 'multiple_choice',
    '["Aumentar salários", "Modernizar carreiras e adequar remunerações", "Criar novos postos", "Extinguir funções"]',
    'Modernizar carreiras e adequar remunerações',
    'A lei visa modernizar as carreiras militares e adequar as remunerações ao Sistema de Proteção Social.', 10),

    (quiz_id, 'A Lei 13.954/2019 se aplica a:', 'multiple_choice',
    '["Apenas ao Exército", "Apenas à Marinha", "Apenas à Aeronáutica", "Todas as Forças Armadas"]',
    'Todas as Forças Armadas',
    'A lei se aplica aos militares do Exército, Marinha e Aeronáutica.', 10),

    (quiz_id, 'Qual benefício é tratado pela Lei 13.954/2019?', 'multiple_choice',
    '["Apenas pensão", "Apenas saúde", "Pensão, saúde e outros benefícios sociais", "Apenas licenças"]',
    'Pensão, saúde e outros benefícios sociais',
    'A lei trata do sistema de proteção social que inclui pensões, saúde e outros benefícios.', 10),

    (quiz_id, 'A Lei 13.954/2019 estabelece regras para:', 'multiple_choice',
    '["Apenas ativos", "Apenas inativos", "Ativos e inativos", "Apenas pensionistas"]',
    'Ativos e inativos',
    'A lei estabelece regras para militares da ativa e da reserva/reforma.', 10),

    (quiz_id, 'Em que ano foi promulgada a Lei que reestruturou as carreiras militares?', 'multiple_choice',
    '["2018", "2019", "2020", "2021"]',
    '2019',
    'A Lei 13.954 foi promulgada em 2019.', 10),

    (quiz_id, 'A Lei 13.954/2019 trata de qual aspecto da carreira militar?', 'multiple_choice',
    '["Apenas promoções", "Apenas transferências", "Remuneração e proteção social", "Apenas disciplina"]',
    'Remuneração e proteção social',
    'A lei foca na reestruturação da remuneração e do sistema de proteção social dos militares.', 10),

    (quiz_id, 'Qual Forças Armadas foi incluída na reforma da Lei 13.954/2019?', 'multiple_choice',
    '["Apenas terrestre", "Apenas naval", "Apenas aérea", "Todas (Exército, Marinha e Aeronáutica)"]',
    'Todas (Exército, Marinha e Aeronáutica)',
    'A lei abrange todas as três Forças: Exército, Marinha e Aeronáutica.', 10),

    (quiz_id, 'A Lei 13.954/2019 alterou o sistema de:', 'multiple_choice',
    '["Apenas aposentadoria", "Apenas pensão", "Proteção social completo", "Apenas saúde"]',
    'Proteção social completo',
    'A lei reformulou todo o sistema de proteção social dos militares.', 10),

    (quiz_id, 'Qual o impacto principal da Lei 13.954/2019?', 'multiple_choice',
    '["Redução de efetivo", "Modernização das carreiras", "Extinção de postos", "Criação de novas Forças"]',
    'Modernização das carreiras',
    'O principal impacto foi a modernização das carreiras militares e do sistema de proteção social.', 10)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- QUESTÕES - PORTARIA GM-MD Nº 1.143/2022 (10 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%Portaria%1.143%' LIMIT 1;

  IF quiz_id IS NOT NULL THEN
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
    (quiz_id, 'O que a Portaria GM-MD Nº 1.143/2022 regulamenta?', 'multiple_choice',
    '["Normas de conduta militar", "Sistema de avaliação", "Regulamento disciplinar", "Promoções"]',
    'Normas de conduta militar',
    'A Portaria estabelece normas de conduta e ética para os militares.', 10),

    (quiz_id, 'Quem emitiu a Portaria GM-MD Nº 1.143/2022?', 'multiple_choice',
    '["Ministério da Defesa", "Presidente da República", "Comandante do Exército", "Congresso Nacional"]',
    'Ministério da Defesa',
    'A Portaria foi emitida pelo Gabinete do Ministro da Defesa (GM-MD).', 10),

    (quiz_id, 'Em que ano foi publicada a Portaria GM-MD Nº 1.143?', 'multiple_choice',
    '["2020", "2021", "2022", "2023"]',
    '2022',
    'A Portaria GM-MD Nº 1.143 foi publicada em 2022.', 10),

    (quiz_id, 'A Portaria GM-MD Nº 1.143/2022 se aplica a:', 'multiple_choice',
    '["Apenas oficiais", "Apenas praças", "Todos os militares", "Apenas generais"]',
    'Todos os militares',
    'A Portaria se aplica a todos os militares das Forças Armadas.', 10),

    (quiz_id, 'Qual o objetivo principal da Portaria GM-MD Nº 1.143/2022?', 'multiple_choice',
    '["Aumentar salários", "Padronizar condutas", "Criar novos cargos", "Extinguir funções"]',
    'Padronizar condutas',
    'O objetivo é padronizar condutas e normas éticas entre as Forças Armadas.', 10),

    (quiz_id, 'A Portaria GM-MD Nº 1.143/2022 trata de:', 'multiple_choice',
    '["Apenas questões administrativas", "Apenas questões operacionais", "Ética e conduta profissional", "Apenas saúde"]',
    'Ética e conduta profissional',
    'A Portaria estabelece diretrizes de ética e conduta profissional militar.', 10),

    (quiz_id, 'Qual a abrangência da Portaria GM-MD Nº 1.143/2022?', 'multiple_choice',
    '["Apenas Exército", "Apenas Marinha", "Apenas Aeronáutica", "Todas as Forças Armadas"]',
    'Todas as Forças Armadas',
    'A Portaria tem abrangência em todas as três Forças Armadas.', 10),

    (quiz_id, 'A Portaria GM-MD Nº 1.143/2022 complementa:', 'multiple_choice',
    '["Apenas leis civis", "Estatuto dos Militares e outras normas", "Apenas códigos penais", "Nenhuma norma"]',
    'Estatuto dos Militares e outras normas',
    'A Portaria complementa o Estatuto dos Militares e outras normas correlatas.', 10),

    (quiz_id, 'Qual aspecto a Portaria GM-MD Nº 1.143/2022 NÃO regula?', 'multiple_choice',
    '["Conduta ética", "Relacionamento profissional", "Salários e remunerações", "Comportamento institucional"]',
    'Salários e remunerações',
    'A Portaria trata de conduta e ética, não de questões remuneratórias.', 10),

    (quiz_id, 'A Portaria GM-MD Nº 1.143/2022 visa:', 'multiple_choice',
    '["Enfraquecer a hierarquia", "Fortalecer valores éticos e disciplina", "Reduzir exigências", "Eliminar regras"]',
    'Fortalecer valores éticos e disciplina',
    'A Portaria visa fortalecer os valores éticos e a disciplina militar.', 10)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- QUESTÕES - RCA 34-1 (10 questões)
-- ============================================

DO $$
DECLARE
  quiz_id uuid;
BEGIN
  SELECT id INTO quiz_id FROM quizzes WHERE title LIKE '%RCA 34-1%' LIMIT 1;

  IF quiz_id IS NOT NULL THEN
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
    (quiz_id, 'O que significa a sigla RCA?', 'multiple_choice',
    '["Regulamento do Comando da Aeronáutica", "Regimento de Controle Aéreo", "Regulamento de Cadastro Aéreo", "Registro de Controle Aeronáutico"]',
    'Regulamento do Comando da Aeronáutica',
    'RCA significa Regulamento do Comando da Aeronáutica.', 10),

    (quiz_id, 'O RCA 34-1 trata especificamente de:', 'multiple_choice',
    '["Voos comerciais", "Segurança operacional", "Apenas manutenção", "Apenas pilotos civis"]',
    'Segurança operacional',
    'O RCA 34-1 estabelece normas de segurança operacional na Aeronáutica.', 10),

    (quiz_id, 'Qual o objetivo principal do RCA 34-1?', 'multiple_choice',
    '["Aumentar lucros", "Prevenir acidentes aeronáuticos", "Contratar pessoal", "Vender aeronaves"]',
    'Prevenir acidentes aeronáuticos',
    'O objetivo principal é prevenir acidentes e incidentes aeronáuticos.', 10),

    (quiz_id, 'O RCA 34-1 se aplica a:', 'multiple_choice',
    '["Apenas aviação civil", "Apenas aviação militar", "Toda aviação brasileira", "Apenas helicópteros"]',
    'Toda aviação brasileira',
    'O RCA 34-1 estabelece normas aplicáveis a toda aviação no Brasil.', 10),

    (quiz_id, 'Quem é responsável pela fiscalização do cumprimento do RCA 34-1?', 'multiple_choice',
    '["ANAC apenas", "Comando da Aeronáutica", "Polícia Federal", "ANVISA"]',
    'Comando da Aeronáutica',
    'O Comando da Aeronáutica fiscaliza o cumprimento das normas de segurança.', 10),

    (quiz_id, 'O RCA 34-1 estabelece normas para:', 'multiple_choice',
    '["Apenas acidentes", "Prevenção e investigação de acidentes", "Apenas manutenção", "Apenas treinamento"]',
    'Prevenção e investigação de acidentes',
    'O regulamento trata tanto da prevenção quanto da investigação de acidentes aeronáuticos.', 10),

    (quiz_id, 'Qual a importância do RCA 34-1 para a aviação?', 'multiple_choice',
    '["Aumentar velocidade", "Garantir segurança operacional", "Reduzir custos", "Aumentar passageiros"]',
    'Garantir segurança operacional',
    'O RCA 34-1 é fundamental para garantir a segurança das operações aéreas.', 10),

    (quiz_id, 'O RCA 34-1 define procedimentos para:', 'multiple_choice',
    '["Apenas decolagem", "Apenas pouso", "Toda operação aérea", "Apenas táxi"]',
    'Toda operação aérea',
    'O regulamento define procedimentos para todas as fases da operação aérea.', 10),

    (quiz_id, 'Quem deve conhecer o RCA 34-1?', 'multiple_choice',
    '["Apenas pilotos", "Apenas mecânicos", "Todos profissionais da aviação", "Apenas controladores"]',
    'Todos profissionais da aviação',
    'Todos os profissionais da aviação devem conhecer as normas de segurança do RCA 34-1.', 10),

    (quiz_id, 'O RCA 34-1 contribui para:', 'multiple_choice',
    '["Aumentar acidentes", "Cultura de segurança operacional", "Reduzir treinamento", "Eliminar regras"]',
    'Cultura de segurança operacional',
    'O RCA 34-1 promove e fortalece a cultura de segurança operacional na aviação.', 10)
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
WHERE s.name IN ('Regulamentos', 'Regulamentos Militares')
  AND (q.title LIKE '%13.954%' OR q.title LIKE '%Portaria%1.143%' OR q.title LIKE '%RCA 34-1%')
GROUP BY q.id, q.title, t.name
ORDER BY t.name, q.title;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Total de questões adicionadas: 30
-- Lei 13.954/2019: 10 questões
-- Portaria GM-MD Nº 1.143/2022: 10 questões
-- RCA 34-1: 10 questões
-- ============================================
