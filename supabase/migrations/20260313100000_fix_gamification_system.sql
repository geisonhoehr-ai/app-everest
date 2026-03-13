-- =====================================================
-- FIX: Gamification system - broken RPCs, trigger, types
-- Applied directly via Management API on 2026-03-13
-- =====================================================

-- 1. Drop broken trigger that references nonexistent users.total_xp column
DROP TRIGGER IF EXISTS trigger_update_total_xp ON public.scores;
DROP FUNCTION IF EXISTS public.update_user_total_xp();

-- 2. Fix activity_id column type (was UUID, should be TEXT for lesson IDs etc)
ALTER TABLE public.scores ALTER COLUMN activity_id TYPE TEXT USING activity_id::TEXT;

-- 3. Drop old add_user_score overload with wrong param types/order
DROP FUNCTION IF EXISTS public.add_user_score(uuid, integer, character varying, uuid);
DROP FUNCTION IF EXISTS public.add_user_score(uuid, text, integer, text);

-- 4. Recreate add_user_score with correct types
CREATE OR REPLACE FUNCTION public.add_user_score(
    p_user_id UUID,
    p_activity_type TEXT,
    p_score_value INTEGER,
    p_activity_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    score_id UUID;
BEGIN
    INSERT INTO public.scores (user_id, activity_type, activity_id, score_value)
    VALUES (p_user_id, p_activity_type, p_activity_id, p_score_value)
    RETURNING id INTO score_id;
    RETURN score_id::TEXT;
END;
$$;

-- 5. Drop duplicate get_ranking_by_activity_type (old had 'as' as alias = SQL reserved word)
DROP FUNCTION IF EXISTS public.get_ranking_by_activity_type(character varying, INTEGER);
DROP FUNCTION IF EXISTS public.get_ranking_by_activity_type(TEXT, INTEGER);

-- 6. Recreate get_ranking_by_activity_type with proper alias
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
        SELECT s.user_id, COALESCE(SUM(s.score_value), 0) as total_xp_activity
        FROM public.scores s
        WHERE s.activity_type = p_activity_type
        GROUP BY s.user_id
    ),
    general_scores AS (
        SELECT s.user_id, COALESCE(SUM(s.score_value), 0) as total_xp_general
        FROM public.scores s
        GROUP BY s.user_id
    ),
    ranked_activity AS (
        SELECT
            act.user_id,
            act.total_xp_activity,
            COALESCE(gs.total_xp_general, 0) as total_xp_general,
            ROW_NUMBER() OVER (ORDER BY act.total_xp_activity DESC) as rank_position
        FROM activity_scores act
        LEFT JOIN general_scores gs ON act.user_id = gs.user_id
    )
    SELECT ra.user_id, up.first_name, up.last_name, up.email,
           ra.rank_position, ra.total_xp_activity, ra.total_xp_general
    FROM ranked_activity ra
    JOIN public.user_profiles up ON ra.user_id = up.id
    ORDER BY ra.rank_position
    LIMIT p_limit;
END;
$$;

-- 7. Fix get_user_score_history (activity_type is varchar, recorded_at is timestamp)
DROP FUNCTION IF EXISTS public.get_user_score_history(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.get_user_score_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    activity_id TEXT,
    activity_type TEXT,
    score_value INTEGER,
    recorded_at TIMESTAMP WITHOUT TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.activity_id, s.activity_type::TEXT, s.score_value, s.recorded_at
    FROM public.scores s
    WHERE s.user_id = p_user_id
    ORDER BY s.recorded_at DESC
    LIMIT p_limit;
END;
$$;

-- 8. Seed all missing achievements
INSERT INTO public.achievements (name, description, icon_url, xp_reward) VALUES
('Mestre do Conhecimento', 'Fenomenal! Voce acumulou 10.000 XP!', '👑', 100),
('Top 3', 'Parabens! Voce esta no podio - Top 3 do ranking!', '🥇', 75),
('Numero 1', 'Primeiro lugar! Voce e o #1 no ranking!', '👑', 100),
('Imparavel', 'Incrivel! 30 atividades realizadas!', '🔥', 50),
('Centuriao', 'Lendario! 100 atividades completadas!', '💯', 75),
('Primeira Aula', 'Voce assistiu sua primeira aula!', '▶️', 10),
('Assistiu 10 Aulas', 'Voce ja assistiu 10 aulas! Continue assim!', '📺', 25),
('Assistiu 50 Aulas', 'Impressionante! 50 aulas assistidas!', '🎬', 50),
('Assistiu 100 Aulas', 'Incrivel! 100 aulas assistidas!', '🏅', 75),
('Comentarista', 'Voce fez 5 comentarios em aulas!', '💬', 15),
('Participativo', 'Incrivel! 20 comentarios em aulas!', '🗣️', 30),
('Debatedor', 'Mestre dos debates! 50 comentarios!', '🎤', 50),
('Avaliador', 'Voce avaliou 10 aulas!', '⭐', 20),
('Critico', 'Critico experiente! 30 avaliacoes de aulas!', '🔍', 40),
('Flashcard Iniciante', 'Voce completou sua primeira sessao de flashcards!', '🃏', 10),
('Memoria de Elefante', 'Impressionante! 50 sessoes de flashcards!', '🐘', 50),
('Primeiro Quiz', 'Voce completou seu primeiro quiz!', '❓', 10),
('Mestre dos Quizzes', 'Mestre! 30 quizzes completados!', '🧠', 50),
('Primeiro Post', 'Voce criou seu primeiro post na comunidade!', '✍️', 10),
('Comunicador', 'Comunicador ativo! 5 posts na comunidade!', '📢', 20),
('Influencer', 'Influencer! 20 posts na comunidade!', '🌐', 40),
('Colaborador', 'Colaborador! 10 respostas na comunidade!', '🤝', 25),
('Popular', 'Popular! 50 reacoes recebidas na comunidade!', '❤️', 35),
('Simulado Completo', 'Voce completou seu primeiro simulado!', '📋', 15),
('Simulador Nato', 'Simulador nato! 10 simulados completos!', '🎯', 40),
('Escritor', 'Voce enviou sua primeira redacao!', '✏️', 10),
('Autor Dedicado', 'Autor dedicado! 5 redacoes enviadas!', '📝', 30)
ON CONFLICT (name) DO NOTHING;
