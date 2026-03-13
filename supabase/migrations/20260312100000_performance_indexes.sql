-- ============================================================================
-- Performance indexes for 700+ concurrent students
-- ============================================================================

-- video_progress: used in analytics (full table scans without these)
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id
  ON video_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_video_progress_lesson_id
  ON video_progress (lesson_id);

CREATE INDEX IF NOT EXISTS idx_video_progress_is_completed
  ON video_progress (is_completed)
  WHERE is_completed = true;

CREATE INDEX IF NOT EXISTS idx_video_progress_updated_at
  ON video_progress (updated_at);

-- notifications: polling query (user_id + is_read + created_at)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

-- quiz_attempts: lookup by user and quiz
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id
  ON quiz_attempts (user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id
  ON quiz_attempts (quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz
  ON quiz_attempts (user_id, quiz_id);

-- essay_annotations: lookup by essay
CREATE INDEX IF NOT EXISTS idx_essay_annotations_essay_id
  ON essay_annotations (essay_id);

-- essays: student listing
CREATE INDEX IF NOT EXISTS idx_essays_student_id
  ON essays (student_id);

CREATE INDEX IF NOT EXISTS idx_essays_teacher_status
  ON essays (teacher_id, status);

-- student_classes: enrollment lookups
CREATE INDEX IF NOT EXISTS idx_student_classes_user_id
  ON student_classes (user_id);

CREATE INDEX IF NOT EXISTS idx_student_classes_class_id
  ON student_classes (class_id);

-- calendar_events: upcoming events query
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time
  ON calendar_events (start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_events_class_id
  ON calendar_events (class_id);

-- community_posts: feed ordering
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at
  ON community_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_space_id
  ON community_posts (space_id);

-- flashcards: user progress
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_id
  ON flashcard_progress (user_id);

-- simulation_attempts (table does not exist yet, skip)
