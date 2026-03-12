-- Seed expanded achievements set
-- Uses ON CONFLICT to avoid duplicates if some already exist

-- Ensure category column exists
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'geral';

-- Add unique constraint on name if not exists (needed for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'achievements_name_key'
  ) THEN
    ALTER TABLE achievements ADD CONSTRAINT achievements_name_key UNIQUE (name);
  END IF;
END $$;

-- Marco / XP achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Primeiro Login', 'Fez login na plataforma pela primeira vez', '🎉', 10, 'marco'),
  ('Estudante Dedicado', 'Alcançou 500 XP de experiência', '📚', 25, 'marco'),
  ('Especialista', 'Alcançou 2.500 XP de experiência', '💎', 50, 'marco'),
  ('Mestre do Conhecimento', 'Alcançou 10.000 XP de experiência', '👑', 100, 'marco'),
  ('Lenda', 'Alcançou 20.000 XP de experiência', '🌟', 200, 'marco')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- Ranking achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Top 10', 'Entrou no Top 10 do ranking geral', '🏆', 50, 'ranking'),
  ('Top 3', 'Entrou no Top 3 do ranking geral', '🥇', 100, 'ranking'),
  ('Número 1', 'Alcançou a primeira posição do ranking', '👑', 200, 'ranking')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- Streak / Atividade achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Maratonista', 'Completou 7 atividades na plataforma', '🏃', 15, 'atividade'),
  ('Imparável', 'Completou 30 atividades na plataforma', '🔥', 30, 'atividade'),
  ('Centurião', 'Completou 100 atividades na plataforma', '💯', 75, 'atividade')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- Aulas achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Primeira Aula', 'Assistiu sua primeira aula completa', '▶️', 10, 'aulas'),
  ('Assistiu 10 Aulas', 'Completou 10 aulas na plataforma', '📺', 25, 'aulas'),
  ('Assistiu 50 Aulas', 'Completou 50 aulas na plataforma', '🎬', 50, 'aulas'),
  ('Assistiu 100 Aulas', 'Completou 100 aulas na plataforma', '🏅', 100, 'aulas')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- Comentários achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Comentarista', 'Fez 5 comentários em aulas', '💬', 15, 'comentarios'),
  ('Participativo', 'Fez 20 comentários em aulas', '🗣️', 30, 'comentarios'),
  ('Debatedor', 'Fez 50 comentários em aulas', '🎤', 50, 'comentarios')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- Avaliações achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Avaliador', 'Avaliou 10 aulas', '⭐', 15, 'avaliacoes'),
  ('Crítico', 'Avaliou 30 aulas', '🔍', 30, 'avaliacoes')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- Flashcard achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Flashcard Iniciante', 'Completou sua primeira sessão de flashcards', '🃏', 10, 'flashcards'),
  ('Flashcard Master', 'Completou 20 sessões de flashcards', '🎯', 30, 'flashcards'),
  ('Memória de Elefante', 'Completou 50 sessões de flashcards', '🐘', 75, 'flashcards')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- Quiz achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Primeiro Quiz', 'Completou seu primeiro quiz', '❓', 10, 'quizzes'),
  ('Quiz Champion', 'Completou 10 quizzes', '⚡', 30, 'quizzes'),
  ('Mestre dos Quizzes', 'Completou 30 quizzes', '🧠', 75, 'quizzes')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- Comunidade achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Primeiro Post', 'Fez sua primeira publicação na comunidade', '✍️', 10, 'comunidade'),
  ('Comunicador', 'Publicou 5 posts na comunidade', '📢', 25, 'comunidade'),
  ('Influencer', 'Publicou 20 posts na comunidade', '🌐', 50, 'comunidade'),
  ('Colaborador', 'Respondeu 10 posts na comunidade', '🤝', 25, 'comunidade'),
  ('Popular', 'Recebeu 50 reações na comunidade', '❤️', 30, 'comunidade')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- Simulado achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Simulado Completo', 'Completou seu primeiro simulado', '📋', 15, 'simulados'),
  ('Simulador Nato', 'Completou 10 simulados', '🎯', 50, 'simulados')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- Redação achievements
INSERT INTO achievements (name, description, icon_url, xp_reward, category)
VALUES
  ('Escritor', 'Enviou sua primeira redação', '✏️', 15, 'redacoes'),
  ('Autor Dedicado', 'Enviou 5 redações', '📝', 40, 'redacoes')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

