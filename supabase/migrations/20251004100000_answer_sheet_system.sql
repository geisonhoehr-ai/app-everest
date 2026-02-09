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
