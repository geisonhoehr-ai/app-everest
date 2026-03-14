-- Consolidate 12 count queries into 1 RPC call for admin dashboard
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM users),
    'total_students', (SELECT count(*) FROM users WHERE role = 'student'),
    'total_teachers', (SELECT count(*) FROM users WHERE role = 'teacher'),
    'total_administrators', (SELECT count(*) FROM users WHERE role = 'administrator'),
    'total_classes', (SELECT count(*) FROM classes),
    'total_courses', (SELECT count(*) FROM video_courses),
    'total_flashcards', (SELECT count(*) FROM flashcards),
    'total_quizzes', (SELECT count(*) FROM quizzes),
    'total_essays', (SELECT count(*) FROM essays),
    'total_audio_courses', (SELECT count(*) FROM audio_courses),
    'active_users', (SELECT count(DISTINCT user_id) FROM user_sessions WHERE created_at > now() - interval '30 days'),
    'completion_rate', (
      CASE
        WHEN (SELECT count(*) FROM video_progress) = 0 THEN 0
        ELSE round(((SELECT count(*) FROM video_progress WHERE is_completed = true)::numeric / (SELECT count(*) FROM video_progress)::numeric) * 100)
      END
    )
  ) INTO result;

  RETURN result;
END;
$$;
