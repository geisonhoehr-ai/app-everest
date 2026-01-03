-- Create an enum for event types for better data integrity
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calendar_event_type') THEN
        CREATE TYPE public.calendar_event_type AS ENUM ('SIMULATION', 'ESSAY_DEADLINE', 'LIVE_CLASS', 'GENERAL');
    END IF;
END$$;

-- Create the calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    event_type public.calendar_event_type NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE, -- To scope events to a specific class
    related_entity_id UUID, -- Can link to a specific simulation, essay_prompt, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add a trigger to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_calendar_events_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_calendar_events_update
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_calendar_events_update();

-- Add comments for clarity
COMMENT ON TABLE public.calendar_events IS 'Stores all calendar events for the platform.';
COMMENT ON COLUMN public.calendar_events.class_id IS 'If not null, the event is only for members of this class.';
COMMENT ON COLUMN public.calendar_events.related_entity_id IS 'Optional link to another table, like simulations or essay_prompts.';
