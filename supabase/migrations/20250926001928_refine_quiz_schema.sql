-- Refine the quiz_questions table by removing the redundant topic_id.
-- A question belongs to a quiz, and the quiz is already associated with a topic.
-- This avoids data inconsistency and normalizes the schema.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'quiz_questions'
        AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE public.quiz_questions DROP COLUMN topic_id;
    END IF;
END$$;

-- Ensure the quizzes table has the necessary columns for description and duration.
-- This is a safe operation that only adds columns if they do not already exist.
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
