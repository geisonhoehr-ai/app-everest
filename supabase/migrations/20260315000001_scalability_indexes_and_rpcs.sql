-- ============================================================
-- Migration: Scalability improvements for 1000+ concurrent users
-- Date: 2026-03-15
--
-- 1. Composite indexes for hot query paths
-- 2. RPC functions to aggregate at DB level (avoid full table scans)
-- 3. Enable Realtime on notifications table
-- 4. Cleanup unused/duplicate indexes
-- ============================================================

-- ============================================================
-- PART 1: Critical composite indexes
-- ============================================================

-- Notifications: polling was doing seq scan on every query
-- Now used by Realtime filter, but index still helps direct queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

-- Scores: ranking query needs to aggregate by user efficiently
CREATE INDEX IF NOT EXISTS idx_scores_user_value
  ON public.scores (user_id, score_value);

-- Video progress: most queried table per student session
CREATE INDEX IF NOT EXISTS idx_video_progress_user_lesson_progress
  ON public.video_progress (user_id, lesson_id, progress_percentage);

-- Student classes: RLS subqueries hit this on every request
CREATE INDEX IF NOT EXISTS idx_student_classes_user_class_composite
  ON public.student_classes (user_id, class_id);

-- Class courses: course listing queries
CREATE INDEX IF NOT EXISTS idx_class_courses_class_course
  ON public.class_courses (class_id, course_id);

-- Video modules: nested course queries order by this
CREATE INDEX IF NOT EXISTS idx_video_modules_course_order
  ON public.video_modules (course_id, order_index);

-- Video lessons: nested module queries order by this
CREATE INDEX IF NOT EXISTS idx_video_lessons_module_order
  ON public.video_lessons (module_id, order_index);

-- Lesson attachments: queried per lesson
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson
  ON public.lesson_attachments (lesson_id);

-- Flashcards: study sessions query by topic + user
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_flashcard
  ON public.flashcard_progress (user_id, flashcard_id, next_review_at);

-- Community posts: forum listing with pagination
CREATE INDEX IF NOT EXISTS idx_community_posts_space_created
  ON public.community_posts (space_id, created_at DESC);

-- User achievements: leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_achieved
  ON public.user_achievements (user_id, achieved_at DESC);

-- Essays: teacher dashboard filtered view
CREATE INDEX IF NOT EXISTS idx_essays_status_created
  ON public.essays (status, created_at DESC);

-- ============================================================
-- PART 2: RPC functions for aggregated queries
-- ============================================================

-- Ranking: aggregate scores at DB level instead of loading all rows
CREATE OR REPLACE FUNCTION get_ranking(ranking_limit integer DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  total_xp bigint,
  achievements_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.user_id,
    u.email,
    u.first_name,
    u.last_name,
    COALESCE(SUM(s.score_value), 0)::bigint AS total_xp,
    COALESCE(ac.cnt, 0)::bigint AS achievements_count
  FROM scores s
  JOIN users u ON u.id = s.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS cnt
    FROM user_achievements
    GROUP BY user_id
  ) ac ON ac.user_id = s.user_id
  GROUP BY s.user_id, u.email, u.first_name, u.last_name, ac.cnt
  ORDER BY total_xp DESC
  LIMIT ranking_limit;
$$;

-- Gamification stats: single query for all stats
CREATE OR REPLACE FUNCTION get_gamification_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_achievements', (SELECT COUNT(*) FROM achievements),
    'total_unlocked', (SELECT COUNT(*) FROM user_achievements),
    'total_xp', (SELECT COALESCE(SUM(score_value), 0) FROM scores),
    'active_users', (SELECT COUNT(DISTINCT user_id) FROM scores)
  );
$$;

-- Total XP helper
CREATE OR REPLACE FUNCTION get_total_xp()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(score_value), 0)::bigint FROM scores;
$$;

-- Ranking by class: aggregate at DB level
CREATE OR REPLACE FUNCTION get_ranking_by_class(
  p_class_id uuid,
  ranking_limit integer DEFAULT 50
)
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  total_xp bigint,
  achievements_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.user_id,
    u.email,
    u.first_name,
    u.last_name,
    COALESCE(SUM(s.score_value), 0)::bigint AS total_xp,
    COALESCE(ac.cnt, 0)::bigint AS achievements_count
  FROM scores s
  JOIN users u ON u.id = s.user_id
  JOIN student_classes sc ON sc.user_id = s.user_id AND sc.class_id = p_class_id
  LEFT JOIN (
    SELECT ua.user_id, COUNT(*) AS cnt
    FROM user_achievements ua
    JOIN student_classes sc2 ON sc2.user_id = ua.user_id AND sc2.class_id = p_class_id
    GROUP BY ua.user_id
  ) ac ON ac.user_id = s.user_id
  GROUP BY s.user_id, u.email, u.first_name, u.last_name, ac.cnt
  ORDER BY total_xp DESC
  LIMIT ranking_limit;
$$;

-- ============================================================
-- PART 3: Enable Realtime on notifications table
-- ============================================================

-- Enable realtime for notifications (used by useNotifications hook)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- PART 4: Cleanup duplicate/unused indexes
-- (Only dropping indexes that have 0 scans AND have a better composite replacement)
-- ============================================================

-- student_classes: we have the new composite, these individual ones are redundant
DROP INDEX IF EXISTS public.student_classes_user_id_idx;
DROP INDEX IF EXISTS public.student_classes_class_id_idx;
DROP INDEX IF EXISTS public.student_classes_user_id_class_id_idx;

-- scores: new composite covers these
DROP INDEX IF EXISTS public.scores_activity_type_idx;

-- notifications: new composite covers this
DROP INDEX IF EXISTS public.idx_notifications_user_id_is_read;

-- video_progress: new composite covers this
DROP INDEX IF EXISTS public.idx_video_progress_is_completed;
DROP INDEX IF EXISTS public.idx_video_progress_lesson_id;

-- quiz_questions: unused specialized indexes
DROP INDEX IF EXISTS public.idx_quiz_questions_tags;
DROP INDEX IF EXISTS public.idx_quiz_questions_difficulty;
DROP INDEX IF EXISTS public.idx_quiz_questions_format;

-- flashcards: topic_id_question_idx is 120KB and never used (0 scans)
DROP INDEX IF EXISTS public.flashcards_topic_id_question_idx;

-- quiz_questions: duplicate text index never used
DROP INDEX IF EXISTS public.quiz_questions_quiz_id_question_text_idx;

-- Various unused indexes with 0 scans
DROP INDEX IF EXISTS public.idx_classes_status;
DROP INDEX IF EXISTS public.idx_calendar_events_class_id;
DROP INDEX IF EXISTS public.idx_calendar_events_event_type;
DROP INDEX IF EXISTS public.idx_users_is_unlimited;
DROP INDEX IF EXISTS public.idx_users_is_active;
DROP INDEX IF EXISTS public.idx_users_is_banned;
DROP INDEX IF EXISTS public.idx_user_sessions_last_active;
DROP INDEX IF EXISTS public.idx_community_posts_type;
DROP INDEX IF EXISTS public.idx_community_posts_user_id;
DROP INDEX IF EXISTS public.idx_lesson_ratings_lesson_id;
DROP INDEX IF EXISTS public.idx_lesson_comments_lesson_id;
DROP INDEX IF EXISTS public.idx_lesson_comments_parent_id;
DROP INDEX IF EXISTS public.scores_user_id_idx;
DROP INDEX IF EXISTS public.scores_recorded_at_idx;
-- quiz_reading_texts_pkey: NOT dropping - it's a primary key constraint

-- ============================================================
-- PART 5: Analyze tables to update query planner statistics
-- ============================================================

ANALYZE public.users;
ANALYZE public.scores;
ANALYZE public.notifications;
ANALYZE public.video_progress;
ANALYZE public.student_classes;
ANALYZE public.video_lessons;
ANALYZE public.video_modules;
ANALYZE public.class_courses;
ANALYZE public.user_achievements;
ANALYZE public.flashcard_progress;
ANALYZE public.community_posts;
ANALYZE public.essays;
ANALYZE public.lesson_attachments;
