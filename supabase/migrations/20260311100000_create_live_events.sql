-- ============================================================
-- Ensure handle_updated_at function exists
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Live Events table
-- ============================================================

CREATE TABLE public.live_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  provider text NOT NULL CHECK (provider IN ('panda', 'youtube', 'meet')),
  stream_url text NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.video_courses(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.users(id) NOT NULL,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  recording_url text,
  recording_published boolean DEFAULT false,
  reminder_sent boolean DEFAULT false,
  calendar_event_id uuid REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_live_events_status ON public.live_events(status);
CREATE INDEX idx_live_events_class_id ON public.live_events(class_id);
CREATE INDEX idx_live_events_scheduled_start ON public.live_events(scheduled_start);

-- Updated_at trigger
CREATE TRIGGER set_live_events_updated_at
  BEFORE UPDATE ON public.live_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

-- Students: see lives from their classes + global lives
CREATE POLICY "Students can view their class lives"
  ON public.live_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')
    )
    OR class_id IS NULL
    OR class_id IN (
      SELECT class_id FROM public.student_classes WHERE user_id = auth.uid()
    )
  );

-- Admin/Teacher: full write access
CREATE POLICY "Staff can manage live events"
  ON public.live_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')
    )
  );

-- ============================================================
-- Add module_type to video_modules
-- ============================================================

ALTER TABLE public.video_modules
  ADD COLUMN IF NOT EXISTS module_type text DEFAULT 'video';

-- ============================================================
-- Grant permissions
-- ============================================================

GRANT SELECT ON public.live_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.live_events TO authenticated;

-- ============================================================
-- Enable realtime for live_events
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_events;
