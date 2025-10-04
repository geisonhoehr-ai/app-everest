-- PARTE 2: CRIAR APENAS AS TABELAS (SEM FUNÇÕES)

-- Criar tabela quiz_classes
CREATE TABLE IF NOT EXISTS public.quiz_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, class_id)
);

-- Criar tabela quiz_reading_texts
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

-- Adicionar colunas em quiz_questions
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS reading_text_id UUID REFERENCES public.quiz_reading_texts(id) ON DELETE SET NULL;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_number VARCHAR(10);

-- Criar tabela quiz_attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  score DECIMAL(5,2),
  total_points INTEGER,
  percentage DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'in_progress',
  answers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela quiz_answers
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

-- Criar tabela quiz_question_stats
CREATE TABLE IF NOT EXISTS public.quiz_question_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  total_answers INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  average_time_seconds INTEGER,
  difficulty_level VARCHAR(20),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id)
);
