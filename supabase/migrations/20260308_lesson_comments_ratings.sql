-- ============================================================
-- Lesson Comments & Ratings tables
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hnhzindsfuqnaxosujay/sql/new
-- ============================================================

-- 1. Lesson Comments
CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  parent_id uuid REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_lesson_comments_lesson_id ON public.lesson_comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_comments_user_id ON public.lesson_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_comments_parent_id ON public.lesson_comments(parent_id);

-- 2. Lesson Ratings (1-5 stars)
CREATE TABLE IF NOT EXISTS public.lesson_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(lesson_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_ratings_lesson_id ON public.lesson_ratings(lesson_id);

-- 3. RLS Policies
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

-- Comments: anyone authenticated can read, users can insert/update/delete their own
CREATE POLICY "lesson_comments_select" ON public.lesson_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "lesson_comments_insert" ON public.lesson_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lesson_comments_update" ON public.lesson_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "lesson_comments_delete" ON public.lesson_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Ratings: anyone authenticated can read, users can insert/update their own
CREATE POLICY "lesson_ratings_select" ON public.lesson_ratings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "lesson_ratings_insert" ON public.lesson_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lesson_ratings_update" ON public.lesson_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 4. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lesson_comments_updated_at
  BEFORE UPDATE ON public.lesson_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_ratings_updated_at
  BEFORE UPDATE ON public.lesson_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
