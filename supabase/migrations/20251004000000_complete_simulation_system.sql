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
