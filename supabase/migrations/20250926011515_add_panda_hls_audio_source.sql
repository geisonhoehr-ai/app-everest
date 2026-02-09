-- Create a custom enum type for audio source providers if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audio_source_provider') THEN
        CREATE TYPE public.audio_source_provider AS ENUM ('panda_video_hls', 'mp3_url');
    END IF;
END$$;

-- Alter the audio_lessons table to use the new enum type.
-- This approach is safer for tables with existing data.
-- 1. Add a new temporary column with the enum type.
ALTER TABLE public.audio_lessons
ADD COLUMN IF NOT EXISTS audio_source_type_enum public.audio_source_provider;

-- 2. A function to safely cast string to the new enum type.
CREATE OR REPLACE FUNCTION public.safe_cast_to_audio_source_provider(val text)
RETURNS public.audio_source_provider AS $$
BEGIN
    RETURN val::public.audio_source_provider;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN NULL; -- or a default value like 'mp3_url'::public.audio_source_provider
END;
$$ LANGUAGE plpgsql;

-- 3. Update the new column based on the old one.
UPDATE public.audio_lessons
SET audio_source_type_enum = public.safe_cast_to_audio_source_provider(audio_source_type)
WHERE audio_source_type IS NOT NULL;

-- 4. Drop the old string-based column.
ALTER TABLE public.audio_lessons
DROP COLUMN IF EXISTS audio_source_type;

-- 5. Rename the new column to the original name.
ALTER TABLE public.audio_lessons
RENAME COLUMN audio_source_type_enum TO audio_source_type;

-- Drop the helper function as it's no longer needed.
DROP FUNCTION public.safe_cast_to_audio_source_provider(text);
