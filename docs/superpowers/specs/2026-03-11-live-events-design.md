# Live Events (Aulas ao Vivo) — Design Spec

**Date:** 2026-03-11
**Status:** Approved

## Summary

Add live event support to Everest, allowing admin/teachers to schedule and broadcast live classes via Panda Video, YouTube, or Google Meet — restricted by class (turma) or open to all students. After a live ends, the recording can be published as a regular lesson inside the linked course's "Lives" module.

## Requirements

1. Three providers: Panda Video (iframe embed), YouTube (iframe embed), Google Meet (external link, opens new tab)
2. Access control: per-class (turma) or global. Students see lives from their enrolled classes + global lives. Admin/teacher see all.
3. Dashboard banner when a live is active ("Ao Vivo Agora!")
4. Calendar integration — each live also creates a `calendar_event` of type `LIVE_CLASS`
5. Notifications: on schedule, 15min reminder, on go-live
6. Post-live: teacher publishes recording URL → system creates `video_lesson` in the course's "Lives" module automatically
7. New feature key `LIVE_EVENTS` for class-based permission gating

## Database

### New table: `live_events`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK (gen_random_uuid()) | |
| title | text NOT NULL | Event title |
| description | text | Optional description |
| provider | text NOT NULL CHECK (provider IN ('panda', 'youtube', 'meet')) | Stream provider |
| stream_url | text NOT NULL | Embed URL (Panda/YouTube) or Meet link |
| class_id | uuid FK → classes(id) ON DELETE CASCADE, nullable | Target class (NULL = global) |
| course_id | uuid FK → video_courses(id) ON DELETE SET NULL, nullable | Course to publish recording into |
| teacher_id | uuid FK → profiles(id) NOT NULL | Responsible teacher |
| scheduled_start | timestamptz NOT NULL | Planned start time |
| scheduled_end | timestamptz NOT NULL | Planned end time |
| status | text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','cancelled')) | Lifecycle state |
| recording_url | text | Recording URL after event ends |
| recording_published | boolean DEFAULT false | Whether recording was published as a lesson |
| reminder_sent | boolean DEFAULT false | Whether the 15-min reminder notification was sent |
| calendar_event_id | uuid FK → calendar_events(id) ON DELETE SET NULL, nullable | Linked calendar event |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

### RLS Policies

- **SELECT (students):** `class_id IS NULL OR class_id IN (SELECT class_id FROM student_classes WHERE user_id = auth.uid())`
- **SELECT (admin/teacher):** `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('administrator','teacher'))`
- **INSERT/UPDATE/DELETE:** admin and teacher only

### Feature Permission

Add `LIVE_EVENTS = 'live_events'` to `FEATURE_KEYS` in `classPermissionsService.ts`.

**Feature gating vs RLS:** The `LIVE_EVENTS` feature key controls sidebar visibility only. RLS is the source of truth for data access. Global lives (`class_id = NULL`) are always accessible via RLS regardless of feature permission — this is intentional since global lives are for special events (launches, exam reviews) that all students should see. The sidebar item is visible if the student has the feature key OR if there are active global lives.

## Pages

| Page | Route | Role | Description |
|------|-------|------|-------------|
| LiveEventsPage | `/lives` | Student | List of upcoming + active lives for user's classes |
| LivePlayerPage | `/lives/:liveId` | Student | Player page: iframe for Panda/YouTube, "Entrar na Aula" button for Meet |
| AdminLiveEventsPage | `/admin/lives` | Admin/Teacher | CRUD for live events |

## Components

### LiveBanner
- Displayed at top of Dashboard when there is an active live (`status = 'live'`) accessible to the student
- Shows: title, provider icon, "Assistir Agora" button → navigates to `/lives/:liveId`
- Pulsing red dot or `Radio` icon to indicate live status

### LivePlayerEmbed
- Receives `provider` and `stream_url` props
- **Panda/YouTube:** Renders responsive iframe (16:9 aspect ratio)
- **Meet:** Renders card with event info + prominent "Entrar na Aula" button that opens `stream_url` in a new tab (`window.open`)

### PublishRecordingDialog
- Shown on admin page for events with `status = 'ended'` and `recording_published = false`
- Form: recording URL input
- On submit:
  1. Updates `live_events.recording_url` and `live_events.recording_published = true`
  2. Finds or creates the Lives module in the linked `course_id` (identified by `module_type = 'lives'` — see Recording → Lesson Flow)
  3. Creates a `video_lesson` in that module with the correct `video_source_id` and `video_source_type` (see Recording → Lesson Flow)
  4. Toast confirmation

## Sidebar

New item in **Estudos** group (both `UnifiedSidebar` and `MobileSidebar`):
- Label: "Ao Vivo"
- Icon: `Radio` (from lucide-react)
- Route: `/lives`
- Feature key: `FEATURE_KEYS.LIVE_EVENTS`
- Badge: show count or dot indicator when there are active lives

## Notification Flow

| Trigger | Notification | Recipients |
|---------|-------------|------------|
| Live event created | "Nova aula ao vivo agendada: {title} em {date}" | Students in class (or all if global) |
| 15 minutes before scheduled_start | "A aula {title} começa em 15 minutos!" | Same recipients |
| Status changed to `live` | "A aula {title} está ao vivo agora!" | Same recipients |

### Bulk notification delivery

Notifications are sent server-side via a Supabase database function `notify_live_event_recipients(live_event_id, title, message)` that:
1. Queries `student_classes` to find all students in the event's `class_id` (or all students if `class_id IS NULL`)
2. Bulk inserts into `notifications` table in a single query
3. Called from: `createLiveEvent` (via RPC), `startLive` (via RPC), and pg_cron (for 15-min reminder)

This avoids client-side fan-out and keeps student enumeration on the server.

### 15-minute reminder implementation

pg_cron job runs every minute:
```sql
SELECT cron.schedule('live-event-reminders', '* * * * *', $$
  SELECT notify_live_event_recipients(id, title, 'A aula ' || title || ' começa em 15 minutos!')
  FROM live_events
  WHERE status = 'scheduled'
    AND reminder_sent = false
    AND scheduled_start BETWEEN now() AND now() + interval '15 minutes';

  UPDATE live_events SET reminder_sent = true
  WHERE status = 'scheduled'
    AND reminder_sent = false
    AND scheduled_start BETWEEN now() AND now() + interval '15 minutes';
$$);
```

The `reminder_sent` column is included in the table schema above.

## Calendar Integration

When a live event is created, automatically create a `calendar_event`:
- `event_type`: `'LIVE_CLASS'`
- `title`: same as live event title
- `start_time` / `end_time`: from live event schedule
- `class_id`: same as live event class_id
- `related_entity_id`: live event id

Store the `calendar_event.id` back in `live_events.calendar_event_id` for bidirectional linking.

### Calendar sync on update/delete

- **Edit live event** (title, time): update the linked `calendar_event` with the same changes
- **Cancel live event**: delete the linked `calendar_event` (or update its title to "[Cancelada] {title}")
- **Delete live event**: delete the linked `calendar_event` via cascade or explicit delete

## Recording → Lesson Flow

When teacher clicks "Publicar Gravação":

1. Save `recording_url` to `live_events`
2. Query `video_modules` for a module with `module_type = 'lives'` in the linked `course_id`
   - If not found, create it with `title = 'Lives'`, `module_type = 'lives'`, `order_index` = max + 1
   - **Note:** requires adding `module_type` column (text, nullable) to `video_modules` table. Using a column instead of name matching avoids fragility if the module is renamed.
3. Create `video_lesson` in that module:
   - `title`: live event title
   - `video_source_id`: extracted from recording URL (Panda video ID or YouTube video ID)
   - `video_source_type`: mapped from `live_events.provider` → `'panda_video'` | `'youtube'` (enum `video_source_provider`)
   - `order_index`: max + 1 within the module
   - `duration_seconds`: null (teacher can edit later)
   - **Meet recordings**: since Meet doesn't have a native recording format, the teacher should upload the recording to Panda or YouTube first, then paste that URL. The PublishRecordingDialog should ask for provider + URL for the recording (which may differ from the original live provider).
4. Set `recording_published = true`

## Admin CRUD (AdminLiveEventsPage)

### List View
- Table with columns: Title, Provider (icon), Class, Date/Time, Status (badge), Actions
- Filters: by status, by class, by provider
- Status badges: Agendada (blue), Ao Vivo (red pulsing), Encerrada (gray), Cancelada (yellow)

### Create/Edit Dialog
- Fields: Title, Description, Provider (select: Panda/YouTube/Meet), Stream URL, Class (select or "Global"), Course (select for recording link), Scheduled Start, Scheduled End
- Validation: URL format check, start < end, required fields

### Actions
- **Iniciar Live:** Changes status to `live` → triggers go-live notification
- **Encerrar Live:** Changes status to `ended`
- **Publicar Gravação:** Opens PublishRecordingDialog
- **Cancelar:** Changes status to `cancelled`
- **Editar/Excluir:** Standard CRUD

## Service Layer

### `liveEventService.ts`

```typescript
// CRUD
getLiveEvents(filters?: { classId?, status?, provider? }): Promise<LiveEvent[]>
getLiveEvent(id: string): Promise<LiveEvent | null>
createLiveEvent(data: CreateLiveEventInput): Promise<LiveEvent>
updateLiveEvent(id: string, data: Partial<LiveEvent>): Promise<LiveEvent>
deleteLiveEvent(id: string): Promise<void>

// Lifecycle
startLive(id: string): Promise<void>        // status → 'live' + notify
endLive(id: string): Promise<void>           // status → 'ended'
cancelLive(id: string): Promise<void>        // status → 'cancelled'

// Recording
publishRecording(id: string, recordingUrl: string): Promise<void>

// Queries
getActiveLives(userId: string): Promise<LiveEvent[]>     // for dashboard banner
getUpcomingLives(userId: string): Promise<LiveEvent[]>    // for /lives page
```

## Tech Decisions

- **No new npm packages** — iframes + window.open cover all three providers
- **Real-time status via Supabase Realtime** — uses built-in `postgres_changes` subscription (WebSocket) on `live_events` table so students see status changes instantly (no custom WebSocket server needed)
- **pg_cron for reminders** — single SQL job, no external service
- **Server-side notifications** — database function for bulk notification fan-out, not client-side loops
- **Feature gating** — same pattern as Evercast, using existing `useFeaturePermissions()` hook. Global lives bypass feature gating.
