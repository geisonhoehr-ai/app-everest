-- Fix all Supabase linter errors and warnings (2026-03-11)
-- ERRORS: security_definer_view
-- WARNINGS: function_search_path_mutable, rls_policy_always_true

-- =====================================================
-- FIX 1: Drop SECURITY DEFINER views
-- =====================================================
DROP VIEW IF EXISTS public.quiz_questions_legacy;
DROP VIEW IF EXISTS public.class_stats;

-- =====================================================
-- FIX 2: Set search_path on ALL public functions
-- =====================================================
ALTER FUNCTION public.handle_user_settings_update() SET search_path = public;
ALTER FUNCTION public.auto_enroll_in_default_class() SET search_path = public;
ALTER FUNCTION public.get_auth_user_role() SET search_path = public;
ALTER FUNCTION public.update_users_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_class_feature_permissions_update() SET search_path = public;
ALTER FUNCTION public.handle_video_courses_update() SET search_path = public;
ALTER FUNCTION public.handle_video_modules_update() SET search_path = public;
ALTER FUNCTION public.handle_video_lessons_update() SET search_path = public;
ALTER FUNCTION public.handle_video_progress_update() SET search_path = public;
ALTER FUNCTION public.get_question_performance_for_quiz(uuid) SET search_path = public;
ALTER FUNCTION public.handle_evaluation_criteria_templates_update() SET search_path = public;
ALTER FUNCTION public.handle_calendar_events_update() SET search_path = public;
ALTER FUNCTION public.calculate_subscription_expiration(uuid, timestamptz) SET search_path = public;
ALTER FUNCTION public.set_subscription_expiration() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.increment_topic_pomodoros(uuid) SET search_path = public;
ALTER FUNCTION public.get_study_stats(uuid) SET search_path = public;
ALTER FUNCTION public.downgrade_expired_subscriptions() SET search_path = public;
ALTER FUNCTION public.is_teacher() SET search_path = public;
ALTER FUNCTION public.is_admin_or_teacher() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_subjects_with_quiz_counts() SET search_path = public;
ALTER FUNCTION public.is_authenticated() SET search_path = public;
ALTER FUNCTION public.get_user_ranking(integer) SET search_path = public;
ALTER FUNCTION public.get_user_rank_position(uuid) SET search_path = public;
ALTER FUNCTION public.get_ranking_by_activity_type(text, integer) SET search_path = public;
ALTER FUNCTION public.get_ranking_by_activity_type(varchar, integer) SET search_path = public;
ALTER FUNCTION public.get_user_score_history(uuid, integer) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.check_auth_status() SET search_path = public;
ALTER FUNCTION public.get_xp_statistics() SET search_path = public;
ALTER FUNCTION public.update_user_total_xp() SET search_path = public;
ALTER FUNCTION public.add_user_score(uuid, integer, varchar, uuid) SET search_path = public;
ALTER FUNCTION public.handle_class_courses_update() SET search_path = public;
ALTER FUNCTION public.update_calendar_events_updated_at() SET search_path = public;
ALTER FUNCTION public.create_user_profile() SET search_path = public;
ALTER FUNCTION public.update_teachers_updated_at() SET search_path = public;
ALTER FUNCTION public.create_teacher_on_user_insert() SET search_path = public;
ALTER FUNCTION public.update_trial_allowed_content_updated_at() SET search_path = public;
ALTER FUNCTION public.is_trial_user(uuid) SET search_path = public;
ALTER FUNCTION public.get_trial_allowed_content_for_user(uuid) SET search_path = public;

-- =====================================================
-- FIX 3: Restrict class_feature_permissions to admin-only write
-- =====================================================
DROP POLICY IF EXISTS "class_feature_permissions_all_access" ON public.class_feature_permissions;
DROP POLICY IF EXISTS "class_feature_permissions_delete_any" ON public.class_feature_permissions;
DROP POLICY IF EXISTS "class_feature_permissions_insert_any" ON public.class_feature_permissions;
DROP POLICY IF EXISTS "class_feature_permissions_update_any" ON public.class_feature_permissions;

CREATE POLICY "cfp_select" ON public.class_feature_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "cfp_admin_insert" ON public.class_feature_permissions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));
CREATE POLICY "cfp_admin_update" ON public.class_feature_permissions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator')) WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));
CREATE POLICY "cfp_admin_delete" ON public.class_feature_permissions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));

-- =====================================================
-- FIX 4: Restrict classes delete/insert to admin-only
-- =====================================================
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.classes;

CREATE POLICY "classes_admin_insert" ON public.classes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));
CREATE POLICY "classes_admin_delete" ON public.classes FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrator'));
