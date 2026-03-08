# Everest Cleanup + MemberKit Import Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean the Everest codebase (fix bugs, remove dead code, clean DB), then import MemberKit course with Panda Video integration and build student course pages.

**Architecture:** Fix critical bugs first, then remove unused files/components/DB objects, then build the MemberKit import module and student-facing course pages with Panda Video embed.

**Tech Stack:** React 19, TypeScript, Vite, Supabase, Shadcn UI, Panda Video API, MemberKit API

---

## PHASE 1: BUG FIXES (Critical)

### Task 1: Fix teacher login redirect

**Files:**
- Modify: `src/hooks/use-auth.tsx` (line ~57)

**Step 1: Fix getRedirectPath for teacher role**

In `src/hooks/use-auth.tsx`, find the `getRedirectPath` function. Change the teacher redirect from `/admin` to `/admin/courses`:

```typescript
// Before:
case 'teacher':
  return '/admin'
// After:
case 'teacher':
  return '/admin/courses'
```

**Step 2: Verify the fix**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/use-auth.tsx
git commit -m "fix: teacher login redirect to /admin/courses instead of blocked /admin"
```

---

### Task 2: Fix TeacherStatsWidget hooks order

**Files:**
- Modify: `src/components/dashboard/widgets/TeacherStatsWidget.tsx`

**Step 1: Move hooks before early return**

Find the early return on loading state (around line 63). Move ALL hook calls (`useCountAnimation`, `useFloat`, etc.) to BEFORE the `if (loading) return` statement. Hooks must never be called conditionally.

```typescript
// ALL hooks must be called first, unconditionally
const animatedStudents = useCountAnimation(stats?.totalStudents ?? 0)
const animatedEssays = useCountAnimation(stats?.totalEssays ?? 0)
// ... all other hooks ...

// THEN the early return
if (loading) return <LoadingSkeleton />
```

**Step 2: Verify**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/dashboard/widgets/TeacherStatsWidget.tsx
git commit -m "fix: move hooks before early return in TeacherStatsWidget"
```

---

### Task 3: Fix forum avatar_url column error

**Files:**
- Modify: `src/services/forumService.ts` (lines ~61, 104, 122)

**Step 1: Remove avatar_url from forum queries**

Find all `.select()` calls that reference `avatar_url` in the users join. Remove `avatar_url` from those select strings since the column doesn't exist in the `users` table.

Replace `avatar_url` references with `profile_image_url` if that column exists, or simply remove it.

**Step 2: Verify**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/services/forumService.ts
git commit -m "fix: remove non-existent avatar_url from forum queries"
```

---

### Task 4: Fix auth race condition on page reload

**Files:**
- Modify: `src/contexts/auth-provider.tsx`

**Step 1: Fix auth initialization**

The auth provider has a timeout that fails on page reload/F5, causing logout. The fix:
1. Increase or remove the timeout
2. Use `supabase.auth.getSession()` as the primary initialization method
3. Only redirect to login if getSession explicitly returns no session (not on timeout)

**Step 2: Verify**

Test manually: Login as admin, reload page (F5). Should stay logged in.

**Step 3: Commit**

```bash
git add src/contexts/auth-provider.tsx
git commit -m "fix: auth race condition on page reload"
```

---

### Task 5: Fix login/register spinner with existing session

**Files:**
- Modify: `src/components/PublicRoute.tsx`
- Possibly: `src/contexts/auth-provider.tsx`

**Step 1: Fix PublicRoute**

When a user has an existing session in localStorage and navigates to `/login` or `/register`, the page shows an infinite spinner. Fix: check for existing session and redirect immediately if authenticated.

**Step 2: Verify**

Test: Login, navigate to `/login` directly. Should redirect to dashboard, not spinner.

**Step 3: Commit**

```bash
git add src/components/PublicRoute.tsx
git commit -m "fix: infinite spinner on login/register with existing session"
```

---

## PHASE 2: SECURITY FIXES

### Task 6: Sanitize HTML rendering + mask API keys + remove console.logs

**Files:**
- Modify: `src/components/QuestionRenderer.tsx` (add DOMPurify sanitization)
- Modify: Admin integrations page (mask API keys)
- Modify: `src/contexts/auth-provider.tsx` (remove console.logs)
- Modify: All files with debug console.log

**Step 1: Install DOMPurify if not present**

Run: `npm install dompurify && npm install -D @types/dompurify`

**Step 2: Sanitize HTML in QuestionRenderer**

In QuestionRenderer.tsx, import DOMPurify and sanitize all HTML content before rendering.

```typescript
import DOMPurify from 'dompurify'

// Before rendering HTML content, sanitize it:
const sanitized = DOMPurify.sanitize(content)
```

**Step 3: Mask API keys in admin integrations**

Find the admin integrations page that shows Panda Video key. Use `type="password"` on the input and show only last 4 chars.

**Step 4: Remove debug console.logs**

Search for and remove all `console.log` in `auth-provider.tsx` and other production files. Keep `console.error` for actual error handling.

**Step 5: Commit**

```bash
git add -A
git commit -m "security: sanitize HTML, mask API keys, remove debug logs"
```

---

## PHASE 3: CODE CLEANUP

### Task 7: Delete unused files

**Files to DELETE:**
- `src/services/quizAttemptService.ts` (282 lines - duplicated in quizService.ts)
- `src/lib/auth-utils.ts` (37 lines - never imported)
- `src/lib/course-data.ts` (113 lines - mock data, never imported)
- `src/lib/dashboard-data.ts` (87 lines - mock data, never imported)
- `src/lib/data.ts` (150 lines - mock data, never imported)

**Step 1: Verify no imports exist**

Search for imports of each file. If any import exists, do NOT delete.

**Step 2: Delete files**

```bash
rm src/services/quizAttemptService.ts
rm src/lib/auth-utils.ts
rm src/lib/course-data.ts
rm src/lib/dashboard-data.ts
rm src/lib/data.ts
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add -A
git commit -m "cleanup: remove 5 unused files (669 lines of dead code)"
```

---

### Task 8: Delete unused UI components

**Files to DELETE (17 shadcn components with zero imports):**
- `src/components/ui/aspect-ratio.tsx`
- `src/components/ui/bauhaus-card-official.tsx`
- `src/components/ui/chronicle-button.tsx`
- `src/components/ui/chronicle-button-official.tsx`
- `src/components/ui/command.tsx`
- `src/components/ui/context-menu.tsx`
- `src/components/ui/hover-card.tsx`
- `src/components/ui/input-otp.tsx`
- `src/components/ui/menubar.tsx`
- `src/components/ui/modern-button.tsx`
- `src/components/ui/modern-card.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/pagination.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/toggle-group.tsx`
- `src/components/ui/visual-effects.tsx`

**Step 1: Verify each has zero imports**

For each file, grep for its export name across the codebase. Only delete if truly unused.

**Step 2: Delete confirmed unused files**

**Step 3: Check for unused npm dependencies**

After removing components, check if any npm packages are now unused (e.g., `input-otp`, `cmdk`).
Remove with: `npm uninstall <package>`

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add -A
git commit -m "cleanup: remove 17 unused UI components (~2500 lines)"
```

---

### Task 9: Replace mock data in pages

**Files:**
- Modify: `src/pages/Progress.tsx` - Replace hardcoded 78% progress, 12/18 courses, 145h with real data from services
- Modify: `src/pages/admin/reports/AdminReportsPage.tsx` - Replace 1,234 users, 89 courses with real Supabase counts
- Modify: Admin courses page - Replace "1,247 Estudantes" and "4.8 Avaliacao" with real data

**Step 1: For each page, identify mock values**

**Step 2: Replace with real service calls**

Use existing services (adminStatsService, courseService, etc.) to fetch real data.

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: replace mock data with real service calls in Progress, Reports, Courses"
```

---

## PHASE 4: DATABASE CLEANUP

### Task 10: Remove unused tables

**Tables to DROP (12 - never queried in services):**

```sql
-- Group study features (never implemented in UI)
DROP TABLE IF EXISTS group_session_participants CASCADE;
DROP TABLE IF EXISTS group_study_sessions CASCADE;

-- Flashcard collaboration features (never implemented in UI)
DROP TABLE IF EXISTS flashcard_set_collaborators CASCADE;
DROP TABLE IF EXISTS flashcard_sets CASCADE;
DROP TABLE IF EXISTS flashcard_flashcard_tags CASCADE;
DROP TABLE IF EXISTS flashcard_flashcard_categories CASCADE;
DROP TABLE IF EXISTS flashcard_tags CASCADE;
DROP TABLE IF EXISTS flashcard_categories CASCADE;

-- User favorites (never queried)
DROP TABLE IF EXISTS user_favorite_flashcards CASCADE;

-- Redundant tables
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS class_topics CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
```

**Step 1: Create migration file**

Create: `supabase/migrations/20260308000000_cleanup_unused_tables.sql`

**Step 2: Run via Supabase CLI or dashboard**

Apply migration to the remote database.

**Step 3: Commit**

```bash
git add supabase/migrations/20260308000000_cleanup_unused_tables.sql
git commit -m "db: drop 12 unused tables (group study, flashcard collab, etc)"
```

---

### Task 11: Remove unused RPC functions and disabled trigger

**Functions to DROP:**

```sql
-- Unused RPC functions
DROP FUNCTION IF EXISTS calculate_quiz_result CASCADE;
DROP FUNCTION IF EXISTS validate_answer_sheet CASCADE;
DROP FUNCTION IF EXISTS get_achievement_unlock_count CASCADE;
DROP FUNCTION IF EXISTS cleanup_orphaned_users CASCADE;
DROP FUNCTION IF EXISTS auto_assign_student_to_tasting_class CASCADE;

-- Disabled trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_tasting_class ON auth.users;
```

**Step 1: Create migration file**

Create: `supabase/migrations/20260308000001_cleanup_unused_functions.sql`

**Step 2: Apply migration**

**Step 3: Commit**

```bash
git add supabase/migrations/20260308000001_cleanup_unused_functions.sql
git commit -m "db: drop 5 unused RPC functions and disabled trigger"
```

---

### Task 12: Regenerate Supabase types

After DB cleanup, regenerate the TypeScript types to match the cleaned database.

**Step 1: Regenerate types**

```bash
npx supabase gen types typescript --project-id hnhzindsfuqnaxosujay > src/lib/supabase/types.ts
```

**Step 2: Fix any TypeScript errors**

If any code references deleted tables/types, update those references.

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "db: regenerate types after cleanup"
```

---

## PHASE 5: MEMBERKIT IMPORT + STUDENT COURSE PAGES

### Task 13: Create MemberKit import service

**Files:**
- Create: `src/services/memberkitImportService.ts`

**Step 1: Build the import service**

Service that fetches from MemberKit API and inserts into Everest Supabase.

MemberKit API endpoints used:
- GET /api/v1/courses/{id}?api_key=KEY -> sections + lessons
- GET /api/v1/lessons/{id}?api_key=KEY -> video UID, content, attachments
- GET /api/v1/classrooms?api_key=KEY -> turmas
- GET /api/v1/users?api_key=KEY -> users
- GET /api/v1/memberships?api_key=KEY -> enrollments

Panda Video API:
- GET /videos?page=N&limit=50 with Authorization header -> get video_player URLs

Functions to implement:
- importCourse(courseId: number) -> creates video_course, video_modules, video_lessons
- importUsers(classroomId: number) -> creates auth users + profiles + enrollments
- matchPandaVideos(lessonUid: string) -> finds video_player URL from Panda API

Key mapping:
- MemberKit course -> video_courses (name, description, thumbnail)
- MemberKit section -> video_modules (name, order_index)
- MemberKit lesson -> video_lessons (title, video_source_type='panda_video', video_source_id=panda_uid)
- MemberKit lesson.files -> lesson_attachments
- MemberKit classroom -> classes
- MemberKit user -> auth.users + public.users (password: Everest@2026)
- MemberKit membership -> student_classes

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/services/memberkitImportService.ts
git commit -m "feat: add MemberKit import service"
```

---

### Task 14: Create admin import page

**Files:**
- Create: `src/pages/admin/import/AdminMemberkitImportPage.tsx`
- Modify: Router to add route

**Step 1: Build admin page**

Simple page with:
- Input for MemberKit API key
- Input for Panda Video API key
- Button "Importar Curso EAOF 2027"
- Progress log showing import steps
- Results summary (courses, modules, lessons, users imported)

**Step 2: Add route**

Add lazy route in App.tsx: `/admin/import/memberkit`

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/pages/admin/import/AdminMemberkitImportPage.tsx src/App.tsx
git commit -m "feat: add admin MemberKit import page"
```

---

### Task 15: Build student "Meus Cursos" page

**Files:**
- Create: `src/pages/courses/MyCoursesPage.tsx`
- Modify: Router + sidebar navigation

**Step 1: Build the page**

Layout (based on reference screenshots, simplified - no tracks):
- Header: "Meus Cursos" + subtitle
- Grid of course cards, each showing:
  - Course thumbnail
  - Course name
  - Number of modules + lessons
  - Progress bar (X/Y aulas, Z%)
  - "Continuar curso" button
- Only shows courses the student is enrolled in (via student_classes -> class_courses -> video_courses)

**Step 2: Add route and navigation**

Route: `/courses` (student)
Add to sidebar navigation for student role.

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/pages/courses/MyCoursesPage.tsx src/App.tsx
git commit -m "feat: add student Meus Cursos page"
```

---

### Task 16: Build student course detail page (modules list)

**Files:**
- Create: `src/pages/courses/CourseDetailPage.tsx`

**Step 1: Build the page**

Route: `/courses/:courseId`

Layout:
- Back button to /courses
- Course name + description
- Accordion/collapsible sections for each module
- Each module shows its lessons with:
  - Lesson title
  - Duration (formatted)
  - Checkmark if completed
  - Click to go to lesson player

**Step 2: Add route**

**Step 3: Verify build and commit**

```bash
git add src/pages/courses/CourseDetailPage.tsx src/App.tsx
git commit -m "feat: add student course detail page with modules"
```

---

### Task 17: Build student lesson player page

**Files:**
- Create: `src/pages/courses/LessonPlayerPage.tsx`

**Step 1: Build the page**

Route: `/courses/:courseId/lessons/:lessonId`

Layout (based on reference screenshots):

**Top bar:** Back arrow + Course name

**Left side (70%):** Panda Video player iframe using the video_source_id:
- Player URL format: `https://player-vz-e9d62059-4a4.tv.pandavideo.com.br/embed/?v={video_source_id}`
- Allow: accelerometer, gyroscope, autoplay, encrypted-media, picture-in-picture
- Allowfullscreen enabled

**Right sidebar (30%):** "Conteudo do Curso" - scrollable lesson list with:
- Module grouping (collapsible)
- Lesson title + duration
- Green checkmark for completed
- Active lesson highlighted
- Click to navigate between lessons

**Below video:**
- Lesson title (h2)
- Lesson description/content (sanitized HTML using DOMPurify)
- "Marcar como Concluida" button (green, toggles video_progress)
- "Comentarios" section (expandable)
- "Recursos" section (lesson_attachments list with download links)

**Step 2: Implement video progress tracking**

Use courseService.ts existing functions or create new ones:
- Mark lesson as completed -> upsert video_progress
- Track current playback position (optional, via Panda Player API events)

**Step 3: Verify build and commit**

```bash
git add src/pages/courses/LessonPlayerPage.tsx
git commit -m "feat: add student lesson player with Panda Video embed"
```

---

### Task 18: Run MemberKit import for EAOF 2027

**Step 1: Execute import via admin page**

Use the admin import page to import:
- Course: Extensivo EAOF 2027 (ID: 274441) -> 20 sections, 280+ lessons
- Match Panda Video UIDs to video_player URLs
- Classroom: "Turma A" (latest, 4 users)
- 4 students with password: Everest@2026
- Enroll students in the class

**Step 2: Verify in admin panel**

Check that course appears in admin courses page with all modules and lessons.

**Step 3: Verify as student**

Login as one of the 4 imported students. Should see:
- "Meus Cursos" with Extensivo EAOF 2027
- Click course -> see modules and lessons
- Click lesson -> video plays, can mark as completed

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "feat: import Extensivo EAOF 2027 with 4 students"
```

---

## SUMMARY

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-5 | Fix 5 critical bugs (teacher login, hooks, forum, auth, spinner) |
| 2 | 6 | Security fixes (sanitize HTML, mask keys, remove logs) |
| 3 | 7-9 | Code cleanup (delete unused files, components, replace mocks) |
| 4 | 10-12 | DB cleanup (drop 12 tables, 5 functions, regenerate types) |
| 5 | 13-18 | MemberKit import + student course pages |

**Estimated removals:**
- ~3,169 lines of dead code
- ~17 unused UI components
- 12 unused database tables
- 5 unused RPC functions
- 1 disabled trigger

## API KEYS REFERENCE

- MemberKit API: `3cG57cb4CAgAKMX7Fg59qY8f`
- Panda Video API: `panda-33e2092c0e0334f9a6b353db3ce0ccf89d46dbe076b0aaabd3a88ac1a4ecfd6d`
- Panda Video Library ID: `a747d22e-bc6f-4563-96c6-711ec74f9ae5`
- Panda Video Player Base: `https://player-vz-e9d62059-4a4.tv.pandavideo.com.br/embed/?v=`
- Supabase Project: `hnhzindsfuqnaxosujay`
- MemberKit Course ID (EAOF 2027): `274441`
- Allowed domain: `app.everestpreparatorios.com.br` (already configured in Panda)
