-- ==========================================================
-- TAXONOMIA COMPLETA E CORREÇÃO DE QUESTÕES
-- ==========================================================

-- 1. Inserir Estrutura de Matérias e Tópicos (Geral para Concursos)
DO $$
DECLARE
    admin_user_id uuid;
    
    -- IDs de Matérias
    subj_portugues uuid;
    subj_matematica uuid;
    subj_informatica uuid;
    subj_constitucional uuid;
    subj_administrativo uuid;
    subj_penal uuid;
    subj_atualidades uuid;
    subj_raciocinio uuid;
    subj_regulamentos uuid;

BEGIN
    -- Obter um admin ID qualquer para ser "dono"
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
    -- Fallback se não tiver usuário
    IF admin_user_id IS NULL THEN
        -- Em dev, pode acontecer de não ter users, mas vamos seguir
        -- Em prod, sempre haverá. Se der erro, é pq o banco está zerado.
    END IF;

    -- A. CRIAR MATÉRIAS (Subjects)
    
    -- Português
    INSERT INTO subjects (name, category, created_by_user_id) VALUES ('Língua Portuguesa', 'Linguagens', admin_user_id) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO subj_portugues FROM subjects WHERE name = 'Língua Portuguesa' OR name = 'Português' LIMIT 1;

    -- Matemática
    INSERT INTO subjects (name, category, created_by_user_id) VALUES ('Matemática', 'Exatas', admin_user_id) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO subj_matematica FROM subjects WHERE name = 'Matemática' LIMIT 1;

    -- Informática
    INSERT INTO subjects (name, category, created_by_user_id) VALUES ('Informática', 'Tecnologia', admin_user_id) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO subj_informatica FROM subjects WHERE name = 'Informática' LIMIT 1;

    -- Direito Constitucional
    INSERT INTO subjects (name, category, created_by_user_id) VALUES ('Direito Constitucional', 'Direito', admin_user_id) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO subj_constitucional FROM subjects WHERE name = 'Direito Constitucional' LIMIT 1;
    
    -- Direito Administrativo
    INSERT INTO subjects (name, category, created_by_user_id) VALUES ('Direito Administrativo', 'Direito', admin_user_id) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO subj_administrativo FROM subjects WHERE name = 'Direito Administrativo' LIMIT 1;

    -- Direito Penal
    INSERT INTO subjects (name, category, created_by_user_id) VALUES ('Direito Penal', 'Direito', admin_user_id) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO subj_penal FROM subjects WHERE name = 'Direito Penal' LIMIT 1;

    -- Atualidades
    INSERT INTO subjects (name, category, created_by_user_id) VALUES ('Atualidades', 'Geral', admin_user_id) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO subj_atualidades FROM subjects WHERE name = 'Atualidades' LIMIT 1;

    -- Raciocínio Lógico
    INSERT INTO subjects (name, category, created_by_user_id) VALUES ('Raciocínio Lógico', 'Exatas', admin_user_id) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO subj_raciocinio FROM subjects WHERE name = 'Raciocínio Lógico' LIMIT 1;

    -- Regulamentos (Já criado, mas garantindo)
    INSERT INTO subjects (name, category, created_by_user_id) VALUES ('Regulamentos Militares', 'Legislação', admin_user_id) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO subj_regulamentos FROM subjects WHERE name LIKE 'Regulamento%' LIMIT 1;


    -- B. CRIAR TÓPICOS (Topics)
    
    -- Português
    IF subj_portugues IS NOT NULL THEN
        INSERT INTO topics (name, subject_id, created_by_user_id) VALUES 
        ('Ortografia', subj_portugues, admin_user_id),
        ('Morfologia', subj_portugues, admin_user_id),
        ('Sintaxe', subj_portugues, admin_user_id),
        ('Pontuação', subj_portugues, admin_user_id),
        ('Crase', subj_portugues, admin_user_id),
        ('Concordância', subj_portugues, admin_user_id),
        ('Regência', subj_portugues, admin_user_id),
        ('Interpretação de Texto', subj_portugues, admin_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Matemática
    IF subj_matematica IS NOT NULL THEN
        INSERT INTO topics (name, subject_id, created_by_user_id) VALUES 
        ('Aritmética', subj_matematica, admin_user_id),
        ('Álgebra', subj_matematica, admin_user_id),
        ('Geometria', subj_matematica, admin_user_id),
        ('Porcentagem', subj_matematica, admin_user_id),
        ('Equações', subj_matematica, admin_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Informática
    IF subj_informatica IS NOT NULL THEN
        INSERT INTO topics (name, subject_id, created_by_user_id) VALUES 
        ('Hardware', subj_informatica, admin_user_id),
        ('Windows', subj_informatica, admin_user_id),
        ('Word', subj_informatica, admin_user_id),
        ('Excel', subj_informatica, admin_user_id),
        ('Internet e Redes', subj_informatica, admin_user_id),
        ('Segurança da Informação', subj_informatica, admin_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Constitucional
    IF subj_constitucional IS NOT NULL THEN
        INSERT INTO topics (name, subject_id, created_by_user_id) VALUES 
        ('Direitos Fundamentais', subj_constitucional, admin_user_id),
        ('Organização do Estado', subj_constitucional, admin_user_id),
        ('Poder Executivo', subj_constitucional, admin_user_id),
        ('Poder Legislativo', subj_constitucional, admin_user_id),
        ('Poder Judiciário', subj_constitucional, admin_user_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Regulamentos
    IF subj_regulamentos IS NOT NULL THEN
        INSERT INTO topics (name, subject_id, created_by_user_id) VALUES 
        ('RDPM', subj_regulamentos, admin_user_id),
        ('Estatuto', subj_regulamentos, admin_user_id),
        ('Procedimentos Operacionais', subj_regulamentos, admin_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

END $$;


-- 2. CORRIGIR QUESTÕES "ÓRFÃS" (Sem Tópico)
-- Se a questão tem quiz_id, tentamos pegar o tópico do Quiz pai.
DO $$
BEGIN
    UPDATE quiz_questions qq
    SET topic_id = q.topic_id
    FROM quizzes q
    WHERE qq.quiz_id = q.id 
    AND qq.topic_id IS NULL 
    AND q.topic_id IS NOT NULL;
END $$;
