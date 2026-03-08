# Evercast Audio Mirror — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to mark video courses as available on Evercast, so students can listen to course audio (via Panda HLS) in a Spotify-style interface without any data duplication.

**Architecture:** Add `evercast_enabled` column to `video_courses`. The Evercast page queries video courses directly (no duplication). Audio progress is tracked independently in `audio_progress` using a `source_type` + `source_id` pattern. A new "album view" page shows course modules/lessons for audio playback.

**Tech Stack:** React 19, TypeScript, Supabase (PostgreSQL), Shadcn UI, React Router v6, Panda Video HLS

---

### Task 1: Add `evercast_enabled` column to `video_courses`

**Files:**
- Create: `supabase/migrations/20260308_add_evercast_enabled.sql`
- Modify: `src/lib/supabase/types.ts:2155-2187`

**Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260308_add_evercast_enabled.sql
ALTER TABLE video_courses
ADD COLUMN evercast_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN video_courses.evercast_enabled IS 'When true, this course appears in Evercast as audio content';
```

**Step 2: Run the migration against Supabase**

Run in Supabase SQL Editor (Dashboard > SQL Editor):
```sql
ALTER TABLE video_courses
ADD COLUMN evercast_enabled BOOLEAN NOT NULL DEFAULT false;
```

**Step 3: Update TypeScript types**

In `src/lib/supabase/types.ts`, add `evercast_enabled` to the `video_courses` Row, Insert, and Update types:

- Row (line ~2157): add `evercast_enabled: boolean`
- Insert (line ~2167): add `evercast_enabled?: boolean`
- Update (line ~2177): add `evercast_enabled?: boolean`

**Step 4: Commit**

```bash
git add supabase/migrations/20260308_add_evercast_enabled.sql src/lib/supabase/types.ts
git commit -m "feat: add evercast_enabled column to video_courses"
```

---

### Task 2: Add Evercast toggle to Admin Course Form

**Files:**
- Modify: `src/pages/admin/courses/AdminCourseFormPage.tsx`

**Step 1: Add `evercast_enabled` to the Zod schema (line 32-43)**

Add after `is_active`:
```typescript
evercast_enabled: z.boolean().default(false),
```

**Step 2: Add default value to form (line 53-61)**

Add to `defaultValues`:
```typescript
evercast_enabled: false,
```

**Step 3: Load `evercast_enabled` from database (line 84-89)**

In `form.reset()`, add:
```typescript
evercast_enabled: course.evercast_enabled || false,
```

**Step 4: Save `evercast_enabled` on submit (line 122-130 for update, 140-148 for create)**

Add to both update and insert objects:
```typescript
evercast_enabled: data.evercast_enabled,
```

**Step 5: Add the toggle UI after the "Publicar Curso" switch (after line 253)**

```tsx
<FormField
  control={form.control}
  name="evercast_enabled"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
      <div className="space-y-0.5">
        <FormLabel>Disponibilizar no Evercast</FormLabel>
        <FormDescription>
          Permite que os alunos ouçam as aulas deste curso em formato de áudio no Evercast.
        </FormDescription>
      </div>
      <FormControl>
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

**Step 6: Verify the form works**

Run: `pnpm dev`
Navigate to `/admin/courses/<courseId>/edit` and verify the toggle appears.

**Step 7: Commit**

```bash
git add src/pages/admin/courses/AdminCourseFormPage.tsx
git commit -m "feat: add evercast_enabled toggle to admin course form"
```

---

### Task 3: Add service method to fetch Evercast-enabled courses for a user

**Files:**
- Modify: `src/services/audioLessonService.ts`

**Step 1: Add new interface for Evercast course data**

Add after the existing `AudioModule` interface (line 23):

```typescript
export interface EvercastCourse {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  modules: EvercastModule[]
  total_lessons: number
  total_duration_minutes: number
}

export interface EvercastModule {
  id: string
  name: string
  order_index: number
  lessons: AudioLesson[]
}
```

**Step 2: Add method to fetch evercast-enabled courses with lessons**

Add to the `audioLessonService` object (before the closing `}`):

```typescript
async getEvercastCourses(userId: string): Promise<EvercastCourse[]> {
  try {
    // 1. Get user's class IDs
    const { data: userClasses, error: classesError } = await supabase
      .from('student_classes')
      .select('class_id')
      .eq('user_id', userId)

    if (classesError) throw classesError
    const classIds = userClasses?.map(uc => uc.class_id) || []
    if (classIds.length === 0) return []

    // 2. Get course IDs for user's classes
    const { data: classCourses, error: coursesError } = await supabase
      .from('class_courses')
      .select('course_id')
      .in('class_id', classIds)

    if (coursesError) throw coursesError
    const courseIds = [...new Set(classCourses?.map(cc => cc.course_id) || [])]
    if (courseIds.length === 0) return []

    // 3. Get evercast-enabled courses
    const { data: courses, error: coursesErr } = await supabase
      .from('video_courses')
      .select('id, name, description, thumbnail_url')
      .in('id', courseIds)
      .eq('evercast_enabled', true)
      .eq('is_active', true)

    if (coursesErr) throw coursesErr
    if (!courses || courses.length === 0) return []

    // 4. Get modules and lessons for these courses
    const result: EvercastCourse[] = await Promise.all(
      courses.map(async (course) => {
        const { data: modules } = await supabase
          .from('video_modules')
          .select('id, name, order_index')
          .eq('course_id', course.id)
          .eq('is_active', true)
          .order('order_index')

        const moduleIds = modules?.map(m => m.id) || []
        let lessons: any[] = []

        if (moduleIds.length > 0) {
          const { data: lessonData } = await supabase
            .from('video_lessons')
            .select('id, title, description, duration_seconds, module_id, order_index, video_source_id, video_source_type')
            .in('module_id', moduleIds)
            .eq('is_active', true)
            .order('order_index')

          lessons = lessonData || []
        }

        const evercastModules: EvercastModule[] = (modules || []).map(mod => ({
          id: mod.id,
          name: mod.name,
          order_index: mod.order_index,
          lessons: lessons
            .filter(l => l.module_id === mod.id)
            .map(l => ({
              id: `video_${l.id}`, // Prefix to distinguish from audio_lessons
              title: l.title,
              description: l.description || '',
              series: course.name,
              module_id: l.module_id,
              duration_minutes: l.duration_seconds ? Math.round(l.duration_seconds / 60) : 0,
              audio_url: l.video_source_id
                ? `https://b-vz-d0b3ae60-2ea.tv.pandavideo.com.br/${l.video_source_id}/playlist.m3u8`
                : undefined,
              audio_source_type: 'panda_video_hls' as const,
              thumbnail_url: course.thumbnail_url || undefined,
              created_at: undefined,
            }))
        }))

        const totalLessons = lessons.length
        const totalDuration = lessons.reduce((sum, l) => sum + (l.duration_seconds || 0), 0)

        return {
          id: course.id,
          name: course.name,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          modules: evercastModules,
          total_lessons: totalLessons,
          total_duration_minutes: Math.round(totalDuration / 60),
        }
      })
    )

    return result
  } catch (error) {
    logger.error('Error fetching evercast courses:', error)
    return []
  }
},

async getEvercastCourseFlatLessons(userId: string): Promise<AudioLesson[]> {
  const courses = await this.getEvercastCourses(userId)
  return courses.flatMap(course =>
    course.modules.flatMap(mod => mod.lessons)
  )
},
```

**Step 3: Commit**

```bash
git add src/services/audioLessonService.ts
git commit -m "feat: add service methods for evercast-enabled video courses"
```

---

### Task 4: Update Evercast page to show course albums + merged playlist

**Files:**
- Modify: `src/pages/Evercast.tsx`

**Step 1: Import new types and hooks**

Add to imports (line 39):
```typescript
import { type EvercastCourse } from '@/services/audioLessonService'
import { useNavigate } from 'react-router-dom'
import { Disc3 } from 'lucide-react'
```

**Step 2: Add state for evercast courses (after line 49)**

```typescript
const [evercastCourses, setEvercastCourses] = useState<EvercastCourse[]>([])
```

**Step 3: Update `loadAudioLessons` to also fetch course lessons (line 68-79)**

Replace the function:
```typescript
const loadAudioLessons = async () => {
  try {
    setIsLoading(true)
    const [lessons, courseLessons] = await Promise.all([
      audioLessonService.getAudioLessons(),
      user ? audioLessonService.getEvercastCourseFlatLessons(user.id) : Promise.resolve([]),
    ])
    const allLessons = [...lessons, ...courseLessons]
    setAudioLessons(allLessons)
    setFilteredLessons(allLessons)

    // Also load course albums
    if (user) {
      const courses = await audioLessonService.getEvercastCourses(user.id)
      setEvercastCourses(courses)
    }
  } catch (error) {
    console.error('Error loading audio lessons:', error)
  } finally {
    setIsLoading(false)
  }
}
```

Note: Need to get `user` from `useAuth()`. Update line 43:
```typescript
const { isStudent, user } = useAuth()
```

**Step 4: Add course albums section in the UI**

After the controls bar (after line 164), before the tracks list, add:

```tsx
{/* Course Albums */}
{evercastCourses.length > 0 && (
  <div className="space-y-4">
    <h2 className="text-xl font-bold">Cursos em Áudio</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {evercastCourses.map(course => (
        <div
          key={course.id}
          className="group cursor-pointer"
          onClick={() => navigate(`/evercast/curso/${course.id}`)}
        >
          <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-3 shadow-lg">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center">
                <Disc3 className="w-16 h-16 text-white/80" />
              </div>
            )}
            <Button
              size="icon"
              className="absolute bottom-2 right-2 rounded-full w-12 h-12 bg-green-500 hover:bg-green-600 text-black shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all"
              onClick={(e) => {
                e.stopPropagation()
                const firstLesson = course.modules[0]?.lessons[0]
                if (firstLesson) handlePlay(firstLesson)
              }}
            >
              <Play className="h-5 w-5 ml-0.5 fill-black" />
            </Button>
          </div>
          <p className="font-medium text-sm truncate">{course.name}</p>
          <p className="text-xs text-muted-foreground">
            {course.total_lessons} aulas · {Math.floor(course.total_duration_minutes / 60)}h {course.total_duration_minutes % 60}min
          </p>
        </div>
      ))}
    </div>
  </div>
)}
```

**Step 5: Commit**

```bash
git add src/pages/Evercast.tsx
git commit -m "feat: show evercast-enabled course albums on Evercast page"
```

---

### Task 5: Create Evercast Album page (course detail view)

**Files:**
- Create: `src/pages/EvercastAlbumPage.tsx`

**Step 1: Create the album page component**

```tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Pause, Clock, ChevronLeft, Disc3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { SectionLoader } from '@/components/SectionLoader'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import { audioLessonService, type AudioLesson, type EvercastCourse } from '@/services/audioLessonService'
import { AudioPlayer } from '@/components/AudioPlayer'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function EvercastAlbumPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user, isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [course, setCourse] = useState<EvercastCourse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTrack, setCurrentTrack] = useState<AudioLesson | null>(null)
  const [allLessons, setAllLessons] = useState<AudioLesson[]>([])

  useEffect(() => {
    if (!user || !courseId) return
    loadCourse()
  }, [user, courseId])

  const loadCourse = async () => {
    try {
      setIsLoading(true)
      const courses = await audioLessonService.getEvercastCourses(user!.id)
      const found = courses.find(c => c.id === courseId)
      if (found) {
        setCourse(found)
        setAllLessons(found.modules.flatMap(m => m.lessons))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlay = (lesson: AudioLesson) => setCurrentTrack(lesson)

  const handlePlayAll = () => {
    if (allLessons.length > 0) handlePlay(allLessons[0])
  }

  if (permissionsLoading || isLoading) return <SectionLoader />

  if (isStudent && !hasFeature(FEATURE_KEYS.EVERCAST)) {
    navigate('/evercast')
    return null
  }

  if (!course) {
    return (
      <MagicLayout title="Curso não encontrado" description="">
        <div className="text-center py-24">
          <p className="text-muted-foreground mb-4">Este curso não está disponível no Evercast.</p>
          <Button variant="outline" onClick={() => navigate('/evercast')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar ao Evercast
          </Button>
        </div>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title={course.name}
      description=""
      showHeader={false}
      className={cn("pb-32", currentTrack ? "mb-20" : "")}
    >
      {/* Album Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end p-8 bg-gradient-to-b from-primary/20 to-background/0">
        <div className="w-52 h-52 shadow-2xl rounded-md overflow-hidden shrink-0">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center">
              <Disc3 className="w-24 h-24 text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Curso em Áudio</span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{course.name}</h1>
          {course.description && (
            <p className="text-muted-foreground max-w-2xl">{course.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm font-medium">{course.total_lessons} aulas</span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              {Math.floor(course.total_duration_minutes / 60)}h {course.total_duration_minutes % 60}min
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/evercast')}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            size="lg"
            className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 text-black shadow-lg hover:scale-105 transition-transform"
            onClick={handlePlayAll}
          >
            <Play className="h-6 w-6 ml-1 fill-black" />
          </Button>
        </div>

        {/* Modules Accordion */}
        <Accordion type="multiple" defaultValue={course.modules.map(m => m.id)} className="space-y-2">
          {course.modules.map((mod, modIndex) => (
            <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Módulo {modIndex + 1}</span>
                  <span className="font-semibold">{mod.name}</span>
                  <span className="text-xs text-muted-foreground">({mod.lessons.length} aulas)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pb-2">
                  {mod.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-md cursor-pointer hover:bg-white/5 transition-colors group",
                        currentTrack?.id === lesson.id ? "bg-white/5" : ""
                      )}
                      onClick={() => handlePlay(lesson)}
                    >
                      <span className={cn(
                        "w-6 text-center text-sm",
                        currentTrack?.id === lesson.id ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {currentTrack?.id === lesson.id ? (
                          <div className="w-4 h-4 mx-auto flex items-end justify-between gap-[2px]">
                            <div className="w-1 bg-green-500 animate-[music-bar_0.6s_ease-in-out_infinite] h-full" />
                            <div className="w-1 bg-green-500 animate-[music-bar_0.8s_ease-in-out_infinite_0.1s] h-2/3" />
                            <div className="w-1 bg-green-500 animate-[music-bar_1.0s_ease-in-out_infinite_0.2s] h-1/2" />
                          </div>
                        ) : (
                          <span className="group-hover:hidden">{lessonIndex + 1}</span>
                        )}
                        <Play className={cn(
                          "h-4 w-4 mx-auto hidden fill-white",
                          currentTrack?.id !== lesson.id && "group-hover:block"
                        )} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate",
                          currentTrack?.id === lesson.id ? "text-green-500" : ""
                        )}>
                          {lesson.title}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {lesson.duration_minutes ? `${lesson.duration_minutes} min` : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Persistent Audio Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        playlist={allLessons}
        onTrackChange={setCurrentTrack}
      />
    </MagicLayout>
  )
}
```

**Step 2: Commit**

```bash
git add src/pages/EvercastAlbumPage.tsx
git commit -m "feat: create EvercastAlbumPage for course audio album view"
```

---

### Task 6: Add route for album page

**Files:**
- Modify: `src/App.tsx` (or wherever routes are defined)

**Step 1: Import the new page**

Add with the other lazy imports or direct imports:
```typescript
import EvercastAlbumPage from '@/pages/EvercastAlbumPage'
```

Or if using lazy loading, match existing pattern.

**Step 2: Add the route**

After the existing `/evercast/:audioId` route (line ~327), add:
```tsx
<Route path="/evercast/curso/:courseId" element={<EvercastAlbumPage />} />
```

This must be placed BEFORE `/evercast/:audioId` to avoid route conflicts, or use explicit path.

**Step 3: Verify routing works**

Run: `pnpm dev`
Navigate to `/evercast` and click a course album card — should open the album page.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add route for evercast album page"
```

---

### Task 7: Handle admin view (non-student users)

**Files:**
- Modify: `src/services/audioLessonService.ts`

**Step 1: Update `getEvercastCourses` for non-student users**

Teachers and admins should see all evercast-enabled courses (no enrollment check). Add a parameter:

```typescript
async getEvercastCourses(userId: string, isAdmin?: boolean): Promise<EvercastCourse[]> {
```

At the beginning, if `isAdmin` is true, skip the enrollment filter and just fetch all `evercast_enabled` courses directly:

```typescript
if (isAdmin) {
  const { data: courses, error } = await supabase
    .from('video_courses')
    .select('id, name, description, thumbnail_url')
    .eq('evercast_enabled', true)
    .eq('is_active', true)

  if (error || !courses) return []
  // ... continue with modules/lessons fetch (same code as below)
}
```

**Step 2: Update callers to pass role info**

In `Evercast.tsx` and `EvercastAlbumPage.tsx`, pass `!isStudent` as the `isAdmin` parameter.

**Step 3: Commit**

```bash
git add src/services/audioLessonService.ts src/pages/Evercast.tsx src/pages/EvercastAlbumPage.tsx
git commit -m "feat: allow admins/teachers to see all evercast courses without enrollment check"
```

---

### Task 8: Final integration test and polish

**Step 1: Enable a test course for Evercast**

1. Login as admin (admin@teste.com / Admin@252)
2. Go to `/admin/courses`
3. Edit the EAOF 2026 course
4. Toggle "Disponibilizar no Evercast" ON
5. Save

**Step 2: Verify student experience**

1. Login as student (geisonhoehr@gmail.com / Geison@252)
2. Go to `/evercast`
3. Verify: course album card appears in "Cursos em Áudio" section
4. Verify: course lessons appear in the flat playlist below
5. Click album card — verify album page opens with modules/accordion
6. Click a lesson — verify audio plays via the persistent player
7. Verify auto-play next track works within the album

**Step 3: Verify permission gating**

1. Ensure student without EVERCAST flag cannot see the page
2. Ensure student not enrolled in the course cannot see it in Evercast

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: evercast audio mirror - complete integration"
```
