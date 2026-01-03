-- Story 1: External Content Integration
-- Add a column to store an external resource URL for a flashcard.
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS external_resource_url TEXT;

-- Story 2: Collaborative Flashcard Set Creation
-- Create a table to store user-created, shareable sets of flashcards.
CREATE TABLE IF NOT EXISTS public.flashcard_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add a foreign key to the flashcards table to link them to a set.
-- This allows a flashcard to belong to a user-created set instead of a predefined topic.
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS flashcard_set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE;

-- Create a custom type for collaborator permission levels.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collaborator_permission') THEN
        CREATE TYPE public.collaborator_permission AS ENUM ('viewer', 'editor');
    END IF;
END$$;

-- Create a join table to manage collaborators and their permissions on a flashcard set.
CREATE TABLE IF NOT EXISTS public.flashcard_set_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID NOT NULL REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level public.collaborator_permission NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (set_id, user_id)
);

-- Story 3: Real-time Group Study Mode
-- Create a custom type for the status of a group study session.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE public.session_status AS ENUM ('pending', 'active', 'completed');
    END IF;
END$$;

-- Create a table to manage real-time group study sessions.
CREATE TABLE IF NOT EXISTS public.group_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    flashcard_set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE, -- For existing, non-collaborative topics
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status public.session_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_set_or_topic CHECK (flashcard_set_id IS NOT NULL OR topic_id IS NOT NULL)
);

-- Create a join table to track participants in a group study session.
CREATE TABLE IF NOT EXISTS public.group_session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.group_study_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    score_in_session INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (session_id, user_id)
);

-- Enhance the session history table to link to group study sessions.
ALTER TABLE public.flashcard_session_history
ADD COLUMN IF NOT EXISTS group_session_id UUID REFERENCES public.group_study_sessions(id) ON DELETE SET NULL;
