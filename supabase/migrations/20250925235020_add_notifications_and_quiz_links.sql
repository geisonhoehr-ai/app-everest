-- Create a table for user notifications.
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'new_lesson', 'new_material', 'quiz_available'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_id UUID,
    related_entity_type TEXT, -- e.g., 'lesson', 'attachment', 'quiz'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add a foreign key to video_lessons to associate a quiz.
ALTER TABLE public.video_lessons
ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

-- Add a foreign key to video_modules to associate a quiz.
ALTER TABLE public.video_modules
ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

-- Add a comment to clarify the purpose of the new columns.
COMMENT ON COLUMN public.video_lessons.quiz_id IS 'Optional quiz to be taken after this lesson.';
COMMENT ON COLUMN public.video_modules.quiz_id IS 'Optional quiz to be taken after this module.';
