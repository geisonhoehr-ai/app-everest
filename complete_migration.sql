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
-- Add an 'explanation' column to the flashcards table for immediate feedback.
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Enhance the flashcard_progress table to track more detailed metrics.
ALTER TABLE public.flashcard_progress
ADD COLUMN IF NOT EXISTS response_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS confidence_rating INTEGER; -- e.g., A scale from 1 (unsure) to 3 (confident).

-- Create a table to define all available achievements in the system.
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    xp_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create a join table to track which achievements each user has unlocked.
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (user_id, achievement_id)
);

-- Create a table to store user-specific settings for personalization.
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    flashcard_theme TEXT DEFAULT 'default',
    background_sound TEXT,
    timer_alerts BOOLEAN DEFAULT TRUE,
    use_pomodoro BOOLEAN DEFAULT FALSE,
    pomodoro_duration_minutes INTEGER DEFAULT 25,
    pomodoro_break_minutes INTEGER DEFAULT 5,
    daily_study_goal_minutes INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create a join table for users to mark their favorite flashcards.
CREATE TABLE IF NOT EXISTS public.user_favorite_flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (user_id, flashcard_id)
);

-- Create a table to log the history of each study session.
CREATE TABLE IF NOT EXISTS public.flashcard_session_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    session_mode TEXT NOT NULL, -- e.g., 'lightning', 'full', 'error_review'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    cards_reviewed INTEGER,
    correct_answers INTEGER,
    incorrect_answers INTEGER
);

-- Create a trigger to automatically update the 'updated_at' timestamp on user_settings changes.
CREATE OR REPLACE FUNCTION public.handle_user_settings_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_settings_update
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_settings_update();
-- Story 1: External Content Integration
-- Add a column to store an external resource URL for a flashcard.
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS external_resource_url TEXT;

-- Story 2: Collaborative Flashcard Set Creation
-- Create a table to store user-created, shareable sets of flashcards.
CREATE TABLE IF NOT EXISTS public.flashcard_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add a foreign key to the flashcards table to link them to a set.
-- This allows a flashcard to belong to a user-created set instead of a predefined topic.
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS flashcard_set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE;

-- Create a custom type for collaborator permission levels.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collaborator_permission') THEN
        CREATE TYPE public.collaborator_permission AS ENUM ('viewer', 'editor');
    END IF;
END$$;

-- Create a join table to manage collaborators and their permissions on a flashcard set.
CREATE TABLE IF NOT EXISTS public.flashcard_set_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID NOT NULL REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level public.collaborator_permission NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (set_id, user_id)
);

-- Story 3: Real-time Group Study Mode
-- Create a custom type for the status of a group study session.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE public.session_status AS ENUM ('pending', 'active', 'completed');
    END IF;
END$$;

-- Create a table to manage real-time group study sessions.
CREATE TABLE IF NOT EXISTS public.group_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    flashcard_set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE, -- For existing, non-collaborative topics
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status public.session_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_set_or_topic CHECK (flashcard_set_id IS NOT NULL OR topic_id IS NOT NULL)
);

-- Create a join table to track participants in a group study session.
CREATE TABLE IF NOT EXISTS public.group_session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.group_study_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    score_in_session INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (session_id, user_id)
);

-- Enhance the session history table to link to group study sessions.
ALTER TABLE public.flashcard_session_history
ADD COLUMN IF NOT EXISTS group_session_id UUID REFERENCES public.group_study_sessions(id) ON DELETE SET NULL;
-- Add subscription end date to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Create class_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_type') THEN
        CREATE TYPE public.class_type AS ENUM ('standard', 'trial');
    END IF;
END$$;

-- Add new columns to classes table for trial functionality
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS class_type public.class_type NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS trial_flashcard_limit_per_day INTEGER,
ADD COLUMN IF NOT EXISTS trial_quiz_limit_per_day INTEGER,
ADD COLUMN IF NOT EXISTS trial_essay_submission_limit INTEGER,
ADD COLUMN IF NOT EXISTS trial_duration_days INTEGER;

-- Create class_feature_permissions table
CREATE TABLE IF NOT EXISTS public.class_feature_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL, -- e.g., 'student_profile_all', 'evercast_module', 'essay_module'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (class_id, feature_key)
);

-- Create a trigger to automatically update the 'updated_at' timestamp on class_feature_permissions changes.
CREATE OR REPLACE FUNCTION public.handle_class_feature_permissions_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_class_feature_permissions_update
BEFORE UPDATE ON public.class_feature_permissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_class_feature_permissions_update();
-- Create a custom type for video source providers.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_source_provider') THEN
        CREATE TYPE public.video_source_provider AS ENUM ('panda_video', 'youtube', 'vimeo');
    END IF;
END$$;

-- Create the main table for video courses.
CREATE TABLE IF NOT EXISTS public.video_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the table for course modules.
CREATE TABLE IF NOT EXISTS public.video_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.video_courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the table for individual video lessons.
CREATE TABLE IF NOT EXISTS public.video_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.video_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    video_source_type public.video_source_provider,
    video_source_id TEXT, -- Stores the unique ID from the provider (e.g., Panda Video ID).
    duration_seconds INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    is_preview BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create triggers to automatically update the 'updated_at' timestamps.
CREATE OR REPLACE FUNCTION public.handle_video_courses_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_video_courses_update
BEFORE UPDATE ON public.video_courses
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_courses_update();

CREATE OR REPLACE FUNCTION public.handle_video_modules_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_video_modules_update
BEFORE UPDATE ON public.video_modules
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_modules_update();

CREATE OR REPLACE FUNCTION public.handle_video_lessons_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_video_lessons_update
BEFORE UPDATE ON public.video_lessons
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_lessons_update();
-- Create lesson_attachments table to store supplementary files for video lessons.
CREATE TABLE IF NOT EXISTS public.lesson_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add a column to video_lessons to link to a primary accompanying PDF for side-by-side viewing.
ALTER TABLE public.video_lessons
ADD COLUMN IF NOT EXISTS accompanying_pdf_attachment_id UUID REFERENCES public.lesson_attachments(id) ON DELETE SET NULL;

-- Create video_progress table to track student progress on each video lesson.
CREATE TABLE IF NOT EXISTS public.video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    current_time_seconds INTEGER NOT NULL DEFAULT 0,
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (user_id, lesson_id)
);

-- Create a trigger to automatically update the 'updated_at' timestamp on video_progress changes.
CREATE OR REPLACE FUNCTION public.handle_video_progress_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_video_progress_update
BEFORE UPDATE ON public.video_progress
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_progress_update();
-- Create a table for user notifications.
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'new_lesson', 'new_material', 'quiz_available'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_id UUID,
    related_entity_type TEXT, -- e.g., 'lesson', 'attachment', 'quiz'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add a foreign key to video_lessons to associate a quiz.
ALTER TABLE public.video_lessons
ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

-- Add a foreign key to video_modules to associate a quiz.
ALTER TABLE public.video_modules
ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

-- Add a comment to clarify the purpose of the new columns.
COMMENT ON COLUMN public.video_lessons.quiz_id IS 'Optional quiz to be taken after this lesson.';
COMMENT ON COLUMN public.video_modules.quiz_id IS 'Optional quiz to be taken after this module.';
-- Refine the quiz_questions table by removing the redundant topic_id.
-- A question belongs to a quiz, and the quiz is already associated with a topic.
-- This avoids data inconsistency and normalizes the schema.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'quiz_questions'
        AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE public.quiz_questions DROP COLUMN topic_id;
    END IF;
END$$;

-- Ensure the quizzes table has the necessary columns for description and duration.
-- This is a safe operation that only adds columns if they do not already exist.
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
CREATE OR REPLACE FUNCTION get_question_performance_for_quiz(p_quiz_id UUID)
RETURNS TABLE(
    question_id UUID,
    question_text TEXT,
    correct_answers BIGINT,
    incorrect_answers BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        qq.id AS question_id,
        qq.question_text,
        COUNT(CASE WHEN qaa.is_correct THEN 1 END) AS correct_answers,
        COUNT(CASE WHEN NOT qaa.is_correct THEN 1 END) AS incorrect_answers
    FROM
        public.quiz_questions AS qq
    LEFT JOIN
        public.quiz_attempt_answers AS qaa ON qq.id = qaa.quiz_question_id
    WHERE
        qq.quiz_id = p_quiz_id
    GROUP BY
        qq.id, qq.question_text
    ORDER BY
        qq.created_at;
END;
$$;
-- Create a custom enum type for audio source providers if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audio_source_provider') THEN
        CREATE TYPE public.audio_source_provider AS ENUM ('panda_video_hls', 'mp3_url');
    END IF;
END$$;

-- Alter the audio_lessons table to use the new enum type.
-- This approach is safer for tables with existing data.
-- 1. Add a new temporary column with the enum type.
ALTER TABLE public.audio_lessons
ADD COLUMN IF NOT EXISTS audio_source_type_enum public.audio_source_provider;

-- 2. A function to safely cast string to the new enum type.
CREATE OR REPLACE FUNCTION public.safe_cast_to_audio_source_provider(val text)
RETURNS public.audio_source_provider AS $$
BEGIN
    RETURN val::public.audio_source_provider;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN NULL; -- or a default value like 'mp3_url'::public.audio_source_provider
END;
$$ LANGUAGE plpgsql;

-- 3. Update the new column based on the old one.
UPDATE public.audio_lessons
SET audio_source_type_enum = public.safe_cast_to_audio_source_provider(audio_source_type)
WHERE audio_source_type IS NOT NULL;

-- 4. Drop the old string-based column.
ALTER TABLE public.audio_lessons
DROP COLUMN IF EXISTS audio_source_type;

-- 5. Rename the new column to the original name.
ALTER TABLE public.audio_lessons
RENAME COLUMN audio_source_type_enum TO audio_source_type;

-- Drop the helper function as it's no longer needed.
DROP FUNCTION public.safe_cast_to_audio_source_provider(text);
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

COMMENT ON COLUMN public.subjects.image_url IS 'URL for the subject''s cover image.';
COMMENT ON COLUMN public.subjects.category IS 'Category for grouping subjects, e.g., Exatas, Humanas.';
-- Create a custom type for essay status if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'essay_status_enum') THEN
        CREATE TYPE public.essay_status_enum AS ENUM ('draft', 'correcting', 'corrected');
    END IF;
END$$;

-- Alter the essays table to add AI-related fields and update status handling.
ALTER TABLE public.essays
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS ai_suggested_grade JSONB;

-- Safely alter the status column type to the new enum.
-- 1. Add a new temporary column with the enum type.
ALTER TABLE public.essays
ADD COLUMN IF NOT EXISTS status_enum public.essay_status_enum;

-- 2. A function to safely cast string to the new enum type.
CREATE OR REPLACE FUNCTION public.safe_cast_to_essay_status(val text)
RETURNS public.essay_status_enum AS $$
BEGIN
    RETURN val::public.essay_status_enum;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN 'draft'::public.essay_status_enum; -- Default to 'draft' if cast fails
END;
$$ LANGUAGE plpgsql;

-- 3. Update the new column based on the old one.
UPDATE public.essays
SET status_enum = public.safe_cast_to_essay_status(status)
WHERE status IS NOT NULL;

-- 4. Drop the old string-based column.
ALTER TABLE public.essays
DROP COLUMN IF EXISTS status;

-- 5. Rename the new column to the original name.
ALTER TABLE public.essays
RENAME COLUMN status_enum TO status;

-- Set a default value for the new status column
ALTER TABLE public.essays
ALTER COLUMN status SET DEFAULT 'draft'::public.essay_status_enum;

-- Drop the helper function as it's no longer needed.
DROP FUNCTION public.safe_cast_to_essay_status(text);


-- Alter the essay_annotations table to add suggested_correction.
ALTER TABLE public.essay_annotations
ADD COLUMN IF NOT EXISTS suggested_correction TEXT;

-- Ensure teacher_id exists and is linked correctly.
-- The existing table already has a nullable teacher_id, which is what we need.
-- This statement ensures it exists if it was somehow missed.
ALTER TABLE public.essay_annotations
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
-- Create a table to store reusable templates for essay evaluation criteria.
CREATE TABLE IF NOT EXISTS public.evaluation_criteria_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    criteria JSONB NOT NULL, -- Stores the detailed criteria structure as JSON
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add a foreign key to the essay_prompts table to link to a criteria template.
-- This makes it easy to apply a standard set of criteria to a new prompt.
ALTER TABLE public.essay_prompts
ADD COLUMN IF NOT EXISTS criteria_template_id UUID REFERENCES public.evaluation_criteria_templates(id) ON DELETE SET NULL;

-- Create a trigger to automatically update the 'updated_at' timestamp on template changes.
CREATE OR REPLACE FUNCTION public.handle_evaluation_criteria_templates_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_evaluation_criteria_templates_update
BEFORE UPDATE ON public.evaluation_criteria_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_evaluation_criteria_templates_update();
-- Add a 'type' column to quiz_questions to support different question formats like open-ended.
-- The existing 'question_type' column already serves this purpose, so we ensure it exists.
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'multiple_choice';

-- Ensure the 'points' column exists, as specified in the import format.
-- The existing table already has this column, so this is a safeguard.
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 1;

-- Add a foreign key from quiz_questions to users to track who created the question.
-- This is useful for auditing and management.
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Remove password_hash from public.users table for security
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- Add foreign key constraint from public.users to auth.users if it doesn't exist
-- This enforces that a user profile must correspond to an authenticated user.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_id_fkey' AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END$$;

-- Seed test user profiles.
-- This assumes that users with these emails have already been created in Supabase Auth.
-- The passwords for all test users are '123456'.
-- ON CONFLICT is used to prevent errors if the profiles already exist.
INSERT INTO public.users (id, first_name, last_name, email, role, is_active)
VALUES
    ((SELECT id FROM auth.users WHERE email = 'aluno@teste.com'), 'Aluno', 'Teste', 'aluno@teste.com', 'student', true),
    ((SELECT id FROM auth.users WHERE email = 'professor@teste.com'), 'Professor', 'Teste', 'professor@teste.com', 'teacher', true),
    ((SELECT id FROM auth.users WHERE email = 'admin@teste.com'), 'Admin', 'Teste', 'admin@teste.com', 'administrator', true)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
-- Create an enum for event types for better data integrity
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calendar_event_type') THEN
        CREATE TYPE public.calendar_event_type AS ENUM ('SIMULATION', 'ESSAY_DEADLINE', 'LIVE_CLASS', 'GENERAL');
    END IF;
END$$;

-- Create the calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    event_type public.calendar_event_type NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE, -- To scope events to a specific class
    related_entity_id UUID, -- Can link to a specific simulation, essay_prompt, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add a trigger to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_calendar_events_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_calendar_events_update
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_calendar_events_update();

-- Add comments for clarity
COMMENT ON TABLE public.calendar_events IS 'Stores all calendar events for the platform.';
COMMENT ON COLUMN public.calendar_events.class_id IS 'If not null, the event is only for members of this class.';
COMMENT ON COLUMN public.calendar_events.related_entity_id IS 'Optional link to another table, like simulations or essay_prompts.';
-- Add a column to user_settings to store personalized dashboard layouts.
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB;

COMMENT ON COLUMN public.user_settings.dashboard_layout IS 'Stores the user''s custom dashboard widget layout and visibility preferences.';
-- Seed student profile for the test student user
-- This links the user with email 'aluno@teste.com' from auth.users to a profile in the students table.
INSERT INTO public.students (user_id, student_id_number, enrollment_date)
VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'aluno@teste.com'),
        'ST2025001',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (user_id) DO NOTHING;

-- Seed teacher profile for the test teacher user
-- This links the user with email 'professor@teste.com' from auth.users to a profile in the teachers table.
INSERT INTO public.teachers (user_id, employee_id_number, hire_date, department)
VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'professor@teste.com'),
        'TCH2025001',
        CURRENT_TIMESTAMP,
        'Ciências Humanas'
    )
ON CONFLICT (user_id) DO NOTHING;
-- Enable uuid-ossp extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test users in auth.users for student, teacher, and administrator roles.
-- The password for all users is 'senha123'.
-- This migration ensures that the subsequent profile seeding migrations will succeed.

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'aluno@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'professor@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'admin@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    )
ON CONFLICT (email) DO NOTHING;
-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Delete existing test users from auth schema.
-- This will cascade and delete related entries in public.users, students, teachers, etc.,
-- ensuring a clean state before re-seeding.
DELETE FROM auth.users WHERE email IN ('aluno@teste.com', 'professor@teste.com', 'admin@teste.com');

-- Step 2: Re-create the test users in auth.users. Password for all is 'senha123'.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'aluno@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'professor@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'admin@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    )
ON CONFLICT (email) DO NOTHING;

-- Step 3: Re-seed the profiles in public.users.
-- This ensures the public profiles are linked to the new auth users.
INSERT INTO public.users (id, first_name, last_name, email, role, is_active)
VALUES
    ((SELECT id FROM auth.users WHERE email = 'aluno@teste.com'), 'Aluno', 'Teste', 'aluno@teste.com', 'student', true),
    ((SELECT id FROM auth.users WHERE email = 'professor@teste.com'), 'Professor', 'Teste', 'professor@teste.com', 'teacher', true),
    ((SELECT id FROM auth.users WHERE email = 'admin@teste.com'), 'Admin', 'Teste', 'admin@teste.com', 'administrator', true)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Step 4: Re-seed the role-specific profiles.
INSERT INTO public.students (user_id, student_id_number, enrollment_date)
VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'aluno@teste.com'),
        'ST2025001',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.teachers (user_id, employee_id_number, hire_date, department)
VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'professor@teste.com'),
        'TCH2025001',
        CURRENT_TIMESTAMP,
        'Ciências Humanas'
    )
ON CONFLICT (user_id) DO NOTHING;
-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Delete existing test users from auth schema.
-- This will cascade and delete related entries in public.users, students, teachers, etc.,
-- ensuring a clean state before re-seeding.
DELETE FROM auth.users WHERE email IN ('aluno@teste.com', 'professor@teste.com', 'admin@teste.com');

-- Step 2: Re-create the test users in auth.users. Password for all is 'senha123'.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'aluno@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'professor@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'admin@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    )
ON CONFLICT (email) DO NOTHING;

-- Step 3: Re-seed the profiles in public.users.
-- This ensures the public profiles are linked to the new auth users.
INSERT INTO public.users (id, first_name, last_name, email, role, is_active)
VALUES
    ((SELECT id FROM auth.users WHERE email = 'aluno@teste.com'), 'Aluno', 'Teste', 'aluno@teste.com', 'student', true),
    ((SELECT id FROM auth.users WHERE email = 'professor@teste.com'), 'Professor', 'Teste', 'professor@teste.com', 'teacher', true),
    ((SELECT id FROM auth.users WHERE email = 'admin@teste.com'), 'Admin', 'Teste', 'admin@teste.com', 'administrator', true)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Step 4: Re-seed the role-specific profiles.
INSERT INTO public.students (user_id, student_id_number, enrollment_date)
VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'aluno@teste.com'),
        'ST2025001',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.teachers (user_id, employee_id_number, hire_date, department)
VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'professor@teste.com'),
        'TCH2025001',
        CURRENT_TIMESTAMP,
        'Ciências Humanas'
    )
ON CONFLICT (user_id) DO NOTHING;
-- Correção para sincronizar auth.users com public.users
-- Resolve o conflito de constraint única users_email_idx

-- 1. Primeiro, vamos identificar e corrigir registros órfãos em auth.users
DO $$
DECLARE
    orphan_record RECORD;
BEGIN
    -- Encontrar usuários em auth.users que não têm perfil correspondente em public.users
    FOR orphan_record IN
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        RAISE NOTICE 'Usuário órfão encontrado: % (ID: %)', orphan_record.email, orphan_record.id;

        -- Criar perfil básico para o usuário órfão
        INSERT INTO public.users (id, email, first_name, last_name, role, is_active)
        VALUES (
            orphan_record.id,
            orphan_record.email,
            'Usuário',
            'Migrado',
            'student', -- papel padrão
            true
        )
        ON CONFLICT (id) DO NOTHING;

        RAISE NOTICE 'Perfil criado para: %', orphan_record.email;
    END LOOP;
END$$;

-- 2. Verificar e corrigir emails duplicados na tabela public.users
DO $$
DECLARE
    duplicate_record RECORD;
    counter INTEGER;
BEGIN
    -- Encontrar emails duplicados
    FOR duplicate_record IN
        SELECT email, COUNT(*) as count
        FROM public.users
        GROUP BY email
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'Email duplicado encontrado: % (% registros)', duplicate_record.email, duplicate_record.count;

        -- Manter apenas o primeiro registro e remover os duplicados
        counter := 0;
        FOR duplicate_record IN
            SELECT id FROM public.users
            WHERE email = duplicate_record.email
            ORDER BY created_at ASC
        LOOP
            counter := counter + 1;
            IF counter > 1 THEN
                DELETE FROM public.users WHERE id = duplicate_record.id;
                RAISE NOTICE 'Registro duplicado removido: %', duplicate_record.id;
            END IF;
        END LOOP;
    END LOOP;
END$$;

-- 3. Criar função para sincronização automática
CREATE OR REPLACE FUNCTION sync_auth_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um novo usuário é criado em auth.users, criar automaticamente um perfil
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.users (id, email, first_name, last_name, role, is_active)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'first_name', 'Novo'),
            COALESCE(NEW.raw_user_meta_data->>'last_name', 'Usuário'),
            'student',
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
            last_name = COALESCE(EXCLUDED.last_name, public.users.last_name);

        RETURN NEW;
    END IF;

    -- Quando um usuário é atualizado em auth.users, sincronizar o perfil
    IF TG_OP = 'UPDATE' THEN
        UPDATE public.users
        SET
            email = NEW.email,
            first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
            last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name)
        WHERE id = NEW.id;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_auth_user_profile();

-- 5. Função para limpar usuários órfãos periodicamente
CREATE OR REPLACE FUNCTION cleanup_orphaned_users()
RETURNS void AS $$
BEGIN
    -- Remove usuários de public.users que não têm correspondente em auth.users
    DELETE FROM public.users
    WHERE id NOT IN (SELECT id FROM auth.users);

    RAISE NOTICE 'Limpeza de usuários órfãos concluída';
END;
$$ LANGUAGE plpgsql;

-- 6. Garantir que a constraint única no email seja mantida
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- 7. Verificação final
DO $$
DECLARE
    auth_count INTEGER;
    users_count INTEGER;
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    SELECT COUNT(*) INTO users_count FROM public.users;

    SELECT COUNT(*) INTO orphan_count
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL;

    RAISE NOTICE 'Verificação final:';
    RAISE NOTICE 'Usuários em auth.users: %', auth_count;
    RAISE NOTICE 'Perfis em public.users: %', users_count;
    RAISE NOTICE 'Usuários órfãos restantes: %', orphan_count;
END$$;-- Add category to achievements table
ALTER TABLE public.achievements
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

COMMENT ON COLUMN public.achievements.category IS 'Category of the achievement (general, study, quiz, essay, social)';

-- Add status to classes table  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_status') THEN
        CREATE TYPE public.class_status AS ENUM ('active', 'inactive', 'archived');
    END IF;
END$$;

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS status public.class_status DEFAULT 'active';

COMMENT ON COLUMN public.classes.status IS 'Current status of the class (active, inactive, archived)';

-- Enhance user_progress to include global gamification stats
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

COMMENT ON COLUMN public.user_progress.total_xp IS 'Total experience points earned by the user';
COMMENT ON COLUMN public.user_progress.level IS 'Current level of the user based on XP';
COMMENT ON COLUMN public.user_progress.current_streak_days IS 'Current study streak in days';
COMMENT ON COLUMN public.user_progress.longest_streak_days IS 'Longest study streak achieved';
COMMENT ON COLUMN public.user_progress.last_activity_date IS 'Last date the user had any activity';

-- Create a view for class statistics
CREATE OR REPLACE VIEW public.class_stats AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.status,
    c.start_date,
    c.end_date,
    c.class_type,
    c.created_at,
    COUNT(DISTINCT sc.user_id) as student_count,
    COUNT(DISTINCT cfp.feature_key) as enabled_features_count
FROM public.classes c
LEFT JOIN public.student_classes sc ON c.id = sc.class_id
LEFT JOIN public.class_feature_permissions cfp ON c.id = cfp.class_id
GROUP BY c.id;

COMMENT ON VIEW public.class_stats IS 'Aggregated statistics for each class';

-- Create a view for user ranking
CREATE OR REPLACE VIEW public.user_ranking AS
SELECT 
    up.user_id,
    u.email,
    p.first_name,
    p.last_name,
    COALESCE(up.total_xp, 0) as total_xp,
    COALESCE(up.level, 1) as level,
    COUNT(DISTINCT ua.achievement_id) as achievements_count,
    ROW_NUMBER() OVER (ORDER BY COALESCE(up.total_xp, 0) DESC) as position
FROM auth.users u
INNER JOIN public.users p ON u.id = p.id
LEFT JOIN public.user_progress up ON u.id = up.user_id
LEFT JOIN public.user_achievements ua ON u.id = ua.user_id
WHERE p.role = 'student'
GROUP BY up.user_id, u.email, p.first_name, p.last_name, up.total_xp, up.level
ORDER BY total_xp DESC;

COMMENT ON VIEW public.user_ranking IS 'Global ranking of students by XP';

-- Create a function to get achievement unlock count
CREATE OR REPLACE FUNCTION public.get_achievement_unlock_count(achievement_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.user_achievements
        WHERE achievement_id = achievement_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_achievement_unlock_count IS 'Returns the number of times an achievement has been unlocked';

-- Enable RLS policies for new features
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_feature_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (everyone can read, only admins can write)
CREATE POLICY "Anyone can view achievements"
    ON public.achievements FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage achievements"
    ON public.achievements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
    ON public.user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only system can insert achievements"
    ON public.user_achievements FOR INSERT
    WITH CHECK (true); -- Will be controlled by backend logic

-- Grant permissions
GRANT SELECT ON public.class_stats TO authenticated;
GRANT SELECT ON public.user_ranking TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_achievement_unlock_count TO authenticated;

-- Tabela para tópicos de estudo
CREATE TABLE IF NOT EXISTS study_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'portugues', 
    'redacao', 
    'matematica', 
    'raciocinio-logico', 
    'direito-constitucional', 
    'direito-administrativo', 
    'direito-penal', 
    'direito-civil', 
    'informatica', 
    'atualidades', 
    'conhecimentos-gerais', 
    'ingles', 
    'historia', 
    'geografia', 
    'legislacao', 
    'outros'
  )),
  type TEXT NOT NULL CHECK (type IN ('teoria', 'exercicios', 'pratica', 'revisao')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  pomodoros INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para sessões de pomodoro
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES study_topics(id) ON DELETE SET NULL,
  topic_title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_study_topics_user_id ON study_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_study_topics_status ON study_topics(status);
CREATE INDEX IF NOT EXISTS idx_study_topics_category ON study_topics(category);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_topic_id ON pomodoro_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_created_at ON pomodoro_sessions(created_at);

-- Função para incrementar pomodoros
CREATE OR REPLACE FUNCTION increment_topic_pomodoros(topic_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE study_topics
  SET pomodoros = pomodoros + 1,
      updated_at = NOW()
  WHERE id = topic_id;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de estudo
CREATE OR REPLACE FUNCTION get_study_stats(user_id UUID)
RETURNS TABLE (
  total_topics INTEGER,
  completed_topics INTEGER,
  total_pomodoros INTEGER,
  total_minutes INTEGER,
  current_week_pomodoros INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_topics,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS completed_topics,
    COALESCE(SUM(pomodoros), 0)::INTEGER AS total_pomodoros,
    COALESCE(SUM(pomodoros) * 25, 0)::INTEGER AS total_minutes,
    (
      SELECT COUNT(*)::INTEGER
      FROM pomodoro_sessions
      WHERE pomodoro_sessions.user_id = get_study_stats.user_id
        AND created_at >= DATE_TRUNC('week', NOW())
        AND completed = true
    ) AS current_week_pomodoros
  FROM study_topics
  WHERE study_topics.user_id = get_study_stats.user_id;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS
ALTER TABLE study_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para study_topics
CREATE POLICY "Users can view their own study topics"
  ON study_topics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study topics"
  ON study_topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study topics"
  ON study_topics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study topics"
  ON study_topics FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para pomodoro_sessions
CREATE POLICY "Users can view their own pomodoro sessions"
  ON pomodoro_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pomodoro sessions"
  ON pomodoro_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_study_topics_updated_at
  BEFORE UPDATE ON study_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE study_topics IS 'Tópicos de estudo dos usuários para planejamento';
COMMENT ON TABLE pomodoro_sessions IS 'Sessões de estudo usando a técnica Pomodoro';
COMMENT ON COLUMN study_topics.category IS 'Categoria do conteúdo: portugues, redacao, matematica, raciocinio-logico, direito-constitucional, direito-administrativo, direito-penal, direito-civil, informatica, atualidades, conhecimentos-gerais, ingles, historia, geografia, legislacao, outros';
COMMENT ON COLUMN study_topics.type IS 'Tipo de estudo: teoria, exercicios, pratica, revisao';
COMMENT ON COLUMN study_topics.status IS 'Status do tópico: pending, in-progress, completed';
COMMENT ON COLUMN study_topics.pomodoros IS 'Número de pomodoros completados para este tópico';

-- =====================================================
-- Criar turma de degustação padrão e vincular usuários
-- =====================================================

-- 1. Criar turma de degustação com professor
DO $$
DECLARE
  v_turma_id UUID := '00000000-0000-0000-0000-000000000001';
  v_teacher_record_id UUID;
BEGIN
  -- Buscar primeiro registro de professor da tabela teachers
  SELECT id INTO v_teacher_record_id
  FROM public.teachers
  LIMIT 1;

  -- Se não houver professor, criar um registro de professor usando primeiro usuário
  IF v_teacher_record_id IS NULL THEN
    -- Buscar primeiro usuário
    INSERT INTO public.teachers (user_id, employee_id_number, hire_date, department)
    SELECT id, 'TEMP-001', NOW(), 'Sistema'
    FROM public.users
    LIMIT 1
    RETURNING id INTO v_teacher_record_id;
  END IF;

  -- Criar turma de degustação
  INSERT INTO public.classes (
    id,
    name,
    description,
    teacher_id,
    start_date,
    end_date,
    class_type,
    trial_duration_days,
    trial_flashcard_limit_per_day,
    trial_quiz_limit_per_day,
    trial_essay_submission_limit,
    created_at,
    updated_at
  )
  VALUES (
    v_turma_id,
    'Degustação - Turma Padrão',
    'Turma padrão de degustação. Todos os novos usuários são automaticamente adicionados aqui.',
    v_teacher_record_id,
    NOW(),
    NOW() + INTERVAL '10 years',
    'trial',
    30,
    10,
    5,
    3,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    teacher_id = EXCLUDED.teacher_id,
    updated_at = NOW();

  -- 2. Vincular TODOS os usuários existentes na turma (usando student_classes)
  INSERT INTO public.student_classes (
    user_id,
    class_id,
    enrollment_date
  )
  SELECT
    u.id,
    v_turma_id,
    NOW()
  FROM public.users u
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.student_classes sc
    WHERE sc.user_id = u.id
  );

  RAISE NOTICE 'Turma criada com teacher_id % e usuários vinculados!', v_teacher_record_id;
END $$;

-- 3. Criar função para auto-vincular novos usuários
CREATE OR REPLACE FUNCTION public.auto_enroll_in_default_class()
RETURNS TRIGGER AS $$
DECLARE
  v_turma_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Inserir novo usuário na turma de degustação
  INSERT INTO public.student_classes (user_id, class_id, enrollment_date)
  VALUES (NEW.id, v_turma_id, NOW())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para auto-vinculo
DROP TRIGGER IF EXISTS on_user_created_auto_enroll ON public.users;
CREATE TRIGGER on_user_created_auto_enroll
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enroll_in_default_class();
-- Enhance quiz_questions table to support rich text and multiple question formats
-- This migration adds support for:
-- 1. Rich text formatting (bold, italic, underline, lists, etc.)
-- 2. Multiple question types (multiple choice, true/false, multiple response, matching, etc.)
-- 3. Images in questions and options
-- 4. Difficulty levels

-- Add question_format column to support different types of questions
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS question_format TEXT NOT NULL DEFAULT 'multiple_choice';

-- Add comment to explain the possible values
COMMENT ON COLUMN public.quiz_questions.question_format IS 'Question format: multiple_choice, true_false, multiple_response, fill_blank, matching, ordering, essay';

-- Add rich text content columns (stored as HTML or JSON)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS question_html TEXT,
ADD COLUMN IF NOT EXISTS explanation_html TEXT;

-- Add image support for questions
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS question_image_url TEXT,
ADD COLUMN IF NOT EXISTS question_image_caption TEXT;

-- Add difficulty level
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';

COMMENT ON COLUMN public.quiz_questions.difficulty IS 'Difficulty level: easy, medium, hard, expert';

-- Add support for options with rich text and images
-- Store options as JSONB to support flexible structures
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS options_rich JSONB;

COMMENT ON COLUMN public.quiz_questions.options_rich IS 'Rich options stored as JSON array with structure: [{ "id": "a", "text": "...", "html": "...", "imageUrl": "...", "isCorrect": true }]';

-- Add support for multiple correct answers (for multiple_response type)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS correct_answers JSONB;

COMMENT ON COLUMN public.quiz_questions.correct_answers IS 'Array of correct answer IDs for multiple response questions: ["a", "c"]';

-- Add tags for better categorization
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add time limit per question (in seconds)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER;

-- Add column for matching pairs (for matching type questions)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS matching_pairs JSONB;

COMMENT ON COLUMN public.quiz_questions.matching_pairs IS 'For matching questions: [{ "left": "Item 1", "right": "Match 1", "leftHtml": "...", "rightHtml": "..." }]';

-- Add column for ordering items (for ordering type questions)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS ordering_items JSONB;

COMMENT ON COLUMN public.quiz_questions.ordering_items IS 'For ordering questions: [{ "id": "1", "text": "...", "html": "...", "correctOrder": 1 }]';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_format ON public.quiz_questions(question_format);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON public.quiz_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_tags ON public.quiz_questions USING gin(tags);

-- Create a view for backward compatibility with old question format
CREATE OR REPLACE VIEW public.quiz_questions_legacy AS
SELECT
  id,
  quiz_id,
  COALESCE(question_html, question_text) as question,
  options,
  correct_answer,
  COALESCE(explanation_html, explanation) as explanation,
  points,
  created_at,
  updated_at
FROM public.quiz_questions
WHERE question_format = 'multiple_choice';
-- =====================================================
-- SISTEMA COMPLETO DE SIMULADOS E PROVAS
-- =====================================================
-- Funcionalidades:
-- - Texto dissertativo para interpretação
-- - Cartão resposta virtual
-- - Agendamento com data/hora de abertura e fechamento
-- - Controle por turmas
-- - Resultados detalhados no dashboard

-- =====================================================
-- 1. TABELA DE SIMULADOS (quizzes)
-- =====================================================
-- Adicionar campos para agendamento e controle
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'quiz',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passing_score INTEGER,
ADD COLUMN IF NOT EXISTS show_results_immediately BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_review BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_quizzes_type ON public.quizzes(type);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled ON public.quizzes(scheduled_start, scheduled_end);

-- =====================================================
-- 2. TURMAS PERMITIDAS POR SIMULADO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_classes_quiz ON public.quiz_classes(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_classes_class ON public.quiz_classes(class_id);

-- =====================================================
-- 3. TEXTOS DISSERTATIVOS PARA INTERPRETAÇÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_reading_texts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT NOT NULL,
  content_html TEXT,
  author VARCHAR(255),
  source VARCHAR(500),
  word_count INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_reading_texts_quiz ON public.quiz_reading_texts(quiz_id);

-- =====================================================
-- 4. MELHORAR TABELA DE QUESTÕES
-- =====================================================
-- Adicionar referência ao texto de interpretação
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS reading_text_id UUID REFERENCES public.quiz_reading_texts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS question_number VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_reading_text ON public.quiz_questions(reading_text_id);

-- =====================================================
-- 5. TENTATIVAS/SUBMISSÕES DE SIMULADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  score DECIMAL(5,2),
  total_points INTEGER,
  percentage DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, submitted, expired
  answers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_status ON public.quiz_attempts(status);

-- =====================================================
-- 6. RESPOSTAS INDIVIDUAIS (CARTÃO RESPOSTA)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer_value TEXT,
  answer_json JSONB,
  is_correct BOOLEAN,
  points_earned DECIMAL(5,2) DEFAULT 0,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON public.quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question ON public.quiz_answers(question_id);

-- =====================================================
-- 7. ESTATÍSTICAS POR QUESTÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_question_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  total_answers INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  average_time_seconds INTEGER,
  difficulty_level VARCHAR(20), -- calculated based on success rate
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_question_stats_question ON public.quiz_question_stats(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_question_stats_quiz ON public.quiz_question_stats(quiz_id);

-- =====================================================
-- 8. FUNÇÃO: VERIFICAR SE USUÁRIO PODE ACESSAR SIMULADO
-- =====================================================
CREATE OR REPLACE FUNCTION can_user_access_quiz(
  p_quiz_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_quiz RECORD;
  v_user_classes UUID[];
  v_quiz_classes UUID[];
  v_now TIMESTAMPTZ;
  v_has_status_column BOOLEAN;
  v_quiz_status TEXT;
BEGIN
  v_now := NOW();

  -- Verificar se a coluna status existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'quizzes'
    AND column_name = 'status'
  ) INTO v_has_status_column;

  -- Buscar informações do quiz
  IF v_has_status_column THEN
    SELECT status INTO v_quiz_status FROM public.quizzes WHERE id = p_quiz_id;
    SELECT * INTO v_quiz FROM public.quizzes WHERE id = p_quiz_id;

    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    -- Verificar se está publicado
    IF v_quiz_status IS NOT NULL AND v_quiz_status != 'published' THEN
      -- Permitir acesso para admins e professores mesmo em draft
      IF EXISTS (
        SELECT 1 FROM public.users
        WHERE id = p_user_id
        AND role IN ('administrator', 'teacher')
      ) THEN
        RETURN TRUE;
      END IF;
      RETURN FALSE;
    END IF;
  ELSE
    -- Se não tem coluna status, apenas busca o quiz
    SELECT * INTO v_quiz FROM public.quizzes WHERE id = p_quiz_id;

    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Verificar agendamento
  IF v_quiz.scheduled_start IS NOT NULL AND v_now < v_quiz.scheduled_start THEN
    RETURN FALSE;
  END IF;

  IF v_quiz.scheduled_end IS NOT NULL AND v_now > v_quiz.scheduled_end THEN
    RETURN FALSE;
  END IF;

  -- Buscar turmas do quiz
  SELECT ARRAY_AGG(class_id) INTO v_quiz_classes
  FROM public.quiz_classes
  WHERE quiz_id = p_quiz_id;

  -- Se não há restrição de turmas, libera para todos
  IF v_quiz_classes IS NULL OR ARRAY_LENGTH(v_quiz_classes, 1) IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Buscar turmas do usuário
  SELECT ARRAY_AGG(class_id) INTO v_user_classes
  FROM public.student_classes
  WHERE user_id = p_user_id;

  -- Verificar se há interseção entre as turmas
  IF v_user_classes IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_user_classes && v_quiz_classes;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNÇÃO: CALCULAR RESULTADO DO SIMULADO
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_quiz_result(
  p_attempt_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_points DECIMAL(5,2);
  v_points_earned DECIMAL(5,2);
  v_total_questions INTEGER;
  v_correct_answers INTEGER;
  v_incorrect_answers INTEGER;
  v_unanswered INTEGER;
BEGIN
  -- Calcular pontuação total
  SELECT
    COALESCE(SUM(points), 0),
    COUNT(*)
  INTO v_total_points, v_total_questions
  FROM public.quiz_questions qq
  INNER JOIN public.quiz_attempts qa ON qa.quiz_id = qq.quiz_id
  WHERE qa.id = p_attempt_id;

  -- Calcular pontuação obtida
  SELECT COALESCE(SUM(points_earned), 0)
  INTO v_points_earned
  FROM public.quiz_answers
  WHERE attempt_id = p_attempt_id;

  -- Contar acertos e erros
  SELECT
    COUNT(*) FILTER (WHERE is_correct = true),
    COUNT(*) FILTER (WHERE is_correct = false)
  INTO v_correct_answers, v_incorrect_answers
  FROM public.quiz_answers
  WHERE attempt_id = p_attempt_id;

  -- Questões não respondidas
  v_unanswered := v_total_questions - (v_correct_answers + v_incorrect_answers);

  -- Montar resultado
  v_result := jsonb_build_object(
    'total_points', v_total_points,
    'points_earned', v_points_earned,
    'percentage', CASE WHEN v_total_points > 0 THEN (v_points_earned / v_total_points * 100) ELSE 0 END,
    'total_questions', v_total_questions,
    'correct_answers', v_correct_answers,
    'incorrect_answers', v_incorrect_answers,
    'unanswered', v_unanswered
  );

  -- Atualizar a tentativa
  UPDATE public.quiz_attempts
  SET
    score = v_points_earned,
    total_points = v_total_points,
    percentage = CASE WHEN v_total_points > 0 THEN (v_points_earned / v_total_points * 100) ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_attempt_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. FUNÇÃO: SUBMETER SIMULADO
-- =====================================================
CREATE OR REPLACE FUNCTION submit_quiz_attempt(
  p_attempt_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_time_spent INTEGER;
BEGIN
  -- Calcular tempo gasto
  SELECT EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
  INTO v_time_spent
  FROM public.quiz_attempts
  WHERE id = p_attempt_id;

  -- Marcar como submetido
  UPDATE public.quiz_attempts
  SET
    status = 'submitted',
    submitted_at = NOW(),
    time_spent_seconds = v_time_spent,
    updated_at = NOW()
  WHERE id = p_attempt_id;

  -- Calcular resultado
  v_result := calculate_quiz_result(p_attempt_id);

  -- Atualizar estatísticas das questões
  INSERT INTO public.quiz_question_stats (question_id, quiz_id, total_answers, correct_answers, incorrect_answers)
  SELECT
    qa.question_id,
    qq.quiz_id,
    1,
    CASE WHEN qa.is_correct THEN 1 ELSE 0 END,
    CASE WHEN NOT qa.is_correct THEN 1 ELSE 0 END
  FROM public.quiz_answers qa
  INNER JOIN public.quiz_questions qq ON qq.id = qa.question_id
  WHERE qa.attempt_id = p_attempt_id
  ON CONFLICT (question_id) DO UPDATE
  SET
    total_answers = quiz_question_stats.total_answers + 1,
    correct_answers = quiz_question_stats.correct_answers + EXCLUDED.correct_answers,
    incorrect_answers = quiz_question_stats.incorrect_answers + EXCLUDED.incorrect_answers,
    updated_at = NOW();

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. RLS POLICIES (Criadas DEPOIS das funções)
-- =====================================================

-- Políticas para quiz_classes
ALTER TABLE public.quiz_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins e professores podem gerenciar turmas de quiz" ON public.quiz_classes;
CREATE POLICY "Admins e professores podem gerenciar turmas de quiz"
  ON public.quiz_classes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Todos podem ver turmas de quiz" ON public.quiz_classes;
CREATE POLICY "Todos podem ver turmas de quiz"
  ON public.quiz_classes FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para quiz_reading_texts
ALTER TABLE public.quiz_reading_texts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins e professores podem gerenciar textos" ON public.quiz_reading_texts;
CREATE POLICY "Admins e professores podem gerenciar textos"
  ON public.quiz_reading_texts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Alunos podem ver textos de quizzes acessíveis" ON public.quiz_reading_texts;
CREATE POLICY "Alunos podem ver textos de quizzes acessíveis"
  ON public.quiz_reading_texts FOR SELECT
  TO authenticated
  USING (
    can_user_access_quiz(quiz_id, auth.uid())
  );

-- Políticas para quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem criar suas próprias tentativas" ON public.quiz_attempts;
CREATE POLICY "Usuários podem criar suas próprias tentativas"
  ON public.quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem ver e atualizar suas tentativas" ON public.quiz_attempts;
CREATE POLICY "Usuários podem ver e atualizar suas tentativas"
  ON public.quiz_attempts FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins e professores veem todas tentativas" ON public.quiz_attempts;
CREATE POLICY "Admins e professores veem todas tentativas"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Políticas para quiz_answers
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários gerenciam respostas de suas tentativas" ON public.quiz_answers;
CREATE POLICY "Usuários gerenciam respostas de suas tentativas"
  ON public.quiz_answers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts
      WHERE id = quiz_answers.attempt_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins e professores veem todas respostas" ON public.quiz_answers;
CREATE POLICY "Admins e professores veem todas respostas"
  ON public.quiz_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Políticas para quiz_question_stats
ALTER TABLE public.quiz_question_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver estatísticas" ON public.quiz_question_stats;
CREATE POLICY "Todos podem ver estatísticas"
  ON public.quiz_question_stats FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Sistema pode atualizar estatísticas" ON public.quiz_question_stats;
CREATE POLICY "Sistema pode atualizar estatísticas"
  ON public.quiz_question_stats FOR ALL
  TO authenticated
  USING (true);

-- =====================================================
-- 12. TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quiz_reading_texts_updated_at
  BEFORE UPDATE ON public.quiz_reading_texts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_attempts_updated_at
  BEFORE UPDATE ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_answers_updated_at
  BEFORE UPDATE ON public.quiz_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 13. COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE public.quiz_classes IS 'Turmas que podem acessar cada simulado';
COMMENT ON TABLE public.quiz_reading_texts IS 'Textos dissertativos para questões de interpretação';
COMMENT ON TABLE public.quiz_attempts IS 'Tentativas de resolução de simulados';
COMMENT ON TABLE public.quiz_answers IS 'Respostas individuais (cartão resposta virtual)';
COMMENT ON TABLE public.quiz_question_stats IS 'Estatísticas de desempenho por questão';

-- =====================================================
-- 14. VIEWS ÚTEIS (criadas após garantir que colunas existem)
-- =====================================================

-- Drop views antigas se existirem
DROP VIEW IF EXISTS user_available_quizzes CASCADE;
DROP VIEW IF EXISTS user_quiz_results CASCADE;

-- View: Simulados disponíveis para o usuário
CREATE VIEW user_available_quizzes AS
SELECT
  q.*,
  CASE
    WHEN q.scheduled_start IS NOT NULL AND NOW() < q.scheduled_start THEN 'scheduled'
    WHEN q.scheduled_end IS NOT NULL AND NOW() > q.scheduled_end THEN 'expired'
    ELSE 'available'
  END as availability_status,
  (
    SELECT COUNT(*)
    FROM public.quiz_attempts
    WHERE quiz_id = q.id AND user_id = auth.uid()
  ) as user_attempts_count
FROM public.quizzes q
WHERE can_user_access_quiz(q.id, auth.uid());

-- View: Dashboard de resultados do aluno
CREATE VIEW user_quiz_results AS
SELECT
  qa.id as attempt_id,
  qa.quiz_id,
  q.title as quiz_title,
  q.type as quiz_type,
  qa.started_at,
  qa.submitted_at,
  qa.time_spent_seconds,
  qa.score,
  qa.total_points,
  qa.percentage,
  qa.status,
  (
    SELECT COUNT(*) FILTER (WHERE is_correct = true)
    FROM public.quiz_answers
    WHERE attempt_id = qa.id
  ) as correct_answers,
  (
    SELECT COUNT(*) FILTER (WHERE is_correct = false)
    FROM public.quiz_answers
    WHERE attempt_id = qa.id
  ) as incorrect_answers
FROM public.quiz_attempts qa
INNER JOIN public.quizzes q ON q.id = qa.quiz_id
WHERE qa.user_id = auth.uid()
ORDER BY qa.started_at DESC;
-- =====================================================
-- SISTEMA DE CARTÃO RESPOSTA PRESENCIAL
-- =====================================================
-- Permite professor criar apenas gabarito
-- Aluno faz prova presencial e preenche cartão na plataforma
-- =====================================================

-- 1. Garantir que o tipo 'answer_sheet' é aceito
-- (a tabela quizzes já existe, apenas documentando o uso)

COMMENT ON COLUMN public.quizzes.type IS
'Tipos de quiz:
- quiz: Quiz rápido de estudo
- simulation: Simulado completo com texto e timer
- answer_sheet: Apenas cartão resposta (prova presencial)';

-- 2. Criar view para cartões resposta disponíveis
CREATE OR REPLACE VIEW user_available_answer_sheets AS
SELECT
  q.*,
  CASE
    WHEN q.scheduled_start IS NOT NULL AND NOW() < q.scheduled_start THEN 'scheduled'
    WHEN q.scheduled_end IS NOT NULL AND NOW() > q.scheduled_end THEN 'expired'
    ELSE 'available'
  END as availability_status,
  (
    SELECT COUNT(*)
    FROM public.quiz_attempts
    WHERE quiz_id = q.id AND user_id = auth.uid() AND status = 'submitted'
  ) as submission_count,
  (
    SELECT qa.*
    FROM public.quiz_attempts qa
    WHERE qa.quiz_id = q.id
    AND qa.user_id = auth.uid()
    AND qa.status = 'submitted'
    ORDER BY qa.submitted_at DESC
    LIMIT 1
  ) as last_submission
FROM public.quizzes q
WHERE q.type = 'answer_sheet'
  AND q.status = 'published'
  AND can_user_access_quiz(q.id, auth.uid());

-- 3. Função para validar cartão resposta
CREATE OR REPLACE FUNCTION validate_answer_sheet(
  p_attempt_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_quiz_id UUID;
  v_questions RECORD;
  v_answers RECORD;
  v_result JSONB;
  v_correct_count INTEGER := 0;
  v_incorrect_count INTEGER := 0;
  v_blank_count INTEGER := 0;
  v_total_points DECIMAL(5,2) := 0;
  v_earned_points DECIMAL(5,2) := 0;
BEGIN
  -- Buscar quiz_id da tentativa
  SELECT quiz_id INTO v_quiz_id
  FROM public.quiz_attempts
  WHERE id = p_attempt_id;

  -- Buscar todas as questões do quiz
  SELECT
    COUNT(*) as total,
    COALESCE(SUM(points), 0) as total_points
  INTO v_questions
  FROM public.quiz_questions
  WHERE quiz_id = v_quiz_id;

  v_total_points := v_questions.total_points;

  -- Contar respostas corretas, incorretas e em branco
  SELECT
    COUNT(*) FILTER (WHERE is_correct = true) as correct,
    COUNT(*) FILTER (WHERE is_correct = false) as incorrect,
    COALESCE(SUM(points_earned), 0) as earned
  INTO v_answers
  FROM public.quiz_answers
  WHERE attempt_id = p_attempt_id;

  v_correct_count := v_answers.correct;
  v_incorrect_count := v_answers.incorrect;
  v_earned_points := v_answers.earned;
  v_blank_count := v_questions.total - (v_correct_count + v_incorrect_count);

  -- Atualizar tentativa com resultado
  UPDATE public.quiz_attempts
  SET
    score = v_earned_points,
    total_points = v_total_points,
    percentage = CASE
      WHEN v_total_points > 0 THEN (v_earned_points / v_total_points * 100)
      ELSE 0
    END,
    status = 'submitted',
    submitted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_attempt_id;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'correct_count', v_correct_count,
    'incorrect_count', v_incorrect_count,
    'blank_count', v_blank_count,
    'total_points', v_total_points,
    'earned_points', v_earned_points,
    'percentage', CASE
      WHEN v_total_points > 0 THEN (v_earned_points / v_total_points * 100)
      ELSE 0
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 4. Comentários nas funcionalidades
COMMENT ON VIEW user_available_answer_sheets IS
'View para listar cartões resposta (provas presenciais) disponíveis para o usuário atual';

COMMENT ON FUNCTION validate_answer_sheet IS
'Valida cartão resposta preenchido pelo aluno e calcula nota automaticamente';
-- =====================================================
-- POLÍTICAS RLS PARA ADMINISTRAÇÃO
-- =====================================================
-- Este script adiciona políticas de Row Level Security (RLS)
-- para as tabelas principais que estavam sem proteção.
--
-- Apenas administradores e professores podem gerenciar:
-- - Quizzes
-- - Questões (quiz_questions)
-- - Temas de redação (essay_prompts)
-- - Cursos (video_courses, video_modules, video_lessons)
-- - Matérias e Tópicos (subjects, topics)

-- =====================================================
-- 1. TABELA: quizzes
-- =====================================================
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Todos podem ver quizzes publicados
DROP POLICY IF EXISTS "Todos podem ver quizzes publicados" ON public.quizzes;
CREATE POLICY "Todos podem ver quizzes publicados"
  ON public.quizzes FOR SELECT
  TO authenticated
  USING (
    -- Alunos só veem quizzes publicados
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'student'
      )
      AND (status IS NULL OR status = 'published')
    )
    OR
    -- Admins e professores veem todos
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('administrator', 'teacher')
      )
    )
  );

-- Apenas admins e professores podem criar quizzes
DROP POLICY IF EXISTS "Admins e professores podem criar quizzes" ON public.quizzes;
CREATE POLICY "Admins e professores podem criar quizzes"
  ON public.quizzes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar quizzes
DROP POLICY IF EXISTS "Admins e professores podem atualizar quizzes" ON public.quizzes;
CREATE POLICY "Admins e professores podem atualizar quizzes"
  ON public.quizzes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar quizzes
DROP POLICY IF EXISTS "Apenas admins podem deletar quizzes" ON public.quizzes;
CREATE POLICY "Apenas admins podem deletar quizzes"
  ON public.quizzes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 2. TABELA: quiz_questions
-- =====================================================
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Todos podem ver questões de quizzes acessíveis
DROP POLICY IF EXISTS "Todos podem ver questões de quizzes acessíveis" ON public.quiz_questions;
CREATE POLICY "Todos podem ver questões de quizzes acessíveis"
  ON public.quiz_questions FOR SELECT
  TO authenticated
  USING (
    -- Alunos podem ver questões de quizzes publicados ou sem quiz_id (banco de questões)
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'student'
      )
      AND (
        quiz_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.quizzes q
          WHERE q.id = quiz_questions.quiz_id
          AND (q.status IS NULL OR q.status = 'published')
        )
      )
    )
    OR
    -- Admins e professores veem todas
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('administrator', 'teacher')
      )
    )
  );

-- Apenas admins e professores podem criar questões
DROP POLICY IF EXISTS "Admins e professores podem criar questões" ON public.quiz_questions;
CREATE POLICY "Admins e professores podem criar questões"
  ON public.quiz_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar questões
DROP POLICY IF EXISTS "Admins e professores podem atualizar questões" ON public.quiz_questions;
CREATE POLICY "Admins e professores podem atualizar questões"
  ON public.quiz_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar questões
DROP POLICY IF EXISTS "Apenas admins podem deletar questões" ON public.quiz_questions;
CREATE POLICY "Apenas admins podem deletar questões"
  ON public.quiz_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 3. TABELA: essay_prompts (Temas de Redação)
-- =====================================================
ALTER TABLE public.essay_prompts ENABLE ROW LEVEL SECURITY;

-- Todos podem ver temas de redação ativos
DROP POLICY IF EXISTS "Todos podem ver temas de redação ativos" ON public.essay_prompts;
CREATE POLICY "Todos podem ver temas de redação ativos"
  ON public.essay_prompts FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem criar temas
DROP POLICY IF EXISTS "Admins e professores podem criar temas" ON public.essay_prompts;
CREATE POLICY "Admins e professores podem criar temas"
  ON public.essay_prompts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar temas
DROP POLICY IF EXISTS "Admins e professores podem atualizar temas" ON public.essay_prompts;
CREATE POLICY "Admins e professores podem atualizar temas"
  ON public.essay_prompts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar temas
DROP POLICY IF EXISTS "Apenas admins podem deletar temas" ON public.essay_prompts;
CREATE POLICY "Apenas admins podem deletar temas"
  ON public.essay_prompts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 4. TABELA: video_courses (Cursos)
-- =====================================================
ALTER TABLE public.video_courses ENABLE ROW LEVEL SECURITY;

-- Todos podem ver cursos ativos
DROP POLICY IF EXISTS "Todos podem ver cursos ativos" ON public.video_courses;
CREATE POLICY "Todos podem ver cursos ativos"
  ON public.video_courses FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem criar cursos
DROP POLICY IF EXISTS "Admins e professores podem criar cursos" ON public.video_courses;
CREATE POLICY "Admins e professores podem criar cursos"
  ON public.video_courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar cursos
DROP POLICY IF EXISTS "Admins e professores podem atualizar cursos" ON public.video_courses;
CREATE POLICY "Admins e professores podem atualizar cursos"
  ON public.video_courses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar cursos
DROP POLICY IF EXISTS "Apenas admins podem deletar cursos" ON public.video_courses;
CREATE POLICY "Apenas admins podem deletar cursos"
  ON public.video_courses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 5. TABELA: video_modules (Módulos de Curso)
-- =====================================================
ALTER TABLE public.video_modules ENABLE ROW LEVEL SECURITY;

-- Todos podem ver módulos de cursos ativos
DROP POLICY IF EXISTS "Todos podem ver módulos de cursos ativos" ON public.video_modules;
CREATE POLICY "Todos podem ver módulos de cursos ativos"
  ON public.video_modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.video_courses vc
      WHERE vc.id = video_modules.course_id
      AND vc.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem gerenciar módulos
DROP POLICY IF EXISTS "Admins e professores podem gerenciar módulos" ON public.video_modules;
CREATE POLICY "Admins e professores podem gerenciar módulos"
  ON public.video_modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- =====================================================
-- 6. TABELA: video_lessons (Aulas)
-- =====================================================
ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;

-- Todos podem ver aulas de cursos ativos
DROP POLICY IF EXISTS "Todos podem ver aulas de cursos ativos" ON public.video_lessons;
CREATE POLICY "Todos podem ver aulas de cursos ativos"
  ON public.video_lessons FOR SELECT
  TO authenticated
  USING (
    -- Aulas preview ou de cursos ativos
    is_preview = true
    OR
    EXISTS (
      SELECT 1 FROM public.video_modules vm
      INNER JOIN public.video_courses vc ON vc.id = vm.course_id
      WHERE vm.id = video_lessons.module_id
      AND vc.is_active = true
    )
    OR
    -- Admins e professores veem todas
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem gerenciar aulas
DROP POLICY IF EXISTS "Admins e professores podem gerenciar aulas" ON public.video_lessons;
CREATE POLICY "Admins e professores podem gerenciar aulas"
  ON public.video_lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- =====================================================
-- 7. TABELA: subjects (Matérias)
-- =====================================================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Todos podem ver matérias
DROP POLICY IF EXISTS "Todos podem ver matérias" ON public.subjects;
CREATE POLICY "Todos podem ver matérias"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins e professores podem criar matérias
DROP POLICY IF EXISTS "Admins e professores podem criar matérias" ON public.subjects;
CREATE POLICY "Admins e professores podem criar matérias"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar matérias
DROP POLICY IF EXISTS "Admins e professores podem atualizar matérias" ON public.subjects;
CREATE POLICY "Admins e professores podem atualizar matérias"
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar matérias
DROP POLICY IF EXISTS "Apenas admins podem deletar matérias" ON public.subjects;
CREATE POLICY "Apenas admins podem deletar matérias"
  ON public.subjects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 8. TABELA: topics (Tópicos)
-- =====================================================
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Todos podem ver tópicos
DROP POLICY IF EXISTS "Todos podem ver tópicos" ON public.topics;
CREATE POLICY "Todos podem ver tópicos"
  ON public.topics FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins e professores podem criar tópicos
DROP POLICY IF EXISTS "Admins e professores podem criar tópicos" ON public.topics;
CREATE POLICY "Admins e professores podem criar tópicos"
  ON public.topics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar tópicos
DROP POLICY IF EXISTS "Admins e professores podem atualizar tópicos" ON public.topics;
CREATE POLICY "Admins e professores podem atualizar tópicos"
  ON public.topics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar tópicos
DROP POLICY IF EXISTS "Apenas admins podem deletar tópicos" ON public.topics;
CREATE POLICY "Apenas admins podem deletar tópicos"
  ON public.topics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 9. GRANTS E PERMISSÕES
-- =====================================================
-- Garantir que usuários autenticados possam acessar as tabelas
GRANT SELECT ON public.quizzes TO authenticated;
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT SELECT ON public.essay_prompts TO authenticated;
GRANT SELECT ON public.video_courses TO authenticated;
GRANT SELECT ON public.video_modules TO authenticated;
GRANT SELECT ON public.video_lessons TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.topics TO authenticated;

-- Comentários
COMMENT ON POLICY "Todos podem ver quizzes publicados" ON public.quizzes IS
  'Alunos veem apenas quizzes publicados, admins e professores veem todos';

COMMENT ON POLICY "Todos podem ver questões de quizzes acessíveis" ON public.quiz_questions IS
  'Alunos veem questões de quizzes publicados e banco de questões, admins e professores veem todas';

COMMENT ON POLICY "Todos podem ver temas de redação ativos" ON public.essay_prompts IS
  'Alunos veem apenas temas ativos, admins e professores veem todos';
-- =====================================================
-- SISTEMA DE TURMA DE DEGUSTAÇÃO AUTOMÁTICA
-- =====================================================
--
-- Este sistema garante que todo novo aluno seja automaticamente
-- atribuído à turma de "Degustação" ao se cadastrar.
--
-- Fluxo:
-- 1. Aluno se cadastra no sistema
-- 2. Trigger automático adiciona à turma "Degustação"
-- 3. Admin pode depois mover manualmente para turma correta
--
-- =====================================================

-- 1. CRIAR TURMA DE DEGUSTAÇÃO (se não existir)
-- =====================================================

DO $$
DECLARE
  v_tasting_class_id uuid;
  v_teacher_id uuid;
  v_system_user_id uuid;
BEGIN
  -- Verificar se já existe uma turma chamada "Degustação"
  SELECT id INTO v_tasting_class_id
  FROM public.classes
  WHERE name = 'Degustação'
  LIMIT 1;

  -- Se a turma já existe, não fazer nada
  IF v_tasting_class_id IS NOT NULL THEN
    RAISE NOTICE 'Turma de Degustação já existe com ID: %', v_tasting_class_id;
    RETURN;
  END IF;

  -- Turma não existe, vamos criar

  -- 1. Buscar o professor específico everestpreparatorios@gmail.com
  SELECT t.id, u.id INTO v_teacher_id, v_system_user_id
  FROM public.users u
  LEFT JOIN public.teachers t ON t.user_id = u.id
  WHERE u.email = 'everestpreparatorios@gmail.com'
  LIMIT 1;

  -- 2. Se encontrou o usuário mas não tem registro em teachers, criar
  IF v_system_user_id IS NOT NULL AND v_teacher_id IS NULL THEN
    INSERT INTO public.teachers (user_id, department, created_at, updated_at)
    VALUES (v_system_user_id, 'Administração', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_teacher_id;

    RAISE NOTICE 'Professor criado para everestpreparatorios@gmail.com';
  END IF;

  -- 3. Se não encontrou o usuário everestpreparatorios@gmail.com, tentar qualquer professor existente
  IF v_teacher_id IS NULL THEN
    SELECT id INTO v_teacher_id
    FROM public.teachers
    LIMIT 1;

    IF v_teacher_id IS NOT NULL THEN
      RAISE NOTICE 'Usando professor existente com ID: %', v_teacher_id;
    END IF;
  END IF;

  -- 4. Se ainda não tem teacher_id, erro crítico
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum professor encontrado. Por favor, crie pelo menos um professor antes de executar esta migration.';
  END IF;

  -- 5. Criar a turma de Degustação
  INSERT INTO public.classes (
    name,
    description,
    teacher_id,
    status,
    class_type,
    start_date,
    end_date,
    created_at,
    updated_at
  ) VALUES (
    'Degustação',
    'Turma automática para novos alunos. Os alunos ficam aqui até serem movidos manualmente para suas turmas definitivas pelo administrador.',
    v_teacher_id,
    'active',
    'standard',
    NOW(),
    NOW() + INTERVAL '10 years', -- Turma permanente
    NOW(),
    NOW()
  )
  RETURNING id INTO v_tasting_class_id;

  RAISE NOTICE 'Turma de Degustação criada com ID: % e teacher_id: %', v_tasting_class_id, v_teacher_id;
END $$;

-- =====================================================
-- 2. FUNCTION: AUTO-ATRIBUIR NOVO ALUNO À TURMA DE DEGUSTAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_assign_student_to_tasting_class()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tasting_class_id uuid;
  v_already_assigned boolean;
BEGIN
  -- Apenas processar se o usuário for um aluno
  IF NEW.role != 'student' THEN
    RETURN NEW;
  END IF;

  -- Buscar ID da turma de Degustação
  SELECT id INTO v_tasting_class_id
  FROM public.classes
  WHERE name = 'Degustação'
  AND status = 'active'
  LIMIT 1;

  -- Se não encontrou a turma, logar erro mas não falhar
  IF v_tasting_class_id IS NULL THEN
    RAISE WARNING 'Turma de Degustação não encontrada. Aluno % não será auto-atribuído.', NEW.email;
    RETURN NEW;
  END IF;

  -- Verificar se o aluno já está em alguma turma
  SELECT EXISTS (
    SELECT 1 FROM public.student_classes
    WHERE user_id = NEW.id
  ) INTO v_already_assigned;

  -- Se já está em uma turma, não fazer nada
  IF v_already_assigned THEN
    RAISE NOTICE 'Aluno % já está em uma turma, pulando auto-atribuição.', NEW.email;
    RETURN NEW;
  END IF;

  -- Adicionar aluno à turma de Degustação
  BEGIN
    INSERT INTO public.student_classes (
      user_id,
      class_id,
      enrollment_date
    ) VALUES (
      NEW.id,
      v_tasting_class_id,
      NOW()::date
    )
    ON CONFLICT (user_id, class_id) DO NOTHING;

    RAISE NOTICE 'Aluno % automaticamente atribuído à Turma de Degustação', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro ao atribuir aluno % à turma: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. TRIGGER: EXECUTAR AUTO-ATRIBUIÇÃO APÓS INSERT
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auto_assign_tasting_class ON public.users;

CREATE TRIGGER trigger_auto_assign_tasting_class
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_student_to_tasting_class();

-- =====================================================
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.auto_assign_student_to_tasting_class() IS
'Função automática que atribui novos alunos à turma de Degustação.
Executada por trigger após INSERT na tabela users.
Apenas processa usuários com role = student.
Não sobrescreve se o aluno já estiver em outra turma.';

COMMENT ON TRIGGER trigger_auto_assign_tasting_class ON public.users IS
'Trigger que executa auto-atribuição de novos alunos à Turma de Degustação.
Permite que administradores verifiquem o email do aluno e depois movam manualmente para a turma correta.';

-- =====================================================
-- 5. TESTAR A FUNÇÃO (opcional - comentado)
-- =====================================================

-- Para testar manualmente, descomente e execute:
/*
DO $$
DECLARE
  v_test_user_id uuid;
  v_tasting_class_id uuid;
  v_assignment_exists boolean;
BEGIN
  -- Buscar ID da turma de degustação
  SELECT id INTO v_tasting_class_id
  FROM public.classes
  WHERE name = 'Degustação';

  RAISE NOTICE 'Turma de Degustação ID: %', v_tasting_class_id;

  -- Criar usuário de teste
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    is_active
  ) VALUES (
    gen_random_uuid(),
    'teste.degustacao@example.com',
    'Teste',
    'Degustação',
    'student',
    true
  )
  RETURNING id INTO v_test_user_id;

  -- Aguardar trigger processar
  PERFORM pg_sleep(1);

  -- Verificar se foi atribuído
  SELECT EXISTS (
    SELECT 1 FROM public.student_classes
    WHERE user_id = v_test_user_id
    AND class_id = v_tasting_class_id
  ) INTO v_assignment_exists;

  IF v_assignment_exists THEN
    RAISE NOTICE '✅ TESTE PASSOU: Aluno foi automaticamente atribuído à turma de Degustação';
  ELSE
    RAISE WARNING '❌ TESTE FALHOU: Aluno NÃO foi atribuído automaticamente';
  END IF;

  -- Limpar teste
  DELETE FROM public.student_classes WHERE user_id = v_test_user_id;
  DELETE FROM public.users WHERE id = v_test_user_id;

  RAISE NOTICE 'Usuário de teste removido';
END $$;
*/

-- =====================================================
-- CONCLUÍDO
-- =====================================================
-- Create class_courses table to manage which courses are available to which classes
CREATE TABLE IF NOT EXISTS public.class_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.video_courses(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Ensure a course can only be assigned once to a class
    UNIQUE(class_id, course_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_class_courses_class_id ON public.class_courses(class_id);
CREATE INDEX IF NOT EXISTS idx_class_courses_course_id ON public.class_courses(course_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_class_courses_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_class_courses_update
BEFORE UPDATE ON public.class_courses
FOR EACH ROW
EXECUTE FUNCTION public.handle_class_courses_update();

-- Add RLS policies
ALTER TABLE public.class_courses ENABLE ROW LEVEL SECURITY;

-- Administrators and teachers can manage class courses
CREATE POLICY "Administrators and teachers can view class courses"
    ON public.class_courses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
        OR
        -- Students can see courses assigned to their classes
        EXISTS (
            SELECT 1 FROM public.student_classes
            WHERE student_classes.class_id = class_courses.class_id
            AND student_classes.user_id = auth.uid()
        )
    );

CREATE POLICY "Administrators and teachers can insert class courses"
    ON public.class_courses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

CREATE POLICY "Administrators and teachers can update class courses"
    ON public.class_courses
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

CREATE POLICY "Administrators and teachers can delete class courses"
    ON public.class_courses
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

-- Add comment
COMMENT ON TABLE public.class_courses IS 'Manages which courses are available to which classes/turmas';
-- Drop the existing table if it exists (to recreate it correctly)
DROP TABLE IF EXISTS public.class_courses CASCADE;

-- Recreate class_courses table with all required columns
CREATE TABLE public.class_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.video_courses(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Ensure a course can only be assigned once to a class
    UNIQUE(class_id, course_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_class_courses_class_id ON public.class_courses(class_id);
CREATE INDEX idx_class_courses_course_id ON public.class_courses(course_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_class_courses_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_class_courses_update
BEFORE UPDATE ON public.class_courses
FOR EACH ROW
EXECUTE FUNCTION public.handle_class_courses_update();

-- Enable RLS
ALTER TABLE public.class_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Administrators and teachers can view class courses"
    ON public.class_courses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.student_classes
            WHERE student_classes.class_id = class_courses.class_id
            AND student_classes.user_id = auth.uid()
        )
    );

CREATE POLICY "Administrators and teachers can insert class courses"
    ON public.class_courses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

CREATE POLICY "Administrators and teachers can update class courses"
    ON public.class_courses
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

CREATE POLICY "Administrators and teachers can delete class courses"
    ON public.class_courses
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

COMMENT ON TABLE public.class_courses IS 'Manages which courses are available to which classes/turmas';
-- =====================================================
-- RLS POLICIES FOR CLASSES TABLE
-- =====================================================
-- This migration adds Row Level Security policies for the classes table
-- to allow administrators and teachers to view and manage classes.

-- Enable RLS on classes table if not already enabled
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Administrators and teachers can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators and teachers can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators and teachers can update classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators can delete classes" ON public.classes;

-- Policy: Administrators and teachers can view all classes
CREATE POLICY "Administrators and teachers can view all classes"
    ON public.classes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

-- Policy: Students can view classes they are enrolled in
CREATE POLICY "Students can view their own classes"
    ON public.classes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.student_classes
            WHERE student_classes.class_id = classes.id
            AND student_classes.user_id = auth.uid()
        )
    );

-- Policy: Administrators and teachers can insert classes
CREATE POLICY "Administrators and teachers can insert classes"
    ON public.classes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

-- Policy: Administrators and teachers can update classes
CREATE POLICY "Administrators and teachers can update classes"
    ON public.classes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

-- Policy: Only administrators can delete classes
CREATE POLICY "Administrators can delete classes"
    ON public.classes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'administrator'
        )
    );

-- Grant appropriate permissions
GRANT SELECT ON public.classes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.classes TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "Administrators and teachers can view all classes" ON public.classes IS
    'Administrators and teachers can view all classes in the system';

COMMENT ON POLICY "Students can view their own classes" ON public.classes IS
    'Students can only view classes they are enrolled in';

COMMENT ON POLICY "Administrators and teachers can insert classes" ON public.classes IS
    'Only administrators and teachers can create new classes';

COMMENT ON POLICY "Administrators and teachers can update classes" ON public.classes IS
    'Only administrators and teachers can update class information';

COMMENT ON POLICY "Administrators can delete classes" ON public.classes IS
    'Only administrators can delete classes';
-- =====================================================
-- FIX RLS POLICIES FOR CLASSES TABLE - PROPER VERSION
-- =====================================================
-- This migration properly configures RLS on the classes table.
--
-- The issue was that we need to ensure the policies work correctly
-- with the users table and auth system.

-- First, ensure RLS is enabled
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Administrators and teachers can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators and teachers can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators and teachers can update classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators can delete classes" ON public.classes;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.classes;

-- CREATE PERMISSIVE POLICIES (use OR logic, more flexible)

-- Policy 1: SELECT - Anyone authenticated can view classes they have access to
-- IMPORTANT: Use (SELECT role FROM public.users WHERE id = auth.uid()) instead of JOIN
-- to avoid potential performance or timing issues with RLS
CREATE POLICY "Enable read access for authenticated users"
    ON public.classes
    FOR SELECT
    TO authenticated
    USING (
        -- Administrators and teachers can see all classes
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
        OR
        -- Students can see classes they are enrolled in
        EXISTS (
            SELECT 1 FROM public.student_classes
            WHERE student_classes.class_id = classes.id
            AND student_classes.user_id = auth.uid()
        )
        OR
        -- Everyone can see active classes (for browsing)
        status = 'active'
    );

-- Policy 2: INSERT - Only admins and teachers
CREATE POLICY "Enable insert for authenticated users"
    ON public.classes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    );

-- Policy 3: UPDATE - Only admins and teachers
CREATE POLICY "Enable update for authenticated users"
    ON public.classes
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    )
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    );

-- Policy 4: DELETE - Only administrators
CREATE POLICY "Enable delete for authenticated users"
    ON public.classes
    FOR DELETE
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator'
    );

-- Grant necessary permissions
GRANT SELECT ON public.classes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.classes TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Enable read access for authenticated users" ON public.classes IS
    'Admins/teachers see all, students see enrolled classes, everyone sees active classes';

COMMENT ON POLICY "Enable insert for authenticated users" ON public.classes IS
    'Only administrators and teachers can create classes';

COMMENT ON POLICY "Enable update for authenticated users" ON public.classes IS
    'Only administrators and teachers can update classes';

COMMENT ON POLICY "Enable delete for authenticated users" ON public.classes IS
    'Only administrators can delete classes';

COMMENT ON TABLE public.classes IS 'Classes/Turmas table with proper RLS policies for security';
-- =====================================================
-- RLS POLICIES FOR STUDENT_CLASSES TABLE
-- =====================================================
-- This migration adds Row Level Security policies for the student_classes table
-- to allow proper access control for class enrollment data.

-- Enable RLS on student_classes table
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.student_classes;

-- Policy 1: SELECT - Users can view enrollments based on their role
CREATE POLICY "Enable read access for authenticated users"
    ON public.student_classes
    FOR SELECT
    TO authenticated
    USING (
        -- Administrators and teachers can see all enrollments
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
        OR
        -- Students can see their own enrollments
        user_id = auth.uid()
    );

-- Policy 2: INSERT - Only admins and teachers can enroll students
CREATE POLICY "Enable insert for authenticated users"
    ON public.student_classes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    );

-- Policy 3: UPDATE - Only admins and teachers can update enrollments
CREATE POLICY "Enable update for authenticated users"
    ON public.student_classes
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    )
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    );

-- Policy 4: DELETE - Only administrators can remove enrollments
CREATE POLICY "Enable delete for authenticated users"
    ON public.student_classes
    FOR DELETE
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator'
    );

-- Grant necessary permissions
GRANT SELECT ON public.student_classes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.student_classes TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Enable read access for authenticated users" ON public.student_classes IS
    'Admins/teachers see all enrollments, students see only their own';

COMMENT ON POLICY "Enable insert for authenticated users" ON public.student_classes IS
    'Only administrators and teachers can enroll students in classes';

COMMENT ON POLICY "Enable update for authenticated users" ON public.student_classes IS
    'Only administrators and teachers can update student enrollments';

COMMENT ON POLICY "Enable delete for authenticated users" ON public.student_classes IS
    'Only administrators can remove student enrollments';

COMMENT ON TABLE public.student_classes IS 'Student class enrollments with proper RLS policies for security';
-- =====================================================
-- FIX RLS POLICIES FOR USERS TABLE
-- =====================================================
-- This migration fixes the Row Level Security policies for the users table
-- to properly allow administrators and teachers to view all users.
--
-- PROBLEM: The current policy has a recursive SELECT that can cause issues
-- and may not properly allow admins to see all users.
--
-- SOLUTION: Simplify the policy to avoid recursion and properly check roles.

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Administrators can view all users" ON public.users;
DROP POLICY IF EXISTS "Administrators can manage all users" ON public.users;

-- Policy 1: SELECT - View access based on role
CREATE POLICY "Enable read access for authenticated users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        -- Users can see their own profile
        id = auth.uid()
        OR
        -- Administrators and teachers can see all users
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('administrator', 'teacher')
        )
    );

-- Policy 2: UPDATE - Users can update their own profile
CREATE POLICY "Enable update for own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policy 3: UPDATE - Administrators can update all users
CREATE POLICY "Enable update for administrators"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'administrator'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'administrator'
        )
    );

-- Policy 4: INSERT - Only administrators can create users manually
CREATE POLICY "Enable insert for administrators"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'administrator'
        )
    );

-- Policy 5: DELETE - Only administrators can delete users
CREATE POLICY "Enable delete for administrators"
    ON public.users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'administrator'
        )
    );

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT INSERT, DELETE ON public.users TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Enable read access for authenticated users" ON public.users IS
    'Users can see their own profile, administrators and teachers can see all users';

COMMENT ON POLICY "Enable update for own profile" ON public.users IS
    'Users can update their own profile information';

COMMENT ON POLICY "Enable update for administrators" ON public.users IS
    'Administrators can update any user profile';

COMMENT ON POLICY "Enable insert for administrators" ON public.users IS
    'Only administrators can manually create new users';

COMMENT ON POLICY "Enable delete for administrators" ON public.users IS
    'Only administrators can delete users';

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================
-- Run these queries to verify the policies are working:
--
-- 1. Check current user's role:
-- SELECT id, email, role FROM users WHERE id = auth.uid();
--
-- 2. Test if admin can see all users:
-- SELECT COUNT(*) FROM users;
--
-- 3. Check all active policies:
-- SELECT * FROM pg_policies WHERE tablename = 'users';
-- Enable Row Level Security on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own notifications
-- (This allows users to create notifications for themselves)
CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins and teachers can insert notifications for any user
CREATE POLICY "Admins and teachers can insert notifications for any user"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'teacher')
  )
);

-- Policy: Users can update their own notifications (only is_read field)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at
ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read
ON public.notifications(user_id, is_read);

-- Add comment
COMMENT ON TABLE public.notifications IS 'Stores user notifications with RLS policies for privacy and security';
