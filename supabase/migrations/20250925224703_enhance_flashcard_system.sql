-- Add an 'explanation' column to the flashcards table for immediate feedback.
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Enhance the flashcard_progress table to track more detailed metrics.
ALTER TABLE public.flashcard_progress
ADD COLUMN IF NOT EXISTS response_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS confidence_rating INTEGER; -- e.g., A scale from 1 (unsure) to 3 (confident).

-- Create a table to define all available achievements in the system.
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    xp_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create a join table to track which achievements each user has unlocked.
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (user_id, achievement_id)
);

-- Create a table to store user-specific settings for personalization.
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    flashcard_theme TEXT DEFAULT 'default',
    background_sound TEXT,
    timer_alerts BOOLEAN DEFAULT TRUE,
    use_pomodoro BOOLEAN DEFAULT FALSE,
    pomodoro_duration_minutes INTEGER DEFAULT 25,
    pomodoro_break_minutes INTEGER DEFAULT 5,
    daily_study_goal_minutes INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create a join table for users to mark their favorite flashcards.
CREATE TABLE IF NOT EXISTS public.user_favorite_flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (user_id, flashcard_id)
);

-- Create a table to log the history of each study session.
CREATE TABLE IF NOT EXISTS public.flashcard_session_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    session_mode TEXT NOT NULL, -- e.g., 'lightning', 'full', 'error_review'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    cards_reviewed INTEGER,
    correct_answers INTEGER,
    incorrect_answers INTEGER
);

-- Create a trigger to automatically update the 'updated_at' timestamp on user_settings changes.
CREATE OR REPLACE FUNCTION public.handle_user_settings_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_settings_update
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_settings_update();
