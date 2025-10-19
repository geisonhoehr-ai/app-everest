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
