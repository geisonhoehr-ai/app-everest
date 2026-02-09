-- Create lesson_attachments table to store supplementary files for video lessons.
CREATE TABLE IF NOT EXISTS public.lesson_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add a column to video_lessons to link to a primary accompanying PDF for side-by-side viewing.
ALTER TABLE public.video_lessons
ADD COLUMN IF NOT EXISTS accompanying_pdf_attachment_id UUID REFERENCES public.lesson_attachments(id) ON DELETE SET NULL;

-- Create video_progress table to track student progress on each video lesson.
CREATE TABLE IF NOT EXISTS public.video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    current_time_seconds INTEGER NOT NULL DEFAULT 0,
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (user_id, lesson_id)
);

-- Create a trigger to automatically update the 'updated_at' timestamp on video_progress changes.
CREATE OR REPLACE FUNCTION public.handle_video_progress_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_video_progress_update
BEFORE UPDATE ON public.video_progress
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_progress_update();
