ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

COMMENT ON COLUMN public.subjects.image_url IS 'URL for the subject''s cover image.';
COMMENT ON COLUMN public.subjects.category IS 'Category for grouping subjects, e.g., Exatas, Humanas.';
