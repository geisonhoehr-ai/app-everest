-- Add a column to user_settings to store personalized dashboard layouts.
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB;

COMMENT ON COLUMN public.user_settings.dashboard_layout IS 'Stores the user''s custom dashboard widget layout and visibility preferences.';
