-- Fix remaining RLS always-true policies (2026-03-11)
-- Tables: classes, essays, quiz_question_stats, student_classes, teachers,
--         trial_allowed_content, user_achievements, video_courses

-- =====================================================
-- classes: UPDATE admin-only
-- =====================================================
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.classes;
CREATE POLICY "classes_admin_update" ON public.classes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

-- =====================================================
-- essays: aluno INSERT/UPDATE próprias, admin/teacher tudo, DELETE admin
-- =====================================================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.essays;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.essays;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.essays;

CREATE POLICY "essays_insert_own" ON public.essays FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

CREATE POLICY "essays_update_own_or_staff" ON public.essays FOR UPDATE TO authenticated
  USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

CREATE POLICY "essays_delete_admin" ON public.essays FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

-- =====================================================
-- quiz_question_stats: admin/teacher write (aggregated stats, no user_id column)
-- =====================================================
DROP POLICY IF EXISTS "quiz_question_stats_insert" ON public.quiz_question_stats;
DROP POLICY IF EXISTS "quiz_question_stats_update" ON public.quiz_question_stats;

CREATE POLICY "qqs_staff_insert" ON public.quiz_question_stats FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

CREATE POLICY "qqs_staff_update" ON public.quiz_question_stats FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- =====================================================
-- student_classes: admin-only write
-- =====================================================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.student_classes;

CREATE POLICY "sc_admin_insert" ON public.student_classes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

CREATE POLICY "sc_admin_update" ON public.student_classes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

CREATE POLICY "sc_admin_delete" ON public.student_classes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

-- =====================================================
-- teachers: admin-only write
-- =====================================================
DROP POLICY IF EXISTS "teachers_delete_any" ON public.teachers;
DROP POLICY IF EXISTS "teachers_insert_any" ON public.teachers;
DROP POLICY IF EXISTS "teachers_update_any" ON public.teachers;

CREATE POLICY "teachers_admin_insert" ON public.teachers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

CREATE POLICY "teachers_admin_update" ON public.teachers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

CREATE POLICY "teachers_admin_delete" ON public.teachers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

-- =====================================================
-- trial_allowed_content: admin-only write
-- =====================================================
DROP POLICY IF EXISTS "trial_allowed_content_delete_any" ON public.trial_allowed_content;
DROP POLICY IF EXISTS "trial_allowed_content_insert_any" ON public.trial_allowed_content;
DROP POLICY IF EXISTS "trial_allowed_content_update_any" ON public.trial_allowed_content;

CREATE POLICY "tac_admin_insert" ON public.trial_allowed_content FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

CREATE POLICY "tac_admin_update" ON public.trial_allowed_content FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

CREATE POLICY "tac_admin_delete" ON public.trial_allowed_content FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

-- =====================================================
-- user_achievements: own INSERT/UPDATE, admin DELETE
-- =====================================================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.user_achievements;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_achievements;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.user_achievements;

CREATE POLICY "ua_insert_own" ON public.user_achievements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ua_update_own" ON public.user_achievements FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ua_delete_admin" ON public.user_achievements FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

-- =====================================================
-- video_courses: admin/teacher write, admin delete
-- =====================================================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.video_courses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.video_courses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.video_courses;

CREATE POLICY "vc_staff_insert" ON public.video_courses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

CREATE POLICY "vc_staff_update" ON public.video_courses FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

CREATE POLICY "vc_admin_delete" ON public.video_courses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));
