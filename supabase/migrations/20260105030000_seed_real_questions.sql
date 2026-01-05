-- Add topic_id to quiz_questions if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'quiz_questions' AND column_name = 'topic_id'
    ) THEN 
        ALTER TABLE quiz_questions ADD COLUMN topic_id uuid REFERENCES topics(id);
    END IF; 
END $$;                
        

DO $$
DECLARE
    subject_portugues_id uuid;
    subject_regulamentos_id uuid;
    topic_crase_id uuid;
    topic_pontuacao_id uuid;
    topic_reg_geral_id uuid;
    admin_user_id uuid;
    
    quiz_portugues_id uuid;
    quiz_regulamentos_id uuid;
BEGIN
    -- Get an admin user ID (fallback to first found user if specific email not found)
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;

    -- 1. Create Subjects (if not exist)
    INSERT INTO subjects (name, category, created_by_user_id)
    VALUES ('Português', 'Linguagens', admin_user_id)
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO subjects (name, category, created_by_user_id)
    VALUES ('Regulamentos', 'Legislação', admin_user_id)
    ON CONFLICT (name) DO NOTHING;

    -- Get Subject IDs
    SELECT id INTO subject_portugues_id FROM subjects WHERE name = 'Português';
    SELECT id INTO subject_regulamentos_id FROM subjects WHERE name = 'Regulamentos';

    -- 2. Create Topics (if not exist)
    INSERT INTO topics (name, subject_id, created_by_user_id)
    VALUES ('Crase', subject_portugues_id, admin_user_id), ('Pontuação', subject_portugues_id, admin_user_id)
    ON CONFLICT DO NOTHING; 

    INSERT INTO topics (name, subject_id, created_by_user_id)
    VALUES ('Regulamento Disciplinar', subject_regulamentos_id, admin_user_id)
    ON CONFLICT DO NOTHING;

    -- Get Topic IDs
    SELECT id INTO topic_crase_id FROM topics WHERE name = 'Crase' AND subject_id = subject_portugues_id LIMIT 1;
    SELECT id INTO topic_pontuacao_id FROM topics WHERE name = 'Pontuação' AND subject_id = subject_portugues_id LIMIT 1;
    SELECT id INTO topic_reg_geral_id FROM topics WHERE name = 'Regulamento Disciplinar' AND subject_id = subject_regulamentos_id LIMIT 1;

    -- 2.5 Ensure Quizzes Exist (Need quiz_id for questions now)
    INSERT INTO quizzes (title, topic_id, created_by_user_id, description, duration_minutes)
    VALUES ('Quiz Banco de Questões - Português', topic_crase_id, admin_user_id, 'Banco Geral de Português', 999)
    ON CONFLICT DO NOTHING; -- Assuming title unique not enforced, but avoiding dups ideally

    INSERT INTO quizzes (title, topic_id, created_by_user_id, description, duration_minutes)
    VALUES ('Quiz Banco de Questões - Regulamentos', topic_reg_geral_id, admin_user_id, 'Banco Geral de Regulamentos', 999)
    ON CONFLICT DO NOTHING;

    -- Get Quiz IDs
    SELECT id INTO quiz_portugues_id FROM quizzes WHERE title = 'Quiz Banco de Questões - Português' LIMIT 1;
    SELECT id INTO quiz_regulamentos_id FROM quizzes WHERE title = 'Quiz Banco de Questões - Regulamentos' LIMIT 1;


    -- 3. Insert Questions (Português - Crase)
    INSERT INTO quiz_questions (topic_id, quiz_id, question_text, options, correct_answer, explanation, points, question_type)
    VALUES 
    (topic_crase_id, quiz_portugues_id,
    'Assinale a alternativa em que o uso do acento grave indicativo de crase é obrigatório.',
    '["Fui a farmácia comprar remédios.", "Fui a pé para o trabalho.", "Fui a uma festa ontem.", "Fui a Brasília visitar parentes."]',
    'Fui a farmácia comprar remédios.',
    'Quem vai, vai A algum lugar (preposição "a") + artigo definido feminino "a" que antecede "farmácia". A + A = À. Nas outras: "pé" é masculino, "uma" é artigo indefinido, "Brasília" não aceita artigo (quem vem de Brasília, não da Brasília).',
    1, 'multiple_choice'),

    (topic_crase_id, quiz_portugues_id,
    'O uso da crase está INCORRETO em:',
    '["Entreguei o relatório à diretora.", "Estamos à espera de um milagre.", "Ouvimos tudo à distância.", "Escrevi a redação a caneta."]',
    'Escrevi a redação a caneta.',
    'Não ocorre crase antes de palavras femininas tomadas em sentido genérico ou indeterminado, nem em locuções adverbiais de instrumento (a caneta, a lápis, a máquina, a faca), exceto se houver ambiguidade, o que não é o caso.',
    1, 'multiple_choice');

    -- 3. Insert Questions (Português - Pontuação)
    INSERT INTO quiz_questions (topic_id, quiz_id, question_text, options, correct_answer, explanation, points, question_type)
    VALUES 
    (topic_pontuacao_id, quiz_portugues_id,
    'Assinale a alternativa em que a vírgula foi empregada para isolar um aposto.',
    '["Brasília, a capital do Brasil, é uma cidade planejada.", "João, venha aqui!", "Comprei maçãs, uvas, peras e laranjas.", "Na semana passada, choveu muito."]',
    'Brasília, a capital do Brasil, é uma cidade planejada.',
    '"A capital do Brasil" é um aposto explicativo, termo que explica ou especifica o termo anterior (Brasília), e deve vir isolado por vírgulas.',
    1, 'multiple_choice');

    -- 3. Insert Questions (Regulamentos)
    INSERT INTO quiz_questions (topic_id, quiz_id, question_text, options, correct_answer, explanation, points, question_type)
    VALUES 
    (topic_reg_geral_id, quiz_regulamentos_id,
    'Constitui transgressão disciplinar grave, segundo o Regulamento Disciplinar:',
    '["Chegar atrasado ao serviço sem justificativa.", "Faltar à verdade na apuração dos fatos.", "Apresentar-se uniformizado incorretamente.", "Deixar de prestar continência a superior."]',
    'Faltar à verdade na apuração dos fatos.',
    'Faltar com a verdade é considerado uma violação grave dos valores e da ética militar/institucional, comprometendo a confiança e a justiça.',
    1, 'multiple_choice'),
    
    (topic_reg_geral_id, quiz_regulamentos_id,
    'Sobre a hierarquia e disciplina, é correto afirmar:',
    '["A disciplina é a rigorosa observância e o acatamento integral das leis.", "A hierarquia é a ordenação da autoridade apenas em níveis pares.", "O respeito à hierarquia impede a manifestação de pensamento.", "A disciplina é facultativa fora do horário de serviço."]',
    'A disciplina é a rigorosa observância e o acatamento integral das leis.',
    'Definição clássica de disciplina militar: a exata observância das leis, regulamentos, normas e disposições, traduzindo-se pelo perfeito cumprimento do dever.',
    1, 'multiple_choice');

END $$;
