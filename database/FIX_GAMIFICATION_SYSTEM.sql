-- =====================================================
-- CORREÇÃO COMPLETA DO SISTEMA DE GAMIFICAÇÃO
-- =====================================================
-- Execute este arquivo no Supabase SQL Editor para corrigir as funções RPC

-- PRIMEIRO: Remover funções antigas que estão com tipos de retorno incorretos
DROP FUNCTION IF EXISTS public.get_user_ranking(integer);
DROP FUNCTION IF EXISTS public.get_user_rank_position(uuid);
DROP FUNCTION IF EXISTS public.get_ranking_by_activity_type(text, integer);
DROP FUNCTION IF EXISTS public.get_user_score_history(uuid, integer);
DROP FUNCTION IF EXISTS public.get_xp_statistics();

-- 1. Corrigir função get_user_ranking
CREATE OR REPLACE FUNCTION public.get_user_ranking(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    rank_position BIGINT,
    total_xp BIGINT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_scores AS (
        SELECT 
            s.user_id,
            COALESCE(SUM(s.score_value), 0) as total_xp
        FROM public.scores s
        GROUP BY s.user_id
    ),
    ranked_users AS (
        SELECT 
            us.user_id,
            us.total_xp,
            ROW_NUMBER() OVER (ORDER BY us.total_xp DESC) as rank_position
        FROM user_scores us
    )
    SELECT 
        ru.user_id,
        u.first_name::TEXT,
        u.last_name::TEXT,
        u.email::TEXT,
        ru.rank_position,
        ru.total_xp,
        u.role::TEXT
    FROM ranked_users ru
    JOIN public.users u ON ru.user_id = u.id
    WHERE u.is_active = true
    ORDER BY ru.rank_position
    LIMIT p_limit;
END;
$$;

-- 2. Corrigir função get_user_rank_position
CREATE OR REPLACE FUNCTION public.get_user_rank_position(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    rank_position BIGINT,
    total_xp BIGINT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_scores AS (
        SELECT 
            s.user_id,
            COALESCE(SUM(s.score_value), 0) as total_xp
        FROM public.scores s
        GROUP BY s.user_id
    ),
    ranked_users AS (
        SELECT 
            us.user_id,
            us.total_xp,
            ROW_NUMBER() OVER (ORDER BY us.total_xp DESC) as rank_position
        FROM user_scores us
    )
    SELECT 
        ru.user_id,
        u.first_name::TEXT,
        u.last_name::TEXT,
        u.email::TEXT,
        ru.rank_position,
        ru.total_xp,
        u.role::TEXT
    FROM ranked_users ru
    JOIN public.users u ON ru.user_id = u.id
    WHERE ru.user_id = p_user_id;
END;
$$;

-- 3. Corrigir função get_ranking_by_activity_type
CREATE OR REPLACE FUNCTION public.get_ranking_by_activity_type(
    p_activity_type TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    rank_position BIGINT,
    total_xp_activity BIGINT,
    total_xp_general BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH activity_scores AS (
        SELECT 
            s.user_id,
            COALESCE(SUM(s.score_value), 0) as total_xp_activity
        FROM public.scores s
        WHERE s.activity_type = p_activity_type
        GROUP BY s.user_id
    ),
    general_scores AS (
        SELECT 
            s.user_id,
            COALESCE(SUM(s.score_value), 0) as total_xp_general
        FROM public.scores s
        GROUP BY s.user_id
    ),
    ranked_activity AS (
        SELECT 
            act_scores.user_id,
            act_scores.total_xp_activity,
            COALESCE(gs.total_xp_general, 0) as total_xp_general,
            ROW_NUMBER() OVER (ORDER BY act_scores.total_xp_activity DESC) as rank_position
        FROM activity_scores act_scores
        LEFT JOIN general_scores gs ON act_scores.user_id = gs.user_id
    )
    SELECT 
        ra.user_id,
        u.first_name::TEXT,
        u.last_name::TEXT,
        u.email::TEXT,
        ra.rank_position,
        ra.total_xp_activity,
        ra.total_xp_general
    FROM ranked_activity ra
    JOIN public.users u ON ra.user_id = u.id
    WHERE u.is_active = true
    ORDER BY ra.rank_position
    LIMIT p_limit;
END;
$$;

-- 4. Corrigir função get_user_score_history
CREATE OR REPLACE FUNCTION public.get_user_score_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    activity_id TEXT,
    activity_type TEXT,
    score_value INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.activity_id::TEXT,
        s.activity_type,
        s.score_value,
        s.recorded_at
    FROM public.scores s
    WHERE s.user_id = p_user_id
    ORDER BY s.recorded_at DESC
    LIMIT p_limit;
END;
$$;

-- 5. Corrigir função get_xp_statistics
CREATE OR REPLACE FUNCTION public.get_xp_statistics()
RETURNS TABLE (
    total_users BIGINT,
    total_xp_distributed BIGINT,
    average_xp NUMERIC,
    max_xp BIGINT,
    min_xp BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_totals AS (
        SELECT 
            s.user_id,
            SUM(s.score_value) as total_xp
        FROM public.scores s
        GROUP BY s.user_id
    )
    SELECT 
        COUNT(*)::BIGINT as total_users,
        COALESCE(SUM(total_xp), 0)::BIGINT as total_xp_distributed,
        COALESCE(AVG(total_xp), 0)::BIGINT as average_xp,
        COALESCE(MAX(total_xp), 0)::BIGINT as max_xp,
        COALESCE(MIN(total_xp), 0)::BIGINT as min_xp
    FROM user_totals;
END;
$$;

-- 6. Inserir conquistas padrão (se não existirem)
INSERT INTO public.achievements (name, description, icon_url, xp_reward)
SELECT * FROM (VALUES
('Primeiro Login', 'Bem-vindo ao Everest! Você fez seu primeiro login.', '🎉', 10),
('Estudante Dedicado', 'Parabéns! Você alcançou 100 XP de aprendizado.', '📚', 25),
('Top 10', 'Incrível! Você está entre os 10 melhores estudantes.', '🏆', 50),
('Maratonista', 'Impressionante! Você completou 7 sessões de estudo.', '🏃', 30),
('Especialista', 'Excelente! Você dominou o conhecimento com 500 XP.', '💎', 75),
('Mestre', 'Fantástico! Você é um mestre com 1000 XP.', '👑', 100),
('Lenda', 'Lendário! Você é uma lenda com 2000 XP.', '🌟', 150),
('Flashcard Master', 'Você dominou os flashcards!', '🎯', 40),
('Quiz Champion', 'Campeão dos quizzes!', '⚡', 35),
('Streak Master', 'Você manteve uma sequência de estudos!', '🔥', 60)
) AS v(name, description, icon_url, xp_reward)
WHERE NOT EXISTS (SELECT 1 FROM public.achievements WHERE achievements.name = v.name);

-- 7. Inserir ranks RPG (se não existirem)
INSERT INTO public.rpg_ranks (name, min_xp, max_xp)
SELECT * FROM (VALUES
('Iniciante', 0, 100),
('Estudante', 101, 300),
('Aprendiz', 301, 600),
('Especialista', 601, 1000),
('Mestre', 1001, 2000),
('Lenda', 2001, 999999)
) AS v(name, min_xp, max_xp)
WHERE NOT EXISTS (SELECT 1 FROM public.rpg_ranks WHERE rpg_ranks.name = v.name);

-- 8. Inserir dados de teste (opcional - remover em produção)
-- Descomente as linhas abaixo para inserir dados de teste
/*
INSERT INTO public.scores (user_id, activity_type, score_value) VALUES
('00000000-0000-0000-0000-000000000001', 'flashcard', 50),
('00000000-0000-0000-0000-000000000001', 'quiz', 75),
('00000000-0000-0000-0000-000000000001', 'essay', 25),
('00000000-0000-0000-0000-000000000002', 'flashcard', 30),
('00000000-0000-0000-0000-000000000002', 'quiz', 45),
('00000000-0000-0000-0000-000000000003', 'flashcard', 80),
('00000000-0000-0000-0000-000000000003', 'quiz', 60),
('00000000-0000-0000-0000-000000000003', 'essay', 40);
*/

-- =====================================================
-- SISTEMA DE GAMIFICAÇÃO CORRIGIDO! 🎮
-- =====================================================
