-- =====================================================
-- SCRIPTS ESSENCIAIS PARA O EVEREST
-- Execute este arquivo no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. PLANO DE ESTUDOS (Resolve o erro atual)
-- =====================================================

-- Tabela para tópicos de estudo
CREATE TABLE IF NOT EXISTS study_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'portugues', 'redacao', 'matematica', 'raciocinio-logico',
    'direito-constitucional', 'direito-administrativo', 'direito-penal',
    'direito-civil', 'informatica', 'atualidades', 'conhecimentos-gerais',
    'ingles', 'historia', 'geografia', 'legislacao', 'outros'
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
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_created_at ON pomodoro_sessions(created_at);

-- Função para incrementar pomodoros
CREATE OR REPLACE FUNCTION increment_topic_pomodoros(topic_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE study_topics
  SET pomodoros = pomodoros + 1, updated_at = NOW()
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

-- RLS Policies para study_topics
ALTER TABLE study_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own study topics" ON study_topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own study topics" ON study_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own study topics" ON study_topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own study topics" ON study_topics FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies para pomodoro_sessions
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own pomodoro sessions" ON pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pomodoro sessions" ON pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. NOTIFICAÇÕES
-- =====================================================

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_id UUID,
    related_entity_type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- RLS Policies para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins and teachers can insert notifications for any user" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);

-- =====================================================
-- 3. CONQUISTAS E GAMIFICAÇÃO (Básico)
-- =====================================================

-- Tabela de conquistas
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    xp_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Adicionar constraint UNIQUE na coluna name se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'achievements_name_key'
        AND conrelid = 'public.achievements'::regclass
    ) THEN
        ALTER TABLE public.achievements ADD CONSTRAINT achievements_name_key UNIQUE (name);
    END IF;
END $$;

-- Tabela de conquistas dos usuários
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Adicionar constraint UNIQUE para evitar duplicatas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_achievements_user_id_achievement_id_key'
        AND conrelid = 'public.user_achievements'::regclass
    ) THEN
        ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_user_id_achievement_id_key UNIQUE (user_id, achievement_id);
    END IF;
END $$;

-- Tabela de pontuações
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_id TEXT,
    score_value INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Inserir conquistas padrão (apenas se não existirem)
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
WHERE NOT EXISTS (
    SELECT 1 FROM public.achievements WHERE achievements.name = v.name
);

-- RLS Policies
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Users can view their own user achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own user achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own scores" ON public.scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scores" ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_activity_type ON public.scores(activity_type);

-- =====================================================
-- FIM - Todos os scripts essenciais foram aplicados!
-- =====================================================
