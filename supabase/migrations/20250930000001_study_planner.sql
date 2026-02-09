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

