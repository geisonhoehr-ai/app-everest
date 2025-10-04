-- =====================================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE
-- =====================================================

-- 1. ADICIONAR COLUNAS QUE FALTAM NA TABELA QUIZZES
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
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_quizzes_type ON public.quizzes(type);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled ON public.quizzes(scheduled_start, scheduled_end);

-- 3. CRIAR TABELA DE TURMAS POR QUIZ
CREATE TABLE IF NOT EXISTS public.quiz_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_classes_quiz ON public.quiz_classes(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_classes_class ON public.quiz_classes(class_id);

-- 4. CRIAR TABELA DE TEXTOS DE LEITURA
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

-- 5. ADICIONAR COLUNAS EM QUIZ_QUESTIONS
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS reading_text_id UUID REFERENCES public.quiz_reading_texts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS question_number VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_reading_text ON public.quiz_questions(reading_text_id);

-- 6. CRIAR TABELA DE TENTATIVAS
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

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_status ON public.quiz_attempts(status);

-- 7. CRIAR TABELA DE RESPOSTAS
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

-- 8. CRIAR TABELA DE ESTATÍSTICAS
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

CREATE INDEX IF NOT EXISTS idx_quiz_question_stats_question ON public.quiz_question_stats(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_question_stats_quiz ON public.quiz_question_stats(quiz_id);

-- 9. FUNÇÃO: VERIFICAR ACESSO AO QUIZ
CREATE OR REPLACE FUNCTION can_user_access_quiz(p_quiz_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_quiz RECORD;
  v_user_classes UUID[];
  v_quiz_classes UUID[];
BEGIN
  SELECT * INTO v_quiz FROM public.quizzes WHERE id = p_quiz_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF v_quiz.status IS NOT NULL AND v_quiz.status != 'published' THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role IN ('administrator', 'teacher')) THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  IF v_quiz.scheduled_start IS NOT NULL AND NOW() < v_quiz.scheduled_start THEN RETURN FALSE; END IF;
  IF v_quiz.scheduled_end IS NOT NULL AND NOW() > v_quiz.scheduled_end THEN RETURN FALSE; END IF;

  SELECT ARRAY_AGG(class_id) INTO v_quiz_classes FROM public.quiz_classes WHERE quiz_id = p_quiz_id;
  IF v_quiz_classes IS NULL THEN RETURN TRUE; END IF;

  SELECT ARRAY_AGG(class_id) INTO v_user_classes FROM public.student_classes WHERE user_id = p_user_id;
  IF v_user_classes IS NULL THEN RETURN FALSE; END IF;

  RETURN v_user_classes && v_quiz_classes;
END;
$$ LANGUAGE plpgsql;

-- 10. FUNÇÃO: CALCULAR RESULTADO
CREATE OR REPLACE FUNCTION calculate_quiz_result(p_attempt_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_points DECIMAL(5,2);
  v_points_earned DECIMAL(5,2);
  v_total_questions INTEGER;
  v_correct INTEGER;
  v_incorrect INTEGER;
BEGIN
  SELECT COALESCE(SUM(points), 0), COUNT(*) INTO v_total_points, v_total_questions
  FROM public.quiz_questions qq
  INNER JOIN public.quiz_attempts qa ON qa.quiz_id = qq.quiz_id
  WHERE qa.id = p_attempt_id;

  SELECT COALESCE(SUM(points_earned), 0) INTO v_points_earned FROM public.quiz_answers WHERE attempt_id = p_attempt_id;

  SELECT COUNT(*) FILTER (WHERE is_correct = true), COUNT(*) FILTER (WHERE is_correct = false)
  INTO v_correct, v_incorrect FROM public.quiz_answers WHERE attempt_id = p_attempt_id;

  v_result := jsonb_build_object(
    'total_points', v_total_points,
    'points_earned', v_points_earned,
    'percentage', CASE WHEN v_total_points > 0 THEN (v_points_earned / v_total_points * 100) ELSE 0 END,
    'total_questions', v_total_questions,
    'correct_answers', v_correct,
    'incorrect_answers', v_incorrect,
    'unanswered', v_total_questions - (v_correct + v_incorrect)
  );

  UPDATE public.quiz_attempts SET
    score = v_points_earned,
    total_points = v_total_points,
    percentage = CASE WHEN v_total_points > 0 THEN (v_points_earned / v_total_points * 100) ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_attempt_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 11. FUNÇÃO: SUBMETER SIMULADO
CREATE OR REPLACE FUNCTION submit_quiz_attempt(p_attempt_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_time_spent INTEGER;
BEGIN
  SELECT EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER INTO v_time_spent
  FROM public.quiz_attempts WHERE id = p_attempt_id;

  UPDATE public.quiz_attempts SET
    status = 'submitted',
    submitted_at = NOW(),
    time_spent_seconds = v_time_spent,
    updated_at = NOW()
  WHERE id = p_attempt_id;

  v_result := calculate_quiz_result(p_attempt_id);

  INSERT INTO public.quiz_question_stats (question_id, quiz_id, total_answers, correct_answers, incorrect_answers)
  SELECT qa.question_id, qq.quiz_id, 1,
    CASE WHEN qa.is_correct THEN 1 ELSE 0 END,
    CASE WHEN NOT qa.is_correct THEN 1 ELSE 0 END
  FROM public.quiz_answers qa
  INNER JOIN public.quiz_questions qq ON qq.id = qa.question_id
  WHERE qa.attempt_id = p_attempt_id
  ON CONFLICT (question_id) DO UPDATE SET
    total_answers = quiz_question_stats.total_answers + 1,
    correct_answers = quiz_question_stats.correct_answers + EXCLUDED.correct_answers,
    incorrect_answers = quiz_question_stats.incorrect_answers + EXCLUDED.incorrect_answers,
    updated_at = NOW();

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 12. FUNÇÃO: VALIDAR CARTÃO RESPOSTA
CREATE OR REPLACE FUNCTION validate_answer_sheet(p_attempt_id UUID)
RETURNS JSONB AS $$
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
  SELECT quiz_id INTO v_quiz_id FROM public.quiz_attempts WHERE id = p_attempt_id;

  SELECT COUNT(*) as total, COALESCE(SUM(points), 0) as total_points
  INTO v_questions FROM public.quiz_questions WHERE quiz_id = v_quiz_id;

  v_total_points := v_questions.total_points;

  SELECT
    COUNT(*) FILTER (WHERE is_correct = true) as correct,
    COUNT(*) FILTER (WHERE is_correct = false) as incorrect,
    COALESCE(SUM(points_earned), 0) as earned
  INTO v_answers FROM public.quiz_answers WHERE attempt_id = p_attempt_id;

  v_correct_count := v_answers.correct;
  v_incorrect_count := v_answers.incorrect;
  v_earned_points := v_answers.earned;
  v_blank_count := v_questions.total - (v_correct_count + v_incorrect_count);

  UPDATE public.quiz_attempts SET
    score = v_earned_points,
    total_points = v_total_points,
    percentage = CASE WHEN v_total_points > 0 THEN (v_earned_points / v_total_points * 100) ELSE 0 END,
    status = 'submitted',
    submitted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_attempt_id;

  v_result := jsonb_build_object(
    'correct_count', v_correct_count,
    'incorrect_count', v_incorrect_count,
    'blank_count', v_blank_count,
    'total_points', v_total_points,
    'earned_points', v_earned_points,
    'percentage', CASE WHEN v_total_points > 0 THEN (v_earned_points / v_total_points * 100) ELSE 0 END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 13. TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quiz_reading_texts_updated_at ON public.quiz_reading_texts;
CREATE TRIGGER update_quiz_reading_texts_updated_at BEFORE UPDATE ON public.quiz_reading_texts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quiz_attempts_updated_at ON public.quiz_attempts;
CREATE TRIGGER update_quiz_attempts_updated_at BEFORE UPDATE ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quiz_answers_updated_at ON public.quiz_answers;
CREATE TRIGGER update_quiz_answers_updated_at BEFORE UPDATE ON public.quiz_answers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. RLS POLICIES
ALTER TABLE public.quiz_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_reading_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_question_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins gerenciam turmas" ON public.quiz_classes;
CREATE POLICY "Admins gerenciam turmas" ON public.quiz_classes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

DROP POLICY IF EXISTS "Todos veem turmas" ON public.quiz_classes;
CREATE POLICY "Todos veem turmas" ON public.quiz_classes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins gerenciam textos" ON public.quiz_reading_texts;
CREATE POLICY "Admins gerenciam textos" ON public.quiz_reading_texts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

DROP POLICY IF EXISTS "Alunos veem textos" ON public.quiz_reading_texts;
CREATE POLICY "Alunos veem textos" ON public.quiz_reading_texts FOR SELECT TO authenticated
USING (can_user_access_quiz(quiz_id, auth.uid()));

DROP POLICY IF EXISTS "Criar tentativas" ON public.quiz_attempts;
CREATE POLICY "Criar tentativas" ON public.quiz_attempts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Ver tentativas" ON public.quiz_attempts;
CREATE POLICY "Ver tentativas" ON public.quiz_attempts FOR ALL TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins veem tentativas" ON public.quiz_attempts;
CREATE POLICY "Admins veem tentativas" ON public.quiz_attempts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

DROP POLICY IF EXISTS "Gerenciar respostas" ON public.quiz_answers;
CREATE POLICY "Gerenciar respostas" ON public.quiz_answers FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.quiz_attempts WHERE id = quiz_answers.attempt_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins veem respostas" ON public.quiz_answers;
CREATE POLICY "Admins veem respostas" ON public.quiz_answers FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

DROP POLICY IF EXISTS "Ver estatísticas" ON public.quiz_question_stats;
CREATE POLICY "Ver estatísticas" ON public.quiz_question_stats FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Atualizar estatísticas" ON public.quiz_question_stats;
CREATE POLICY "Atualizar estatísticas" ON public.quiz_question_stats FOR ALL TO authenticated USING (true);

-- 15. VIEWS
DROP VIEW IF EXISTS user_available_quizzes CASCADE;
CREATE VIEW user_available_quizzes AS
SELECT q.*,
  CASE
    WHEN q.scheduled_start IS NOT NULL AND NOW() < q.scheduled_start THEN 'scheduled'
    WHEN q.scheduled_end IS NOT NULL AND NOW() > q.scheduled_end THEN 'expired'
    ELSE 'available'
  END as availability_status,
  (SELECT COUNT(*) FROM public.quiz_attempts WHERE quiz_id = q.id AND user_id = auth.uid()) as user_attempts_count
FROM public.quizzes q
WHERE can_user_access_quiz(q.id, auth.uid());

DROP VIEW IF EXISTS user_quiz_results CASCADE;
CREATE VIEW user_quiz_results AS
SELECT qa.id as attempt_id, qa.quiz_id, q.title as quiz_title, q.type as quiz_type,
  qa.started_at, qa.submitted_at, qa.time_spent_seconds, qa.score, qa.total_points, qa.percentage, qa.status,
  (SELECT COUNT(*) FILTER (WHERE is_correct = true) FROM public.quiz_answers WHERE attempt_id = qa.id) as correct_answers,
  (SELECT COUNT(*) FILTER (WHERE is_correct = false) FROM public.quiz_answers WHERE attempt_id = qa.id) as incorrect_answers
FROM public.quiz_attempts qa
INNER JOIN public.quizzes q ON q.id = qa.quiz_id
WHERE qa.user_id = auth.uid()
ORDER BY qa.started_at DESC;

-- 16. COMENTÁRIOS
COMMENT ON COLUMN public.quizzes.type IS
'Tipos de quiz:
- quiz: Quiz rápido de estudo
- simulation: Simulado completo com texto e timer
- answer_sheet: Apenas cartão resposta (prova presencial)';

-- FIM DA MIGRAÇÃO
