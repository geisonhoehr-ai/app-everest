-- Restringir acesso a aulas apenas para alunos matriculados
-- Antes: qualquer aluno autenticado via SELECT em curso ativo
-- Agora: aluno precisa estar matriculado em uma turma que contém o curso

-- Recriar policy de SELECT em video_lessons
DROP POLICY IF EXISTS "Todos podem ver aulas de cursos ativos" ON public.video_lessons;
CREATE POLICY "Alunos matriculados podem ver aulas"
  ON public.video_lessons FOR SELECT
  TO authenticated
  USING (
    -- Aulas preview são públicas para autenticados
    is_preview = true
    OR
    -- Aluno matriculado em turma que contém o curso da aula
    EXISTS (
      SELECT 1
      FROM public.video_modules vm
      INNER JOIN public.class_courses cc ON cc.course_id = vm.course_id
      INNER JOIN public.student_classes sc ON sc.class_id = cc.class_id
      WHERE vm.id = video_lessons.module_id
        AND sc.user_id = auth.uid()
    )
    OR
    -- Admins e professores veem todas
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('administrator', 'teacher')
    )
  );

-- Mesma lógica para video_modules
DROP POLICY IF EXISTS "Todos podem ver módulos de cursos ativos" ON public.video_modules;
CREATE POLICY "Alunos matriculados podem ver módulos"
  ON public.video_modules FOR SELECT
  TO authenticated
  USING (
    -- Aluno matriculado em turma que contém o curso
    EXISTS (
      SELECT 1
      FROM public.class_courses cc
      INNER JOIN public.student_classes sc ON sc.class_id = cc.class_id
      WHERE cc.course_id = video_modules.course_id
        AND sc.user_id = auth.uid()
    )
    OR
    -- Admins e professores veem todos
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('administrator', 'teacher')
    )
  );

-- Mesma lógica para video_courses
DROP POLICY IF EXISTS "Todos podem ver cursos ativos" ON public.video_courses;
CREATE POLICY "Alunos matriculados podem ver cursos"
  ON public.video_courses FOR SELECT
  TO authenticated
  USING (
    -- Aluno matriculado em turma que contém o curso
    EXISTS (
      SELECT 1
      FROM public.class_courses cc
      INNER JOIN public.student_classes sc ON sc.class_id = cc.class_id
      WHERE cc.course_id = video_courses.id
        AND sc.user_id = auth.uid()
    )
    OR
    -- Admins e professores veem todos
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('administrator', 'teacher')
    )
  );
