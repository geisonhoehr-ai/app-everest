-- =====================================================
-- POLÍTICAS RLS PARA ADMINISTRAÇÃO
-- =====================================================
-- Este script adiciona políticas de Row Level Security (RLS)
-- para as tabelas principais que estavam sem proteção.
--
-- Apenas administradores e professores podem gerenciar:
-- - Quizzes
-- - Questões (quiz_questions)
-- - Temas de redação (essay_prompts)
-- - Cursos (video_courses, video_modules, video_lessons)
-- - Matérias e Tópicos (subjects, topics)

-- =====================================================
-- 1. TABELA: quizzes
-- =====================================================
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Todos podem ver quizzes publicados
DROP POLICY IF EXISTS "Todos podem ver quizzes publicados" ON public.quizzes;
CREATE POLICY "Todos podem ver quizzes publicados"
  ON public.quizzes FOR SELECT
  TO authenticated
  USING (
    -- Alunos só veem quizzes publicados
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'student'
      )
      AND (status IS NULL OR status = 'published')
    )
    OR
    -- Admins e professores veem todos
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('administrator', 'teacher')
      )
    )
  );

-- Apenas admins e professores podem criar quizzes
DROP POLICY IF EXISTS "Admins e professores podem criar quizzes" ON public.quizzes;
CREATE POLICY "Admins e professores podem criar quizzes"
  ON public.quizzes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar quizzes
DROP POLICY IF EXISTS "Admins e professores podem atualizar quizzes" ON public.quizzes;
CREATE POLICY "Admins e professores podem atualizar quizzes"
  ON public.quizzes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar quizzes
DROP POLICY IF EXISTS "Apenas admins podem deletar quizzes" ON public.quizzes;
CREATE POLICY "Apenas admins podem deletar quizzes"
  ON public.quizzes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 2. TABELA: quiz_questions
-- =====================================================
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Todos podem ver questões de quizzes acessíveis
DROP POLICY IF EXISTS "Todos podem ver questões de quizzes acessíveis" ON public.quiz_questions;
CREATE POLICY "Todos podem ver questões de quizzes acessíveis"
  ON public.quiz_questions FOR SELECT
  TO authenticated
  USING (
    -- Alunos podem ver questões de quizzes publicados ou sem quiz_id (banco de questões)
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'student'
      )
      AND (
        quiz_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.quizzes q
          WHERE q.id = quiz_questions.quiz_id
          AND (q.status IS NULL OR q.status = 'published')
        )
      )
    )
    OR
    -- Admins e professores veem todas
    (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('administrator', 'teacher')
      )
    )
  );

-- Apenas admins e professores podem criar questões
DROP POLICY IF EXISTS "Admins e professores podem criar questões" ON public.quiz_questions;
CREATE POLICY "Admins e professores podem criar questões"
  ON public.quiz_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar questões
DROP POLICY IF EXISTS "Admins e professores podem atualizar questões" ON public.quiz_questions;
CREATE POLICY "Admins e professores podem atualizar questões"
  ON public.quiz_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar questões
DROP POLICY IF EXISTS "Apenas admins podem deletar questões" ON public.quiz_questions;
CREATE POLICY "Apenas admins podem deletar questões"
  ON public.quiz_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 3. TABELA: essay_prompts (Temas de Redação)
-- =====================================================
ALTER TABLE public.essay_prompts ENABLE ROW LEVEL SECURITY;

-- Todos podem ver temas de redação ativos
DROP POLICY IF EXISTS "Todos podem ver temas de redação ativos" ON public.essay_prompts;
CREATE POLICY "Todos podem ver temas de redação ativos"
  ON public.essay_prompts FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem criar temas
DROP POLICY IF EXISTS "Admins e professores podem criar temas" ON public.essay_prompts;
CREATE POLICY "Admins e professores podem criar temas"
  ON public.essay_prompts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar temas
DROP POLICY IF EXISTS "Admins e professores podem atualizar temas" ON public.essay_prompts;
CREATE POLICY "Admins e professores podem atualizar temas"
  ON public.essay_prompts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar temas
DROP POLICY IF EXISTS "Apenas admins podem deletar temas" ON public.essay_prompts;
CREATE POLICY "Apenas admins podem deletar temas"
  ON public.essay_prompts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 4. TABELA: video_courses (Cursos)
-- =====================================================
ALTER TABLE public.video_courses ENABLE ROW LEVEL SECURITY;

-- Todos podem ver cursos ativos
DROP POLICY IF EXISTS "Todos podem ver cursos ativos" ON public.video_courses;
CREATE POLICY "Todos podem ver cursos ativos"
  ON public.video_courses FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem criar cursos
DROP POLICY IF EXISTS "Admins e professores podem criar cursos" ON public.video_courses;
CREATE POLICY "Admins e professores podem criar cursos"
  ON public.video_courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar cursos
DROP POLICY IF EXISTS "Admins e professores podem atualizar cursos" ON public.video_courses;
CREATE POLICY "Admins e professores podem atualizar cursos"
  ON public.video_courses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar cursos
DROP POLICY IF EXISTS "Apenas admins podem deletar cursos" ON public.video_courses;
CREATE POLICY "Apenas admins podem deletar cursos"
  ON public.video_courses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 5. TABELA: video_modules (Módulos de Curso)
-- =====================================================
ALTER TABLE public.video_modules ENABLE ROW LEVEL SECURITY;

-- Todos podem ver módulos de cursos ativos
DROP POLICY IF EXISTS "Todos podem ver módulos de cursos ativos" ON public.video_modules;
CREATE POLICY "Todos podem ver módulos de cursos ativos"
  ON public.video_modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.video_courses vc
      WHERE vc.id = video_modules.course_id
      AND vc.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem gerenciar módulos
DROP POLICY IF EXISTS "Admins e professores podem gerenciar módulos" ON public.video_modules;
CREATE POLICY "Admins e professores podem gerenciar módulos"
  ON public.video_modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- =====================================================
-- 6. TABELA: video_lessons (Aulas)
-- =====================================================
ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;

-- Todos podem ver aulas de cursos ativos
DROP POLICY IF EXISTS "Todos podem ver aulas de cursos ativos" ON public.video_lessons;
CREATE POLICY "Todos podem ver aulas de cursos ativos"
  ON public.video_lessons FOR SELECT
  TO authenticated
  USING (
    -- Aulas preview ou de cursos ativos
    is_preview = true
    OR
    EXISTS (
      SELECT 1 FROM public.video_modules vm
      INNER JOIN public.video_courses vc ON vc.id = vm.course_id
      WHERE vm.id = video_lessons.module_id
      AND vc.is_active = true
    )
    OR
    -- Admins e professores veem todas
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem gerenciar aulas
DROP POLICY IF EXISTS "Admins e professores podem gerenciar aulas" ON public.video_lessons;
CREATE POLICY "Admins e professores podem gerenciar aulas"
  ON public.video_lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- =====================================================
-- 7. TABELA: subjects (Matérias)
-- =====================================================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Todos podem ver matérias
DROP POLICY IF EXISTS "Todos podem ver matérias" ON public.subjects;
CREATE POLICY "Todos podem ver matérias"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins e professores podem criar matérias
DROP POLICY IF EXISTS "Admins e professores podem criar matérias" ON public.subjects;
CREATE POLICY "Admins e professores podem criar matérias"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar matérias
DROP POLICY IF EXISTS "Admins e professores podem atualizar matérias" ON public.subjects;
CREATE POLICY "Admins e professores podem atualizar matérias"
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar matérias
DROP POLICY IF EXISTS "Apenas admins podem deletar matérias" ON public.subjects;
CREATE POLICY "Apenas admins podem deletar matérias"
  ON public.subjects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 8. TABELA: topics (Tópicos)
-- =====================================================
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Todos podem ver tópicos
DROP POLICY IF EXISTS "Todos podem ver tópicos" ON public.topics;
CREATE POLICY "Todos podem ver tópicos"
  ON public.topics FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins e professores podem criar tópicos
DROP POLICY IF EXISTS "Admins e professores podem criar tópicos" ON public.topics;
CREATE POLICY "Admins e professores podem criar tópicos"
  ON public.topics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins e professores podem atualizar tópicos
DROP POLICY IF EXISTS "Admins e professores podem atualizar tópicos" ON public.topics;
CREATE POLICY "Admins e professores podem atualizar tópicos"
  ON public.topics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

-- Apenas admins podem deletar tópicos
DROP POLICY IF EXISTS "Apenas admins podem deletar tópicos" ON public.topics;
CREATE POLICY "Apenas admins podem deletar tópicos"
  ON public.topics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- =====================================================
-- 9. GRANTS E PERMISSÕES
-- =====================================================
-- Garantir que usuários autenticados possam acessar as tabelas
GRANT SELECT ON public.quizzes TO authenticated;
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT SELECT ON public.essay_prompts TO authenticated;
GRANT SELECT ON public.video_courses TO authenticated;
GRANT SELECT ON public.video_modules TO authenticated;
GRANT SELECT ON public.video_lessons TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.topics TO authenticated;

-- Comentários
COMMENT ON POLICY "Todos podem ver quizzes publicados" ON public.quizzes IS
  'Alunos veem apenas quizzes publicados, admins e professores veem todos';

COMMENT ON POLICY "Todos podem ver questões de quizzes acessíveis" ON public.quiz_questions IS
  'Alunos veem questões de quizzes publicados e banco de questões, admins e professores veem todas';

COMMENT ON POLICY "Todos podem ver temas de redação ativos" ON public.essay_prompts IS
  'Alunos veem apenas temas ativos, admins e professores veem todos';
