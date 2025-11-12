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
