-- Add a 'type' column to quiz_questions to support different question formats like open-ended.
-- The existing 'question_type' column already serves this purpose, so we ensure it exists.
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'multiple_choice';

-- Ensure the 'points' column exists, as specified in the import format.
-- The existing table already has this column, so this is a safeguard.
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 1;

-- Add a foreign key from quiz_questions to users to track who created the question.
-- This is useful for auditing and management.
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

