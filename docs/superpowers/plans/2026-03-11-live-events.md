# Live Events (Aulas ao Vivo) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live event support (Panda Video, YouTube, Google Meet) with class-based access control, calendar integration, 3-stage notifications, and post-live recording publishing to course modules.

**Architecture:** New `live_events` table with RLS. Service layer (`liveEventService.ts`) handles CRUD + lifecycle. Student pages for listing/watching, admin page for management. LiveBanner on Dashboard for active lives. Recording publishing creates `video_lesson` in course's "Lives" module. Server-side bulk notifications via `notificationService.createBulkNotifications`.

**Tech Stack:** React 19, TypeScript, Supabase (RLS, pg_cron, Realtime), Shadcn UI, Lucide icons, React Router v6

**Spec:** `docs/superpowers/specs/2026-03-11-live-events-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/20260311100000_create_live_events.sql` | Migration: table, RLS, indexes, module_type column, pg_cron |
| `src/services/liveEventService.ts` | CRUD, lifecycle (start/end/cancel), recording publishing, queries |
| `src/pages/LiveEvents.tsx` | Student: list upcoming + active lives |
| `src/pages/LivePlayer.tsx` | Student: watch live (embed or Meet link) |
| `src/pages/admin/lives/AdminLiveEventsPage.tsx` | Admin: CRUD + lifecycle management |
| `src/components/LiveBanner.tsx` | Dashboard banner for active lives |
| `src/components/LivePlayerEmbed.tsx` | Provider-aware player (Panda iframe / YouTube iframe / Meet button) |

### Modified Files
| File | Change |
|------|--------|
| `src/services/classPermissionsService.ts` | Add `LIVE_EVENTS` to `FEATURE_KEYS` |
| `src/services/calendarService.ts` | Add `related_entity_id` to `createEvent` signature |
| `src/App.tsx` | Add routes: `/lives`, `/lives/:liveId`, `/admin/lives` |
| `src/components/UnifiedSidebar.tsx` | Add "Ao Vivo" item in Estudos group |
| `src/components/MobileSidebar.tsx` | Add "Ao Vivo" item in Estudos group |
| `src/pages/Dashboard.tsx` | Add `LiveBanner` component |

---

## Chunk 1: Database + Service Layer

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260311100000_create_live_events.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
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
  teacher_id uuid REFERENCES public.profiles(id) NOT NULL,
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
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')
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
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'teacher')
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
-- pg_cron: 15-minute reminder job
-- ============================================================
-- NOTE: pg_cron may need to be enabled via Supabase Dashboard > Extensions.
-- If pg_cron is not available, reminders can be triggered manually from the admin page.

-- Only create if pg_cron extension is available:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'live-event-reminders',
      '* * * * *',
      $$
        -- Send 15-min reminders for upcoming lives
        INSERT INTO public.notifications (user_id, type, title, message, related_entity_id, related_entity_type, is_read)
        SELECT
          sc.user_id,
          'live_event',
          'A aula "' || le.title || '" começa em 15 minutos!',
          'Prepare-se para a aula ao vivo.',
          le.id::text,
          'live_event',
          false
        FROM public.live_events le
        JOIN public.student_classes sc ON sc.class_id = le.class_id
        WHERE le.status = 'scheduled'
          AND le.reminder_sent = false
          AND le.scheduled_start BETWEEN now() AND now() + interval '15 minutes'
        UNION ALL
        -- Global lives: notify all students
        SELECT
          p.id,
          'live_event',
          'A aula "' || le.title || '" começa em 15 minutos!',
          'Prepare-se para a aula ao vivo.',
          le.id::text,
          'live_event',
          false
        FROM public.live_events le
        CROSS JOIN public.profiles p
        WHERE le.class_id IS NULL
          AND le.status = 'scheduled'
          AND le.reminder_sent = false
          AND le.scheduled_start BETWEEN now() AND now() + interval '15 minutes'
          AND p.role = 'student';

        -- Mark reminders as sent
        UPDATE public.live_events
        SET reminder_sent = true
        WHERE status = 'scheduled'
          AND reminder_sent = false
          AND scheduled_start BETWEEN now() AND now() + interval '15 minutes';
      $$
    );
  END IF;
END $$;
```

- [ ] **Step 2: Push migration to Supabase**

Run: Use Supabase Management API to execute the SQL (same pattern used previously with `sbp_` token).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260311100000_create_live_events.sql
git commit -m "feat(db): create live_events table with RLS and module_type column"
```

---

### Task 2: Feature Key + Service Layer

**Files:**
- Modify: `src/services/classPermissionsService.ts:22-30`
- Create: `src/services/liveEventService.ts`

- [ ] **Step 1: Add LIVE_EVENTS feature key**

In `src/services/classPermissionsService.ts`, add to `FEATURE_KEYS`:

```typescript
export const FEATURE_KEYS = {
  FLASHCARDS: 'flashcards',
  QUIZ: 'quiz',
  EVERCAST: 'evercast',
  ESSAYS: 'essays',
  RANKING: 'ranking',
  VIDEO_LESSONS: 'video_lessons',
  CALENDAR: 'calendar',
  LIVE_EVENTS: 'live_events',
} as const
```

- [ ] **Step 2: Update calendarService.ts to accept related_entity_id**

In `src/services/calendarService.ts`, update the `createEvent` function signature to add `related_entity_id`:

```typescript
export const createEvent = async (event: {
  title: string
  description?: string
  start_time: string
  end_time?: string
  event_type: 'LIVE_CLASS' | 'ESSAY_DEADLINE' | 'SIMULATION' | 'GENERAL'
  class_id?: string | null
  related_entity_id?: string | null
}): Promise<CalendarEvent> => {
```

No other changes needed — supabase `.insert(event)` will pass the field through.

- [ ] **Step 3: Create liveEventService.ts**

```typescript
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { createEvent, updateEvent, deleteEvent } from '@/services/calendarService'
import { notificationService } from '@/services/notificationService'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LiveEventProvider = 'panda' | 'youtube' | 'meet'
export type LiveEventStatus = 'scheduled' | 'live' | 'ended' | 'cancelled'

export interface LiveEvent {
  id: string
  title: string
  description: string | null
  provider: LiveEventProvider
  stream_url: string
  class_id: string | null
  course_id: string | null
  teacher_id: string
  scheduled_start: string
  scheduled_end: string
  status: LiveEventStatus
  recording_url: string | null
  recording_published: boolean
  reminder_sent: boolean
  calendar_event_id: string | null
  created_at: string
  updated_at: string
  // Joined fields
  classes?: { name: string } | null
  profiles?: { first_name: string; last_name: string } | null
}

export interface CreateLiveEventInput {
  title: string
  description?: string
  provider: LiveEventProvider
  stream_url: string
  class_id?: string | null
  course_id?: string | null
  teacher_id: string
  scheduled_start: string
  scheduled_end: string
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const getLiveEvents = async (filters?: {
  classId?: string
  status?: LiveEventStatus
  provider?: LiveEventProvider
}): Promise<LiveEvent[]> => {
  let query = supabase
    .from('live_events')
    .select('*, classes(name), profiles(first_name, last_name)')
    .order('scheduled_start', { ascending: true })

  if (filters?.classId) query = query.eq('class_id', filters.classId)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.provider) query = query.eq('provider', filters.provider)

  const { data, error } = await query
  if (error) {
    logger.error('Erro ao buscar live events:', error)
    return []
  }
  return (data as LiveEvent[]) || []
}

export const getLiveEvent = async (id: string): Promise<LiveEvent | null> => {
  const { data, error } = await supabase
    .from('live_events')
    .select('*, classes(name), profiles(first_name, last_name)')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Erro ao buscar live event:', error)
    return null
  }
  return data as LiveEvent
}

export const createLiveEvent = async (
  input: CreateLiveEventInput
): Promise<LiveEvent> => {
  // 1. Create live event first (to get its ID)
  const { data, error } = await supabase
    .from('live_events')
    .insert({
      ...input,
      class_id: input.class_id || null,
      course_id: input.course_id || null,
    })
    .select('*, classes(name), profiles(first_name, last_name)')
    .single()

  if (error) {
    logger.error('Erro ao criar live event:', error)
    throw error
  }

  // 2. Create calendar event with bidirectional linking
  const calendarEvent = await createEvent({
    title: input.title,
    description: input.description,
    start_time: input.scheduled_start,
    end_time: input.scheduled_end,
    event_type: 'LIVE_CLASS',
    class_id: input.class_id || null,
    related_entity_id: data.id,
  })

  // 3. Update live event with calendar_event_id
  await supabase
    .from('live_events')
    .update({ calendar_event_id: calendarEvent.id })
    .eq('id', data.id)

  // 4. Notify students
  await notifyLiveEventRecipients(
    data as LiveEvent,
    `Nova aula ao vivo agendada: ${input.title}`,
    `A aula "${input.title}" foi agendada para ${new Date(input.scheduled_start).toLocaleString('pt-BR')}.`
  )

  return data as LiveEvent
}

export const updateLiveEvent = async (
  id: string,
  updates: Partial<LiveEvent>
): Promise<LiveEvent> => {
  const { data, error } = await supabase
    .from('live_events')
    .update(updates)
    .eq('id', id)
    .select('*, classes(name), profiles(first_name, last_name)')
    .single()

  if (error) {
    logger.error('Erro ao atualizar live event:', error)
    throw error
  }

  // Sync calendar event if title or time changed
  const liveEvent = data as LiveEvent
  if (liveEvent.calendar_event_id && (updates.title || updates.scheduled_start || updates.scheduled_end)) {
    try {
      await updateEvent(liveEvent.calendar_event_id, {
        title: liveEvent.title,
        description: liveEvent.description || undefined,
        start_time: liveEvent.scheduled_start,
        end_time: liveEvent.scheduled_end,
        event_type: 'LIVE_CLASS',
        class_id: liveEvent.class_id,
      })
    } catch (e) {
      logger.error('Erro ao sincronizar calendar event:', e)
    }
  }

  return liveEvent
}

export const deleteLiveEvent = async (id: string): Promise<void> => {
  // Get event to find calendar_event_id
  const event = await getLiveEvent(id)

  const { error } = await supabase
    .from('live_events')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Erro ao deletar live event:', error)
    throw error
  }

  // Delete linked calendar event
  if (event?.calendar_event_id) {
    try {
      await deleteEvent(event.calendar_event_id)
    } catch (e) {
      logger.error('Erro ao deletar calendar event vinculado:', e)
    }
  }
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

export const startLive = async (id: string): Promise<void> => {
  const { data, error } = await supabase
    .from('live_events')
    .update({ status: 'live' })
    .eq('id', id)
    .select('*, classes(name)')
    .single()

  if (error) {
    logger.error('Erro ao iniciar live:', error)
    throw error
  }

  await notifyLiveEventRecipients(
    data as LiveEvent,
    `A aula "${data.title}" está ao vivo agora!`,
    `Clique para assistir a aula ao vivo.`
  )
}

export const endLive = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('live_events')
    .update({ status: 'ended' })
    .eq('id', id)

  if (error) {
    logger.error('Erro ao encerrar live:', error)
    throw error
  }
}

export const cancelLive = async (id: string): Promise<void> => {
  const event = await getLiveEvent(id)

  const { error } = await supabase
    .from('live_events')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) {
    logger.error('Erro ao cancelar live:', error)
    throw error
  }

  // Delete calendar event on cancel
  if (event?.calendar_event_id) {
    try {
      await deleteEvent(event.calendar_event_id)
    } catch (e) {
      logger.error('Erro ao deletar calendar event:', e)
    }
  }
}

// ─── Recording Publishing ────────────────────────────────────────────────────

export const publishRecording = async (
  id: string,
  recordingUrl: string,
  recordingProvider: 'panda' | 'youtube'
): Promise<void> => {
  const event = await getLiveEvent(id)
  if (!event || !event.course_id) throw new Error('Evento ou curso não encontrado')

  // 1. Update live event
  await supabase
    .from('live_events')
    .update({ recording_url: recordingUrl, recording_published: true })
    .eq('id', id)

  // 2. Find or create "Lives" module
  const { data: existingModule } = await supabase
    .from('video_modules')
    .select('id')
    .eq('course_id', event.course_id)
    .eq('module_type', 'lives')
    .single()

  let moduleId: string

  if (existingModule) {
    moduleId = existingModule.id
  } else {
    // Get max order_index
    const { data: modules } = await supabase
      .from('video_modules')
      .select('order_index')
      .eq('course_id', event.course_id)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrder = (modules?.[0]?.order_index ?? -1) + 1

    const { data: newModule, error: modError } = await supabase
      .from('video_modules')
      .insert({
        course_id: event.course_id,
        name: 'Lives',
        module_type: 'lives',
        order_index: nextOrder,
      })
      .select('id')
      .single()

    if (modError) throw modError
    moduleId = newModule.id
  }

  // 3. Extract video source ID from URL
  const videoSourceId = extractVideoSourceId(recordingUrl, recordingProvider)
  const videoSourceType = recordingProvider === 'panda' ? 'panda_video' : 'youtube'

  // 4. Get next lesson order
  const { data: lessons } = await supabase
    .from('video_lessons')
    .select('order_index')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextLessonOrder = (lessons?.[0]?.order_index ?? -1) + 1

  // 5. Create video lesson
  const { error: lessonError } = await supabase
    .from('video_lessons')
    .insert({
      module_id: moduleId,
      title: event.title,
      description: event.description,
      video_source_id: videoSourceId,
      video_source_type: videoSourceType,
      order_index: nextLessonOrder,
      is_active: true,
    })

  if (lessonError) throw lessonError
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getActiveLives = async (): Promise<LiveEvent[]> => {
  const { data, error } = await supabase
    .from('live_events')
    .select('*, classes(name)')
    .eq('status', 'live')
    .order('scheduled_start', { ascending: true })

  if (error) {
    logger.error('Erro ao buscar lives ativas:', error)
    return []
  }
  return (data as LiveEvent[]) || []
}

export const getUpcomingLives = async (): Promise<LiveEvent[]> => {
  const { data, error } = await supabase
    .from('live_events')
    .select('*, classes(name), profiles(first_name, last_name)')
    .in('status', ['scheduled', 'live'])
    .gte('scheduled_end', new Date().toISOString())
    .order('scheduled_start', { ascending: true })

  if (error) {
    logger.error('Erro ao buscar próximas lives:', error)
    return []
  }
  return (data as LiveEvent[]) || []
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractVideoSourceId = (url: string, provider: 'panda' | 'youtube'): string => {
  if (provider === 'youtube') {
    // Extract YouTube video ID from various URL formats
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([a-zA-Z0-9_-]{11})/)
    return match?.[1] || url
  }
  // Panda: extract UUID from embed URL
  const match = url.match(/[?&]v=([a-f0-9-]{36})/)
  return match?.[1] || url
}

const notifyLiveEventRecipients = async (
  event: LiveEvent,
  title: string,
  message: string
): Promise<void> => {
  try {
    let userIds: string[] = []

    if (event.class_id) {
      // Students in specific class
      const { data } = await supabase
        .from('student_classes')
        .select('user_id')
        .eq('class_id', event.class_id)
      userIds = data?.map(s => s.user_id) || []
    } else {
      // Global: all students
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student')
      userIds = data?.map(s => s.id) || []
    }

    if (userIds.length > 0) {
      await notificationService.createBulkNotifications(userIds, {
        type: 'live_event',
        title,
        message,
        relatedEntityId: event.id,
        relatedEntityType: 'live_event',
      })
    }
  } catch (error) {
    logger.error('Erro ao notificar participantes da live:', error)
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/services/classPermissionsService.ts src/services/calendarService.ts src/services/liveEventService.ts
git commit -m "feat: add liveEventService with CRUD, lifecycle, and recording publishing"
```

---

## Chunk 2: Student Pages + Components

### Task 3: LivePlayerEmbed Component

**Files:**
- Create: `src/components/LivePlayerEmbed.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, Radio, Video } from 'lucide-react'
import type { LiveEventProvider } from '@/services/liveEventService'

interface LivePlayerEmbedProps {
  provider: LiveEventProvider
  streamUrl: string
  title: string
}

export function LivePlayerEmbed({ provider, streamUrl, title }: LivePlayerEmbedProps) {
  if (provider === 'meet') {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">
              Esta aula acontece no Google Meet. Clique no botão abaixo para entrar.
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => window.open(streamUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4" />
            Entrar na Aula
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Panda Video or YouTube: iframe embed
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-black">
      <iframe
        src={streamUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LivePlayerEmbed.tsx
git commit -m "feat: add LivePlayerEmbed component for Panda/YouTube/Meet"
```

---

### Task 4: LiveBanner Component

**Files:**
- Create: `src/components/LiveBanner.tsx`

- [ ] **Step 1: Create the banner component**

```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getActiveLives, type LiveEvent } from '@/services/liveEventService'
import { supabase } from '@/lib/supabase/client'

export function LiveBanner() {
  const [activeLives, setActiveLives] = useState<LiveEvent[]>([])

  useEffect(() => {
    getActiveLives().then(setActiveLives)

    // Real-time subscription for live status changes
    const channel = supabase
      .channel('live-events-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_events' },
        () => {
          getActiveLives().then(setActiveLives)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (activeLives.length === 0) return null

  const live = activeLives[0]

  return (
    <div className="relative overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Radio className="h-5 w-5 text-red-500" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              Ao Vivo Agora{activeLives.length > 1 ? ` (${activeLives.length})` : ''}
            </p>
            <p className="text-xs text-muted-foreground">{live.title}</p>
          </div>
        </div>
        <Button size="sm" variant="destructive" asChild>
          <Link to={`/lives/${live.id}`}>Assistir Agora</Link>
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LiveBanner.tsx
git commit -m "feat: add LiveBanner component with real-time status"
```

---

### Task 5: LiveEventsPage (Student)

**Files:**
- Create: `src/pages/LiveEvents.tsx`

- [ ] **Step 1: Create student live events page**

```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Radio, Calendar, Video, Youtube, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUpcomingLives, type LiveEvent, type LiveEventProvider } from '@/services/liveEventService'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import { SectionLoader } from '@/components/SectionLoader'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'

const providerConfig: Record<LiveEventProvider, { label: string; icon: typeof Radio; color: string }> = {
  panda: { label: 'Panda Video', icon: Video, color: 'text-blue-500' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-500' },
  meet: { label: 'Google Meet', icon: ExternalLink, color: 'text-green-500' },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  live: { label: 'Ao Vivo', className: 'bg-red-500 text-white animate-pulse' },
  scheduled: { label: 'Agendada', className: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  ended: { label: 'Encerrada', className: 'bg-muted text-muted-foreground' },
}

export default function LiveEventsPage() {
  const [lives, setLives] = useState<LiveEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { hasFeature, loading: permLoading } = useFeaturePermissions()

  useEffect(() => {
    loadLives()

    const channel = supabase
      .channel('live-events-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_events' },
        () => loadLives()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadLives = async () => {
    const data = await getUpcomingLives()
    setLives(data)
    setLoading(false)
  }

  if (loading || permLoading) return <SectionLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aulas ao Vivo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe as aulas ao vivo e agendadas
        </p>
      </div>

      {lives.length === 0 ? (
        <Card className="border-border shadow-sm">
          <CardContent className="text-center py-12">
            <Radio className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma aula ao vivo agendada no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lives.map((live) => {
            const provider = providerConfig[live.provider]
            const status = statusConfig[live.status] || statusConfig.scheduled
            const ProviderIcon = provider.icon

            return (
              <Card key={live.id} className={cn(
                'border-border shadow-sm transition-all hover:shadow-md',
                live.status === 'live' && 'border-red-500/30 ring-1 ring-red-500/20'
              )}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <Badge className={status.className}>{status.label}</Badge>
                    <ProviderIcon className={cn('h-4 w-4', provider.color)} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">{live.title}</h3>
                    {live.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{live.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(live.scheduled_start), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </div>

                  {live.classes?.name && (
                    <p className="text-xs text-muted-foreground">
                      Turma: <span className="font-medium text-foreground">{live.classes.name}</span>
                    </p>
                  )}

                  <Button
                    className="w-full gap-2"
                    variant={live.status === 'live' ? 'destructive' : 'outline'}
                    asChild
                  >
                    <Link to={`/lives/${live.id}`}>
                      {live.status === 'live' ? (
                        <>
                          <Radio className="h-4 w-4" />
                          Assistir Agora
                        </>
                      ) : (
                        'Ver Detalhes'
                      )}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/LiveEvents.tsx
git commit -m "feat: add LiveEventsPage for students"
```

---

### Task 6: LivePlayerPage (Student)

**Files:**
- Create: `src/pages/LivePlayer.tsx`

- [ ] **Step 1: Create the player page**

```tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Radio, User } from 'lucide-react'
import { getLiveEvent, type LiveEvent } from '@/services/liveEventService'
import { LivePlayerEmbed } from '@/components/LivePlayerEmbed'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'

export default function LivePlayerPage() {
  const { liveId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [live, setLive] = useState<LiveEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!liveId) return
    loadLive()

    // Real-time for status changes
    const channel = supabase
      .channel(`live-event-${liveId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_events', filter: `id=eq.${liveId}` },
        (payload) => {
          setLive(prev => prev ? { ...prev, ...payload.new } as LiveEvent : null)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [liveId])

  const loadLive = async () => {
    const data = await getLiveEvent(liveId!)
    if (!data) {
      toast({ title: 'Erro', description: 'Aula ao vivo não encontrada', variant: 'destructive' })
      navigate('/lives')
      return
    }
    setLive(data)
    setLoading(false)
  }

  if (loading) return <SectionLoader />
  if (!live) return null

  const isLive = live.status === 'live'
  const isScheduled = live.status === 'scheduled'
  const isEnded = live.status === 'ended'

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/lives"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">{live.title}</h1>
            {isLive && (
              <Badge className="bg-red-500 text-white animate-pulse">Ao Vivo</Badge>
            )}
            {isScheduled && (
              <Badge variant="outline" className="text-blue-500 border-blue-500/30">Agendada</Badge>
            )}
            {isEnded && (
              <Badge variant="outline">Encerrada</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(live.scheduled_start), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            {live.profiles && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {live.profiles.first_name} {live.profiles.last_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Player or waiting state */}
      {isLive ? (
        <LivePlayerEmbed provider={live.provider} streamUrl={live.stream_url} title={live.title} />
      ) : isScheduled ? (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Radio className="h-12 w-12 text-muted-foreground/30" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">Aula ainda não começou</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Início previsto: {format(new Date(live.scheduled_start), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Radio className="h-12 w-12 text-muted-foreground/30" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">Aula encerrada</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {live.recording_published
                  ? 'A gravação está disponível nos seus cursos.'
                  : 'A gravação será disponibilizada em breve.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {live.description && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Descrição</h3>
            <p className="text-sm text-muted-foreground">{live.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/LivePlayer.tsx
git commit -m "feat: add LivePlayerPage with real-time status and provider embed"
```

---

## Chunk 3: Admin Page

### Task 7: AdminLiveEventsPage

**Files:**
- Create: `src/pages/admin/lives/AdminLiveEventsPage.tsx`

- [ ] **Step 1: Create the admin CRUD page**

This page follows the same pattern as `AdminCalendarPage.tsx`:
- Table with filters (status, class, provider)
- Create/Edit dialog with form fields
- Lifecycle action buttons (Iniciar, Encerrar, Publicar Gravação, Cancelar)
- Status badges with colors

```tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  MoreHorizontal,
  Radio,
  Video,
  Youtube,
  ExternalLink,
  Play,
  Square,
  Upload,
  Trash2,
  Pencil,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  getLiveEvents,
  createLiveEvent,
  updateLiveEvent,
  deleteLiveEvent,
  startLive,
  endLive,
  cancelLive,
  publishRecording,
  type LiveEvent,
  type LiveEventProvider,
  type LiveEventStatus,
  type CreateLiveEventInput,
} from '@/services/liveEventService'
import { SectionLoader } from '@/components/SectionLoader'

const providerConfig: Record<LiveEventProvider, { label: string; icon: typeof Radio; color: string }> = {
  panda: { label: 'Panda Video', icon: Video, color: 'text-blue-500' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-500' },
  meet: { label: 'Google Meet', icon: ExternalLink, color: 'text-green-500' },
}

const statusConfig: Record<LiveEventStatus, { label: string; className: string }> = {
  scheduled: { label: 'Agendada', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  live: { label: 'Ao Vivo', className: 'bg-red-500 text-white' },
  ended: { label: 'Encerrada', className: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelada', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
}

interface FormData {
  title: string
  description: string
  provider: LiveEventProvider
  stream_url: string
  class_id: string
  course_id: string
  scheduled_start: string
  scheduled_end: string
}

const emptyForm: FormData = {
  title: '',
  description: '',
  provider: 'panda',
  stream_url: '',
  class_id: '',
  course_id: '',
  scheduled_start: '',
  scheduled_end: '',
}

export default function AdminLiveEventsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [lives, setLives] = useState<LiveEvent[]>([])
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)

  // Publish recording dialog
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [recordingUrl, setRecordingUrl] = useState('')
  const [recordingProvider, setRecordingProvider] = useState<'panda' | 'youtube'>('panda')

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterProvider, setFilterProvider] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [livesData, classesData, coursesData] = await Promise.all([
      getLiveEvents(),
      supabase.from('classes').select('id, name').order('name'),
      supabase.from('video_courses').select('id, title').order('title'),
    ])
    setLives(livesData)
    setClasses(classesData.data || [])
    setCourses(coursesData.data || [])
    setLoading(false)
  }

  const filteredLives = lives.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false
    if (filterClass !== 'all' && l.class_id !== filterClass) return false
    if (filterProvider !== 'all' && l.provider !== filterProvider) return false
    return true
  })

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (live: LiveEvent) => {
    setEditingId(live.id)
    setForm({
      title: live.title,
      description: live.description || '',
      provider: live.provider,
      stream_url: live.stream_url,
      class_id: live.class_id || '',
      course_id: live.course_id || '',
      scheduled_start: live.scheduled_start.slice(0, 16),
      scheduled_end: live.scheduled_end.slice(0, 16),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.stream_url || !form.scheduled_start || !form.scheduled_end) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const classId = form.class_id && form.class_id !== 'global' ? form.class_id : null
      const courseId = form.course_id && form.course_id !== 'none' ? form.course_id : null

      if (editingId) {
        await updateLiveEvent(editingId, {
          title: form.title,
          description: form.description || null,
          provider: form.provider,
          stream_url: form.stream_url,
          class_id: classId,
          course_id: courseId,
          scheduled_start: new Date(form.scheduled_start).toISOString(),
          scheduled_end: new Date(form.scheduled_end).toISOString(),
        } as Partial<LiveEvent>)
        toast({ title: 'Live atualizada!' })
      } else {
        await createLiveEvent({
          title: form.title,
          description: form.description || undefined,
          provider: form.provider,
          stream_url: form.stream_url,
          class_id: classId,
          course_id: courseId,
          teacher_id: user!.id,
          scheduled_start: new Date(form.scheduled_start).toISOString(),
          scheduled_end: new Date(form.scheduled_end).toISOString(),
        })
        toast({ title: 'Live criada!' })
      }
      setDialogOpen(false)
      await loadData()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleStartLive = async (id: string) => {
    try {
      await startLive(id)
      toast({ title: 'Live iniciada!' })
      await loadData()
    } catch {
      toast({ title: 'Erro ao iniciar live', variant: 'destructive' })
    }
  }

  const handleEndLive = async (id: string) => {
    try {
      await endLive(id)
      toast({ title: 'Live encerrada!' })
      await loadData()
    } catch {
      toast({ title: 'Erro ao encerrar live', variant: 'destructive' })
    }
  }

  const handleCancelLive = async (id: string) => {
    try {
      await cancelLive(id)
      toast({ title: 'Live cancelada!' })
      await loadData()
    } catch {
      toast({ title: 'Erro ao cancelar live', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteLiveEvent(deletingId)
      toast({ title: 'Live excluída!' })
      setDeleteDialogOpen(false)
      await loadData()
    } catch {
      toast({ title: 'Erro ao excluir live', variant: 'destructive' })
    }
  }

  const handlePublish = async () => {
    if (!publishingId || !recordingUrl) return
    setSaving(true)
    try {
      await publishRecording(publishingId, recordingUrl, recordingProvider)
      toast({ title: 'Gravação publicada!', description: 'A aula foi adicionada ao módulo Lives do curso.' })
      setPublishDialogOpen(false)
      setRecordingUrl('')
      await loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao publicar', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SectionLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aulas ao Vivo</h1>
          <p className="text-sm text-muted-foreground">Gerencie as transmissões ao vivo</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Live
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['scheduled', 'live', 'ended', 'cancelled'] as LiveEventStatus[]).map(status => {
          const config = statusConfig[status]
          const count = lives.filter(l => l.status === status).length
          return (
            <Card key={status} className="border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <Badge variant="outline" className={cn('mt-1', config.className)}>{config.label}</Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="scheduled">Agendada</SelectItem>
            <SelectItem value="live">Ao Vivo</SelectItem>
            <SelectItem value="ended">Encerrada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Turma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as turmas</SelectItem>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Provedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="panda">Panda Video</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="meet">Google Meet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Provedor</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma live encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredLives.map(live => {
                const provider = providerConfig[live.provider]
                const status = statusConfig[live.status]
                const ProviderIcon = provider.icon

                return (
                  <TableRow key={live.id}>
                    <TableCell className="font-medium">{live.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <ProviderIcon className={cn('h-4 w-4', provider.color)} />
                        <span className="text-sm">{provider.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>{live.classes?.name || 'Global'}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(live.scheduled_start), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {live.status === 'scheduled' && (
                            <>
                              <DropdownMenuItem onClick={() => openEditDialog(live)}>
                                <Pencil className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStartLive(live.id)}>
                                <Play className="h-4 w-4 mr-2" /> Iniciar Live
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCancelLive(live.id)}>
                                <XCircle className="h-4 w-4 mr-2" /> Cancelar
                              </DropdownMenuItem>
                            </>
                          )}
                          {live.status === 'live' && (
                            <DropdownMenuItem onClick={() => handleEndLive(live.id)}>
                              <Square className="h-4 w-4 mr-2" /> Encerrar Live
                            </DropdownMenuItem>
                          )}
                          {live.status === 'ended' && !live.recording_published && live.course_id && (
                            <DropdownMenuItem onClick={() => {
                              setPublishingId(live.id)
                              setPublishDialogOpen(true)
                            }}>
                              <Upload className="h-4 w-4 mr-2" /> Publicar Gravação
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDeletingId(live.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Live' : 'Nova Live'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provedor *</Label>
                <Select value={form.provider} onValueChange={(v: LiveEventProvider) => setForm(f => ({ ...f, provider: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="panda">Panda Video</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="meet">Google Meet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Turma</Label>
                <Select value={form.class_id} onValueChange={v => setForm(f => ({ ...f, class_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Global" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (todos)</SelectItem>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>URL da Stream *</Label>
              <Input
                value={form.stream_url}
                onChange={e => setForm(f => ({ ...f, stream_url: e.target.value }))}
                placeholder={form.provider === 'meet' ? 'https://meet.google.com/...' : 'https://...'}
              />
            </div>
            <div>
              <Label>Curso (para gravação)</Label>
              <Select value={form.course_id} onValueChange={v => setForm(f => ({ ...f, course_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Início *</Label>
                <Input type="datetime-local" value={form.scheduled_start} onChange={e => setForm(f => ({ ...f, scheduled_start: e.target.value }))} />
              </div>
              <div>
                <Label>Término *</Label>
                <Input type="datetime-local" value={form.scheduled_end} onChange={e => setForm(f => ({ ...f, scheduled_end: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Recording Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar Gravação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cole a URL da gravação. Ela será adicionada como aula no módulo "Lives" do curso vinculado.
            </p>
            <div>
              <Label>Provedor da Gravação</Label>
              <Select value={recordingProvider} onValueChange={(v: 'panda' | 'youtube') => setRecordingProvider(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="panda">Panda Video</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL da Gravação *</Label>
              <Input value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handlePublish} disabled={saving || !recordingUrl}>
              {saving ? 'Publicando...' : 'Publicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Live?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento do calendário vinculado também será excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/lives/AdminLiveEventsPage.tsx
git commit -m "feat: add AdminLiveEventsPage with CRUD and lifecycle management"
```

---

## Chunk 4: Integration (Routes, Sidebar, Dashboard)

### Task 8: Add Routes

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add lazy imports at top of App.tsx**

Add with the other lazy imports:

```typescript
const LiveEventsPage = lazy(() => import('@/pages/LiveEvents'))
const LivePlayerPage = lazy(() => import('@/pages/LivePlayer'))
const AdminLiveEventsPage = lazy(() => import('@/pages/admin/lives/AdminLiveEventsPage'))
```

- [ ] **Step 2: Add student routes inside `<Route element={<Layout />}>`**

After the existing student routes (around line 299, near other study routes):

```tsx
<Route path="/lives" element={<LiveEventsPage />} />
<Route path="/lives/:liveId" element={<LivePlayerPage />} />
```

- [ ] **Step 3: Add admin route inside admin+teacher section**

Inside the `<Route path="/admin" element={<AdminLayout />}>` block (around line 490, near simulations):

```tsx
<Route path="lives" element={<AdminLiveEventsPage />} />
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add routes for live events pages"
```

---

### Task 9: Add Sidebar Items

**Files:**
- Modify: `src/components/UnifiedSidebar.tsx`
- Modify: `src/components/MobileSidebar.tsx`

- [ ] **Step 1: Update UnifiedSidebar.tsx**

Add `Radio` to the lucide-react imports.

Add to the `studentMenuGroups` array, inside the **Estudos** group items (after Banco de Questões):

```typescript
{ label: 'Ao Vivo', href: '/lives', icon: Radio, featureKey: FEATURE_KEYS.LIVE_EVENTS },
```

Add to the `adminMenuGroups` array, inside the **Conteúdo** group items (after Simulados):

```typescript
{ label: 'Lives', href: '/admin/lives', icon: Radio },
```

- [ ] **Step 2: Update MobileSidebar.tsx**

Add `Radio` to the lucide-react imports.

Add to the `studentMenuGroups` array, inside the **Estudos** group items (after Banco de Questões):

```typescript
{ label: 'Ao Vivo', href: '/lives', icon: Radio, featureKey: FEATURE_KEYS.LIVE_EVENTS },
```

Add to the `contentMenuItems` array (after Gerenciar Simulados):

```typescript
{
  label: 'Gerenciar Lives',
  href: '/admin/lives',
  icon: Radio,
},
```

- [ ] **Step 3: Commit**

```bash
git add src/components/UnifiedSidebar.tsx src/components/MobileSidebar.tsx
git commit -m "feat: add Ao Vivo sidebar items for students and admin"
```

---

### Task 10: Add LiveBanner to Dashboard

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Import and add LiveBanner**

Add import at top:

```typescript
import { LiveBanner } from '@/components/LiveBanner'
```

Add `<LiveBanner />` right after the header div (after line 228, before KPI Cards):

```tsx
{/* Live Banner */}
<LiveBanner />
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: add LiveBanner to student dashboard"
```

---

### Task 11: Build and Verify

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: no TypeScript errors, successful build.

- [ ] **Step 2: Fix any type errors**

If the build surfaces type issues (e.g., Supabase types not including `live_events`), regenerate types:

```bash
npx supabase gen types typescript --project-id hnhzindsfuqnaxosujay > src/lib/supabase/types.ts
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: resolve build errors for live events feature"
```
