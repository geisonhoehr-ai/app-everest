-- Drop the existing table if it exists (to recreate it correctly)
DROP TABLE IF EXISTS public.class_courses CASCADE;

-- Recreate class_courses table with all required columns
CREATE TABLE public.class_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.video_courses(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Ensure a course can only be assigned once to a class
    UNIQUE(class_id, course_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_class_courses_class_id ON public.class_courses(class_id);
CREATE INDEX idx_class_courses_course_id ON public.class_courses(course_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_class_courses_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_class_courses_update
BEFORE UPDATE ON public.class_courses
FOR EACH ROW
EXECUTE FUNCTION public.handle_class_courses_update();

-- Enable RLS
ALTER TABLE public.class_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Administrators and teachers can view class courses"
    ON public.class_courses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.student_classes
            WHERE student_classes.class_id = class_courses.class_id
            AND student_classes.user_id = auth.uid()
        )
    );

CREATE POLICY "Administrators and teachers can insert class courses"
    ON public.class_courses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

CREATE POLICY "Administrators and teachers can update class courses"
    ON public.class_courses
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

CREATE POLICY "Administrators and teachers can delete class courses"
    ON public.class_courses
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

COMMENT ON TABLE public.class_courses IS 'Manages which courses are available to which classes/turmas';
