-- Create a custom type for video source providers.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_source_provider') THEN
        CREATE TYPE public.video_source_provider AS ENUM ('panda_video', 'youtube', 'vimeo');
    END IF;
END$$;

-- Create the main table for video courses.
CREATE TABLE IF NOT EXISTS public.video_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the table for course modules.
CREATE TABLE IF NOT EXISTS public.video_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.video_courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the table for individual video lessons.
CREATE TABLE IF NOT EXISTS public.video_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.video_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    video_source_type public.video_source_provider,
    video_source_id TEXT, -- Stores the unique ID from the provider (e.g., Panda Video ID).
    duration_seconds INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    is_preview BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create triggers to automatically update the 'updated_at' timestamps.
CREATE OR REPLACE FUNCTION public.handle_video_courses_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_video_courses_update
BEFORE UPDATE ON public.video_courses
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_courses_update();

CREATE OR REPLACE FUNCTION public.handle_video_modules_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_video_modules_update
BEFORE UPDATE ON public.video_modules
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_modules_update();

CREATE OR REPLACE FUNCTION public.handle_video_lessons_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_video_lessons_update
BEFORE UPDATE ON public.video_lessons
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_lessons_update();
