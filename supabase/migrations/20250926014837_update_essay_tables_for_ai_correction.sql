-- Create a custom type for essay status if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'essay_status_enum') THEN
        CREATE TYPE public.essay_status_enum AS ENUM ('draft', 'correcting', 'corrected');
    END IF;
END$$;

-- Alter the essays table to add AI-related fields and update status handling.
ALTER TABLE public.essays
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS ai_suggested_grade JSONB;

-- Safely alter the status column type to the new enum.
-- 1. Add a new temporary column with the enum type.
ALTER TABLE public.essays
ADD COLUMN IF NOT EXISTS status_enum public.essay_status_enum;

-- 2. A function to safely cast string to the new enum type.
CREATE OR REPLACE FUNCTION public.safe_cast_to_essay_status(val text)
RETURNS public.essay_status_enum AS $$
BEGIN
    RETURN val::public.essay_status_enum;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN 'draft'::public.essay_status_enum; -- Default to 'draft' if cast fails
END;
$$ LANGUAGE plpgsql;

-- 3. Update the new column based on the old one.
UPDATE public.essays
SET status_enum = public.safe_cast_to_essay_status(status)
WHERE status IS NOT NULL;

-- 4. Drop the old string-based column.
ALTER TABLE public.essays
DROP COLUMN IF EXISTS status;

-- 5. Rename the new column to the original name.
ALTER TABLE public.essays
RENAME COLUMN status_enum TO status;

-- Set a default value for the new status column
ALTER TABLE public.essays
ALTER COLUMN status SET DEFAULT 'draft'::public.essay_status_enum;

-- Drop the helper function as it's no longer needed.
DROP FUNCTION public.safe_cast_to_essay_status(text);


-- Alter the essay_annotations table to add suggested_correction.
ALTER TABLE public.essay_annotations
ADD COLUMN IF NOT EXISTS suggested_correction TEXT;

-- Ensure teacher_id exists and is linked correctly.
-- The existing table already has a nullable teacher_id, which is what we need.
-- This statement ensures it exists if it was somehow missed.
ALTER TABLE public.essay_annotations
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
