-- =====================================================
-- SISTEMA DE GAMIFICAÇÃO COMPLETO - EVEREST
-- =====================================================

-- 1. Criar tabela de pontuações (scores)
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_id TEXT,
    score_value INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Criar tabela de ranks RPG (se não existir)
CREATE TABLE IF NOT EXISTS public.rpg_ranks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    min_xp INTEGER NOT NULL,
    max_xp INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Inserir ranks RPG padrão
INSERT INTO public.rpg_ranks (name, min_xp, max_xp) VALUES
('Iniciante', 0, 100),
('Estudante', 101, 300),
('Aprendiz', 301, 600),
('Especialista', 601, 1000),
('Mestre', 1001, 2000),
('Lenda', 2001, 999999)
ON CONFLICT DO NOTHING;

-- 4. Inserir conquistas padrão
INSERT INTO public.achievements (name, description, icon_url, xp_reward) VALUES
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
ON CONFLICT (name) DO NOTHING;

-- 5. Função para adicionar pontuação
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
    -- Inserir pontuação
    INSERT INTO public.scores (user_id, activity_type, activity_id, score_value)
    VALUES (p_user_id, p_activity_type, p_activity_id, p_score_value)
    RETURNING id INTO score_id;
    
    RETURN score_id::TEXT;
END;
$$;

-- 6. Função para buscar ranking geral
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
        up.first_name,
        up.last_name,
        up.email,
        ru.rank_position,
        ru.total_xp,
        up.role::TEXT
    FROM ranked_users ru
    JOIN public.user_profiles up ON ru.user_id = up.id
    ORDER BY ru.rank_position
    LIMIT p_limit;
END;
$$;

-- 7. Função para buscar posição do usuário
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
        up.first_name,
        up.last_name,
        up.email,
        ru.rank_position,
        ru.total_xp,
        up.role::TEXT
    FROM ranked_users ru
    JOIN public.user_profiles up ON ru.user_id = up.id
    WHERE ru.user_id = p_user_id;
END;
$$;

-- 8. Função para ranking por tipo de atividade
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
            as.user_id,
            as.total_xp_activity,
            COALESCE(gs.total_xp_general, 0) as total_xp_general,
            ROW_NUMBER() OVER (ORDER BY as.total_xp_activity DESC) as rank_position
        FROM activity_scores as
        LEFT JOIN general_scores gs ON as.user_id = gs.user_id
    )
    SELECT 
        ra.user_id,
        up.first_name,
        up.last_name,
        up.email,
        ra.rank_position,
        ra.total_xp_activity,
        ra.total_xp_general
    FROM ranked_activity ra
    JOIN public.user_profiles up ON ra.user_id = up.id
    ORDER BY ra.rank_position
    LIMIT p_limit;
END;
$$;

-- 9. Função para histórico de pontuação
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
        s.activity_id,
        s.activity_type,
        s.score_value,
        s.recorded_at
    FROM public.scores s
    WHERE s.user_id = p_user_id
    ORDER BY s.recorded_at DESC
    LIMIT p_limit;
END;
$$;

-- 10. Função para estatísticas de XP
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
        COUNT(*) as total_users,
        COALESCE(SUM(total_xp), 0) as total_xp_distributed,
        COALESCE(AVG(total_xp), 0) as average_xp,
        COALESCE(MAX(total_xp), 0) as max_xp,
        COALESCE(MIN(total_xp), 0) as min_xp
    FROM user_totals;
END;
$$;

-- 11. Trigger para atualizar updated_at na tabela scores
CREATE OR REPLACE FUNCTION public.handle_scores_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_scores_update
BEFORE UPDATE ON public.scores
FOR EACH ROW
EXECUTE FUNCTION public.handle_scores_update();

-- 12. Índices para performance
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_activity_type ON public.scores(activity_type);
CREATE INDEX IF NOT EXISTS idx_scores_recorded_at ON public.scores(recorded_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- 13. RLS (Row Level Security) para scores
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas próprias pontuações
CREATE POLICY "Users can view their own scores" ON public.scores
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários inserirem suas próprias pontuações
CREATE POLICY "Users can insert their own scores" ON public.scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para administradores verem todas as pontuações
CREATE POLICY "Admins can view all scores" ON public.scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'administrator'
        )
    );

-- 14. RLS para user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas próprias conquistas
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários inserirem suas próprias conquistas
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para administradores verem todas as conquistas
CREATE POLICY "Admins can view all achievements" ON public.user_achievements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'administrator'
        )
    );

-- 15. RLS para achievements (todos podem ver)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

-- 16. Inserir dados de teste (opcional - remover em produção)
-- INSERT INTO public.scores (user_id, activity_type, score_value) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'flashcard', 50),
-- ('00000000-0000-0000-0000-000000000001', 'quiz', 75),
-- ('00000000-0000-0000-0000-000000000001', 'essay', 25);

-- =====================================================
-- SISTEMA DE GAMIFICAÇÃO COMPLETO IMPLEMENTADO! 🎮
-- =====================================================
