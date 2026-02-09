-- Enhance quiz_questions table to support rich text and multiple question formats
-- This migration adds support for:
-- 1. Rich text formatting (bold, italic, underline, lists, etc.)
-- 2. Multiple question types (multiple choice, true/false, multiple response, matching, etc.)
-- 3. Images in questions and options
-- 4. Difficulty levels

-- Add question_format column to support different types of questions
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS question_format TEXT NOT NULL DEFAULT 'multiple_choice';

-- Add comment to explain the possible values
COMMENT ON COLUMN public.quiz_questions.question_format IS 'Question format: multiple_choice, true_false, multiple_response, fill_blank, matching, ordering, essay';

-- Add rich text content columns (stored as HTML or JSON)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS question_html TEXT,
ADD COLUMN IF NOT EXISTS explanation_html TEXT;

-- Add image support for questions
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS question_image_url TEXT,
ADD COLUMN IF NOT EXISTS question_image_caption TEXT;

-- Add difficulty level
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';

COMMENT ON COLUMN public.quiz_questions.difficulty IS 'Difficulty level: easy, medium, hard, expert';

-- Add support for options with rich text and images
-- Store options as JSONB to support flexible structures
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS options_rich JSONB;

COMMENT ON COLUMN public.quiz_questions.options_rich IS 'Rich options stored as JSON array with structure: [{ "id": "a", "text": "...", "html": "...", "imageUrl": "...", "isCorrect": true }]';

-- Add support for multiple correct answers (for multiple_response type)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS correct_answers JSONB;

COMMENT ON COLUMN public.quiz_questions.correct_answers IS 'Array of correct answer IDs for multiple response questions: ["a", "c"]';

-- Add tags for better categorization
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add time limit per question (in seconds)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER;

-- Add column for matching pairs (for matching type questions)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS matching_pairs JSONB;

COMMENT ON COLUMN public.quiz_questions.matching_pairs IS 'For matching questions: [{ "left": "Item 1", "right": "Match 1", "leftHtml": "...", "rightHtml": "..." }]';

-- Add column for ordering items (for ordering type questions)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS ordering_items JSONB;

COMMENT ON COLUMN public.quiz_questions.ordering_items IS 'For ordering questions: [{ "id": "1", "text": "...", "html": "...", "correctOrder": 1 }]';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_format ON public.quiz_questions(question_format);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON public.quiz_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_tags ON public.quiz_questions USING gin(tags);

-- Create a view for backward compatibility with old question format
CREATE OR REPLACE VIEW public.quiz_questions_legacy AS
SELECT
  id,
  quiz_id,
  COALESCE(question_html, question_text) as question,
  options,
  correct_answer,
  COALESCE(explanation_html, explanation) as explanation,
  points,
  created_at,
  updated_at
FROM public.quiz_questions
WHERE question_format = 'multiple_choice';
