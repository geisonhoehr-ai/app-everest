-- Add subscription end date to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Create class_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_type') THEN
        CREATE TYPE public.class_type AS ENUM ('standard', 'trial');
    END IF;
END$$;

-- Add new columns to classes table for trial functionality
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS class_type public.class_type NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS trial_flashcard_limit_per_day INTEGER,
ADD COLUMN IF NOT EXISTS trial_quiz_limit_per_day INTEGER,
ADD COLUMN IF NOT EXISTS trial_essay_submission_limit INTEGER,
ADD COLUMN IF NOT EXISTS trial_duration_days INTEGER;

-- Create class_feature_permissions table
CREATE TABLE IF NOT EXISTS public.class_feature_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL, -- e.g., 'student_profile_all', 'evercast_module', 'essay_module'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (class_id, feature_key)
);

-- Create a trigger to automatically update the 'updated_at' timestamp on class_feature_permissions changes.
CREATE OR REPLACE FUNCTION public.handle_class_feature_permissions_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_class_feature_permissions_update
BEFORE UPDATE ON public.class_feature_permissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_class_feature_permissions_update();
