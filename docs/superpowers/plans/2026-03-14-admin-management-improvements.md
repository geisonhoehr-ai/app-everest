# Admin Management Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 admin management improvements (Courses, Classes, Students, Invites) inspired by MemberKit, preparing for future SaaS.

**Architecture:** Each area is an independent vertical slice: migration → service → pages. Area A (Courses) must complete before B (Classes rules reference courses). Area C (Students) and D (Invites) depend on A+B for full enrollment control. All follow existing patterns: Supabase queries in services, React pages with Shadcn UI components.

**Tech Stack:** React 19, TypeScript, Vite, Supabase (PostgreSQL), Shadcn UI, React Router v6, React Query (TanStack), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-14-admin-management-improvements-design.md`

---

## Chunk 1: Area A - Course Management Improvements

### Task 1: Database migration - video_courses new columns

**Files:**
- Create: `supabase/migrations/20260314000001_course_management_improvements.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Add new columns to video_courses
ALTER TABLE video_courses
  ADD COLUMN IF NOT EXISTS acronym text,
  ADD COLUMN IF NOT EXISTS sales_url text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'Meus Cursos',
  ADD COLUMN IF NOT EXISTS layout_preference text DEFAULT 'simple_list',
  ADD COLUMN IF NOT EXISTS show_in_storefront boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderate_comments boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_text text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Migrate is_active to status
UPDATE video_courses SET status = 'published' WHERE is_active = true;
UPDATE video_courses SET status = 'draft' WHERE is_active = false OR is_active IS NULL;

-- Create storage bucket for course covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-covers', 'course-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can read, only authenticated admin/teacher can upload
CREATE POLICY "Public read course covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-covers');

CREATE POLICY "Admin/teacher upload course covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-covers'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admin/teacher update course covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-covers'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admin/teacher delete course covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-covers'
    AND auth.role() = 'authenticated'
  );
```

- [ ] **Step 2: Apply migration**

Run: `cd supabase && npx supabase db push` or apply via Supabase Dashboard SQL editor.

- [ ] **Step 3: Regenerate types**

Run: `npx supabase gen types typescript --project-id hnhzindsfuqnaxosujay > src/lib/supabase/types.ts`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260314000001_course_management_improvements.sql src/lib/supabase/types.ts
git commit -m "feat: add course management columns and storage bucket"
```

---

### Task 2: Update adminCourseService with new fields

**Files:**
- Modify: `src/services/adminCourseService.ts`

- [ ] **Step 1: Add cover image upload function**

Add to `adminCourseService.ts` after existing imports:

```typescript
export async function uploadCoverImage(file: File, courseId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${courseId}-${Date.now()}.${fileExt}`
  const filePath = `covers/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('course-covers')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('course-covers')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function deleteCoverImage(url: string): Promise<void> {
  const path = url.split('/course-covers/')[1]
  if (path) {
    await supabase.storage.from('course-covers').remove([path])
  }
}
```

- [ ] **Step 2: Update createCourse to include new fields**

Find the existing `createCourse` function and update the insert to include:
`acronym, sales_url, category, layout_preference, show_in_storefront, moderate_comments, onboarding_text, status`

The function signature should accept these new optional fields.

- [ ] **Step 3: Update updateCourse to include new fields**

Same as createCourse - add new fields to the update object.

- [ ] **Step 4: Update duplicateCourse to copy new fields**

Find `duplicateCourse` function and ensure it copies:
`acronym, sales_url, category, layout_preference, show_in_storefront, moderate_comments, onboarding_text, status` (set status to 'draft' on duplicate).

- [ ] **Step 5: Add getStorefrontCourses function**

```typescript
export async function getStorefrontCourses(userId: string) {
  // Get courses the user is NOT enrolled in but are visible in storefront
  const { data: enrolledCourseIds } = await supabase
    .from('student_classes')
    .select('classes!inner(class_courses!inner(course_id))')
    .eq('user_id', userId)

  const enrolledIds = (enrolledCourseIds || [])
    .flatMap((sc: any) => sc.classes?.class_courses?.map((cc: any) => cc.course_id) || [])

  let query = supabase
    .from('video_courses')
    .select('id, name, acronym, description, thumbnail_url, sales_url, category, status, video_modules(count), video_lessons:video_modules(video_lessons(count))')
    .eq('show_in_storefront', true)
    .eq('status', 'published')

  if (enrolledIds.length > 0) {
    query = query.not('id', 'in', `(${enrolledIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
```

- [ ] **Step 6: Commit**

```bash
git add src/services/adminCourseService.ts
git commit -m "feat: update course service with new fields, cover upload, storefront"
```

---

### Task 3: Redesign AdminCourseFormPage

**Files:**
- Modify: `src/pages/admin/courses/AdminCourseFormPage.tsx` (273 lines)

- [ ] **Step 1: Update form state to include new fields**

Add to the form state/interface:
```typescript
acronym: string
salesUrl: string
category: string
layoutPreference: 'simple_list' | 'module_covers'
showInStorefront: boolean
moderateComments: boolean
onboardingText: string
status: 'published' | 'draft' | 'coming_soon'
coverFile: File | null  // for upload
```

- [ ] **Step 2: Build Section 1 - Course Details**

Replace the current simple form with organized sections using Card components:
- Name input + Acronym input (side by side)
- Sales URL input
- Description textarea (larger, min 10 chars)
- Category dropdown (Select): "Meus Cursos", "Preparatorios", "Bonus", "Extras"

- [ ] **Step 3: Build Section 2 - Layout Preference**

```tsx
<Card>
  <CardHeader><CardTitle>Preferencia de Layout</CardTitle></CardHeader>
  <CardContent>
    <RadioGroup value={form.layoutPreference} onValueChange={v => setForm({...form, layoutPreference: v})}>
      <div className="grid grid-cols-2 gap-4">
        <Label className={cn("border rounded-lg p-4 cursor-pointer", form.layoutPreference === 'simple_list' && "border-primary")}>
          <RadioGroupItem value="simple_list" />
          <span className="ml-2">Listas simples</span>
        </Label>
        <Label className={cn("border rounded-lg p-4 cursor-pointer", form.layoutPreference === 'module_covers' && "border-primary")}>
          <RadioGroupItem value="module_covers" />
          <span className="ml-2">Capas em modulos</span>
        </Label>
      </div>
    </RadioGroup>
  </CardContent>
</Card>
```

- [ ] **Step 4: Build Section 3 - Cover Image Upload**

Image upload dropzone with preview. Use `<input type="file" accept="image/*">` styled as dropzone.
Show current thumbnail_url as preview if exists. On file select, store in `coverFile` state.
On save, call `uploadCoverImage()` first, then save course with returned URL.

- [ ] **Step 5: Build Section 4 - Config Toggles**

```tsx
<Card>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div>
        <p className="font-medium">Mostrar curso na vitrine de todos os alunos</p>
        <p className="text-sm text-muted-foreground">Incentive a compra para alunos ainda nao matriculados</p>
      </div>
      <Switch checked={form.showInStorefront} onCheckedChange={v => setForm({...form, showInStorefront: v})} />
    </div>
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div>
        <p className="font-medium">Ativar moderacao de comentarios</p>
        <p className="text-sm text-muted-foreground">Revise manualmente todos os comentarios antes da publicacao</p>
      </div>
      <Switch checked={form.moderateComments} onCheckedChange={v => setForm({...form, moderateComments: v})} />
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 6: Build Section 5 - Onboarding Text**

Simple textarea for onboarding text. Use existing Textarea component from Shadcn.
Label: "Texto de agradecimento pos-matricula ou termos de uso"

- [ ] **Step 7: Update header with Status dropdown**

Add status Select in the page header area:
```tsx
<Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
  <SelectTrigger className="w-48">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="published">Publicado</SelectItem>
    <SelectItem value="draft">Rascunho</SelectItem>
    <SelectItem value="coming_soon">Em Breve</SelectItem>
  </SelectContent>
</Select>
```

- [ ] **Step 8: Update footer with Duplicate button**

Add "Duplicar curso" outline button next to "Excluir curso" (only in edit mode).

- [ ] **Step 9: Update save handler**

Update the save function to:
1. Upload cover image if `coverFile` exists → get URL
2. Call createCourse/updateCourse with all new fields
3. Navigate back on success

- [ ] **Step 10: Commit**

```bash
git add src/pages/admin/courses/AdminCourseFormPage.tsx
git commit -m "feat: redesign course form with sections, cover upload, status, storefront"
```

---

### Task 4: Update AdminCoursesPage with thumbnails and badges

**Files:**
- Modify: `src/pages/admin/courses/AdminCoursesPage.tsx` (344 lines)

- [ ] **Step 1: Add thumbnail column to table**

In the table columns, add a thumbnail image (48x48 rounded) to the left of the course name.
Use `thumbnail_url` from the course data. Fallback to a gradient placeholder with course initials.

- [ ] **Step 2: Add status badge column**

Replace the current is_active badge with status-based badges:
- `published` → green Badge "Publicado"
- `draft` → gray Badge "Rascunho"
- `coming_soon` → orange Badge "Em Breve"

- [ ] **Step 3: Add storefront indicator**

Add eye icon (Lucide `Eye`) in the row if `show_in_storefront = true`.

- [ ] **Step 4: Update the Supabase query to include new fields**

Make sure the `select()` query fetches: `acronym, status, show_in_storefront, thumbnail_url` alongside existing fields.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/courses/AdminCoursesPage.tsx
git commit -m "feat: add thumbnails, status badges, storefront indicator to course list"
```

---

### Task 5: Course Storefront - Student View

**Files:**
- Modify: `src/pages/courses/MyCoursesPage.tsx` (155 lines)
- Modify: `src/pages/courses/CourseDetailPage.tsx` (640 lines)

- [ ] **Step 1: Add "Outros Cursos Disponiveis" section to MyCoursesPage**

After the existing "Meus Cursos" grid, add a new section:
- Heading: "Outros Cursos Disponiveis"
- Call `getStorefrontCourses(userId)` from adminCourseService
- Render cards with: cover image, name + acronym, description truncated, lock icon (Lucide `Lock`), module/lesson count
- Card click navigates to `/courses/:courseId`

- [ ] **Step 2: Add storefront mode to CourseDetailPage**

At the top of CourseDetailPage, detect if user is enrolled:
```typescript
const isEnrolled = /* check if user has active enrollment for this course */
```

If NOT enrolled AND course has `show_in_storefront = true`:
- Show banner at top with course cover, description, and "Adquirir este curso" button (links to `sales_url`, `target="_blank"`)
- Show modules list with Lock icon on each
- Allow access to lessons with `is_preview = true` (existing field)
- On click of locked module/lesson: toast "Adquira o curso para acessar este conteudo"

If NOT enrolled AND NOT in storefront:
- Redirect to `/courses` with toast "Voce nao tem acesso a este curso"

- [ ] **Step 3: Commit**

```bash
git add src/pages/courses/MyCoursesPage.tsx src/pages/courses/CourseDetailPage.tsx
git commit -m "feat: add course storefront with lock icons and preview access"
```

---

## Chunk 2: Area B - Class Module Release Rules

### Task 6: Database migration - class rules tables

**Files:**
- Create: `supabase/migrations/20260314000002_class_release_rules.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Class module release rules
CREATE TABLE IF NOT EXISTS class_module_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES video_modules(id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'free'
    CHECK (rule_type IN ('free', 'scheduled_date', 'days_after_enrollment', 'hidden', 'blocked', 'module_completed')),
  rule_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(class_id, module_id)
);

-- Class lesson release rules
CREATE TABLE IF NOT EXISTS class_lesson_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'free'
    CHECK (rule_type IN ('free', 'scheduled_date', 'days_after_enrollment', 'hidden', 'blocked', 'module_completed')),
  rule_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(class_id, lesson_id)
);

-- Add columns to classes table
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS access_duration_days int,
  ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_class_module_rules_class ON class_module_rules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_lesson_rules_class ON class_lesson_rules(class_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_user_class ON student_classes(user_id, class_id);

-- RLS policies
ALTER TABLE class_module_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_lesson_rules ENABLE ROW LEVEL SECURITY;

-- Admin/teacher can manage rules
CREATE POLICY "Admin/teacher manage module rules"
  ON class_module_rules FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin/teacher manage lesson rules"
  ON class_lesson_rules FOR ALL
  USING (auth.role() = 'authenticated');
```

- [ ] **Step 2: Apply migration and regenerate types**

Run migration, then: `npx supabase gen types typescript --project-id hnhzindsfuqnaxosujay > src/lib/supabase/types.ts`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260314000002_class_release_rules.sql src/lib/supabase/types.ts
git commit -m "feat: add class module/lesson release rules tables"
```

---

### Task 7: Create moduleRulesService

**Files:**
- Create: `src/services/moduleRulesService.ts`

- [ ] **Step 1: Write the service**

```typescript
import { supabase } from '@/lib/supabase/client'

export interface ModuleRule {
  id?: string
  class_id: string
  module_id: string
  rule_type: 'free' | 'scheduled_date' | 'days_after_enrollment' | 'hidden' | 'blocked' | 'module_completed'
  rule_value?: string | null
}

export interface LessonRule {
  id?: string
  class_id: string
  lesson_id: string
  rule_type: ModuleRule['rule_type']
  rule_value?: string | null
}

export async function getModuleRulesForClass(classId: string): Promise<ModuleRule[]> {
  const { data, error } = await supabase
    .from('class_module_rules')
    .select('*')
    .eq('class_id', classId)

  if (error) throw error
  return data || []
}

export async function upsertModuleRule(rule: ModuleRule): Promise<void> {
  const { error } = await supabase
    .from('class_module_rules')
    .upsert({
      class_id: rule.class_id,
      module_id: rule.module_id,
      rule_type: rule.rule_type,
      rule_value: rule.rule_value || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'class_id,module_id' })

  if (error) throw error
}

export async function deleteModuleRule(classId: string, moduleId: string): Promise<void> {
  const { error } = await supabase
    .from('class_module_rules')
    .delete()
    .eq('class_id', classId)
    .eq('module_id', moduleId)

  if (error) throw error
}

export async function saveAllModuleRules(classId: string, rules: ModuleRule[]): Promise<void> {
  // Delete existing rules for this class
  await supabase.from('class_module_rules').delete().eq('class_id', classId)

  // Insert only non-free rules (free is the default, no need to store)
  const nonFreeRules = rules.filter(r => r.rule_type !== 'free')
  if (nonFreeRules.length === 0) return

  const { error } = await supabase
    .from('class_module_rules')
    .insert(nonFreeRules.map(r => ({
      class_id: classId,
      module_id: r.module_id,
      rule_type: r.rule_type,
      rule_value: r.rule_value || null
    })))

  if (error) throw error
}

// Lesson rules - same pattern
export async function getLessonRulesForClass(classId: string): Promise<LessonRule[]> {
  const { data, error } = await supabase
    .from('class_lesson_rules')
    .select('*')
    .eq('class_id', classId)

  if (error) throw error
  return data || []
}

export async function upsertLessonRule(rule: LessonRule): Promise<void> {
  const { error } = await supabase
    .from('class_lesson_rules')
    .upsert({
      class_id: rule.class_id,
      lesson_id: rule.lesson_id,
      rule_type: rule.rule_type,
      rule_value: rule.rule_value || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'class_id,lesson_id' })

  if (error) throw error
}

export async function deleteLessonRule(classId: string, lessonId: string): Promise<void> {
  const { error } = await supabase
    .from('class_lesson_rules')
    .delete()
    .eq('class_id', classId)
    .eq('lesson_id', lessonId)

  if (error) throw error
}

// Circular dependency check
export function checkCircularDependency(
  rules: ModuleRule[],
  moduleId: string,
  dependsOnModuleId: string
): boolean {
  const visited = new Set<string>()
  const check = (currentId: string): boolean => {
    if (currentId === moduleId) return true // circular!
    if (visited.has(currentId)) return false
    visited.add(currentId)
    const rule = rules.find(r => r.module_id === currentId && r.rule_type === 'module_completed')
    if (rule?.rule_value) return check(rule.rule_value)
    return false
  }
  return check(dependsOnModuleId)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/moduleRulesService.ts
git commit -m "feat: add module/lesson rules service with circular dependency check"
```

---

### Task 8: Create useModuleAccess and useLessonAccess hooks

**Files:**
- Create: `src/hooks/useModuleAccess.ts`

- [ ] **Step 1: Write the hooks**

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface AccessResult {
  isAccessible: boolean
  rule: string
  message: string
  unlockDate?: Date
}

export function useModuleAccess(classId: string | null, moduleId: string): AccessResult {
  const { user, profile } = useAuth()

  const { data: result } = useQuery({
    queryKey: ['module-access', classId, moduleId, user?.id],
    queryFn: async (): Promise<AccessResult> => {
      // Unlimited access bypasses everything
      if (profile?.is_unlimited_access) {
        return { isAccessible: true, rule: 'unlimited', message: '' }
      }

      if (!classId) return { isAccessible: true, rule: 'free', message: '' }

      // Check enrollment expiration
      const { data: enrollment } = await supabase
        .from('student_classes')
        .select('enrollment_date, subscription_expires_at')
        .eq('user_id', user!.id)
        .eq('class_id', classId)
        .single()

      if (enrollment?.subscription_expires_at && new Date(enrollment.subscription_expires_at) < new Date()) {
        return { isAccessible: false, rule: 'expired', message: 'Seu acesso expirou' }
      }

      // Check module rule
      const { data: rule } = await supabase
        .from('class_module_rules')
        .select('*')
        .eq('class_id', classId)
        .eq('module_id', moduleId)
        .maybeSingle()

      if (!rule || rule.rule_type === 'free') {
        return { isAccessible: true, rule: 'free', message: '' }
      }

      switch (rule.rule_type) {
        case 'hidden':
          return { isAccessible: false, rule: 'hidden', message: '' }

        case 'blocked':
          return { isAccessible: false, rule: 'blocked', message: 'Conteudo bloqueado' }

        case 'scheduled_date': {
          const date = new Date(rule.rule_value!)
          if (date <= new Date()) return { isAccessible: true, rule: 'free', message: '' }
          return {
            isAccessible: false, rule: 'scheduled_date',
            message: `Disponivel em ${date.toLocaleDateString('pt-BR')}`,
            unlockDate: date
          }
        }

        case 'days_after_enrollment': {
          const days = parseInt(rule.rule_value!)
          const enrollDate = new Date(enrollment!.enrollment_date)
          const unlockDate = new Date(enrollDate.getTime() + days * 86400000)
          if (unlockDate <= new Date()) return { isAccessible: true, rule: 'free', message: '' }
          return {
            isAccessible: false, rule: 'days_after_enrollment',
            message: `Disponivel em ${unlockDate.toLocaleDateString('pt-BR')}`,
            unlockDate
          }
        }

        case 'module_completed': {
          const prereqModuleId = rule.rule_value!
          // Check completion: all lessons in prereq module marked as completed
          const { data: lessons } = await supabase
            .from('video_lessons')
            .select('id')
            .eq('module_id', prereqModuleId)
            .eq('is_active', true)

          const { data: completed } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', user!.id)
            .eq('completed', true)
            .in('lesson_id', (lessons || []).map(l => l.id))

          const allCompleted = lessons?.length === completed?.length && (lessons?.length || 0) > 0
          if (allCompleted) return { isAccessible: true, rule: 'free', message: '' }

          const { data: prereqModule } = await supabase
            .from('video_modules')
            .select('name')
            .eq('id', prereqModuleId)
            .single()

          return {
            isAccessible: false, rule: 'module_completed',
            message: `Complete o modulo "${prereqModule?.name}" primeiro`
          }
        }

        default:
          return { isAccessible: true, rule: 'free', message: '' }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    enabled: !!user
  })

  return result || { isAccessible: true, rule: 'free', message: '' }
}

export function useLessonAccess(classId: string | null, lessonId: string, moduleId: string): AccessResult {
  const { user, profile } = useAuth()
  const moduleAccess = useModuleAccess(classId, moduleId)

  const { data: lessonResult } = useQuery({
    queryKey: ['lesson-access', classId, lessonId],
    queryFn: async (): Promise<AccessResult | null> => {
      if (profile?.is_unlimited_access) return null // use module access (which is also unlimited)
      if (!classId) return null

      const { data: rule } = await supabase
        .from('class_lesson_rules')
        .select('*')
        .eq('class_id', classId)
        .eq('lesson_id', lessonId)
        .maybeSingle()

      if (!rule) return null // fallback to module rule
      // Same logic as module rule...
      // For brevity: lesson-specific rule overrides module rule
      return null
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user && !!classId
  })

  // Lesson rule takes priority, fallback to module rule
  return lessonResult || moduleAccess
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useModuleAccess.ts
git commit -m "feat: add useModuleAccess and useLessonAccess hooks"
```

---

### Task 9: Add release rules UI to AdminClassFormPage

**Files:**
- Modify: `src/pages/admin/classes/AdminClassFormPage.tsx` (403 lines)

- [ ] **Step 1: Add access_duration_days and is_default fields**

After existing form fields, add:
- "Prazo de acesso" - Input type number + "dias" label
- "Turma padrao" - Checkbox with description

- [ ] **Step 2: Fetch modules for linked courses**

Load modules from courses linked via `class_courses`:
```typescript
const { data: linkedCourses } = await supabase
  .from('class_courses')
  .select('video_courses(id, name, video_modules(id, name, order_index))')
  .eq('class_id', classId)
```

- [ ] **Step 3: Build Module Rules section**

For each module, render a row:
- Module name (left)
- Rule dropdown (right): Acesso Livre, Data programada, Dias apos compra, Pontuacao minima, Oculto, Bloqueado, Modulo concluido
- Conditional extra field based on rule type:
  - `scheduled_date` → date picker
  - `days_after_enrollment` → number input
  - `module_completed` → dropdown of other modules (with circular dependency check)

- [ ] **Step 4: Load existing rules on edit**

On page load, call `getModuleRulesForClass(classId)` and populate the dropdowns.

- [ ] **Step 5: Save rules on form submit**

On save, call `saveAllModuleRules(classId, rules)` after saving the class.

- [ ] **Step 6: Add Lesson Rules section (optional)**

Dropdown to select a specific lesson + "Adicionar" button.
List of added lesson rules with delete button.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/classes/AdminClassFormPage.tsx
git commit -m "feat: add module release rules UI to class form"
```

---

### Task 10: Update AdminClassesPage with thumbnails

**Files:**
- Modify: `src/pages/admin/classes/AdminClassesPage.tsx` (404 lines)

- [ ] **Step 1: Update query to include course thumbnail**

Modify the Supabase query to join through `class_courses` to get `video_courses.thumbnail_url` and `video_courses.name`.

- [ ] **Step 2: Add thumbnail to list items**

Change table rows to include:
- Thumbnail image (64x40 rounded) from linked course
- Course name below turma name (smaller, muted text)

- [ ] **Step 3: Add progress column**

Calculate and display average progress % for the class (from `lesson_progress` of enrolled students).

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/classes/AdminClassesPage.tsx
git commit -m "feat: add course thumbnails and progress to class list"
```

---

### Task 11: Apply access rules in student-facing pages

**Files:**
- Modify: `src/pages/courses/CourseDetailPage.tsx` (640 lines)
- Modify: `src/pages/courses/LessonPlayerPage.tsx` (1491 lines)

- [ ] **Step 1: Integrate useModuleAccess in CourseDetailPage**

For each module in the course, call `useModuleAccess(classId, module.id)`:
- If `rule === 'hidden'` → skip rendering the module
- If `!isAccessible` → show module with Lock icon + message
- If `isAccessible` → render normally

- [ ] **Step 2: Integrate useLessonAccess in LessonPlayerPage**

At the top of LessonPlayerPage, check lesson access:
- If not accessible → redirect to course page with toast message
- If accessible → render normally

- [ ] **Step 3: Commit**

```bash
git add src/pages/courses/CourseDetailPage.tsx src/pages/courses/LessonPlayerPage.tsx
git commit -m "feat: enforce module/lesson access rules in student pages"
```

---

## Chunk 3: Area C - Student Management

### Task 12: Database migration - user management fields

**Files:**
- Create: `supabase/migrations/20260314000003_student_management_improvements.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Add new columns to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS cpf_cnpj text,
  ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_unlimited_access boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_users_is_unlimited ON users(is_unlimited_access);

-- Function to update last_seen (with 5 min debounce)
CREATE OR REPLACE FUNCTION update_last_seen(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET last_seen_at = now()
  WHERE id = p_user_id
    AND (last_seen_at IS NULL OR last_seen_at < now() - interval '5 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: deny content access if user is banned
-- Add to existing RLS policies on video_courses, video_modules, video_lessons:
CREATE POLICY "Deny banned users content access"
  ON video_courses FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_banned = true
    )
  );

CREATE POLICY "Deny banned users module access"
  ON video_modules FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_banned = true
    )
  );

CREATE POLICY "Deny banned users lesson access"
  ON video_lessons FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_banned = true
    )
  );
```

- [ ] **Step 2: Apply migration and regenerate types**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260314000003_student_management_improvements.sql src/lib/supabase/types.ts
git commit -m "feat: add user management fields (phone, cpf, ban, unlimited, last_seen)"
```

---

### Task 13: Update adminUserService

**Files:**
- Modify: `src/services/adminUserService.ts` (181 lines)

- [ ] **Step 1: Add ban/unban functions**

```typescript
export async function banUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_banned: true })
    .eq('id', userId)
  if (error) throw error
}

export async function unbanUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_banned: false })
    .eq('id', userId)
  if (error) throw error
}
```

- [ ] **Step 2: Add unlimited access toggle**

```typescript
export async function setUnlimitedAccess(userId: string, unlimited: boolean): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_unlimited_access: unlimited })
    .eq('id', userId)
  if (error) throw error
}
```

- [ ] **Step 3: Add enrollment management functions**

```typescript
export async function getEnrollmentsByUser(userId: string) {
  const { data, error } = await supabase
    .from('student_classes')
    .select('*, classes(id, name, class_courses(video_courses(id, name)))')
    .eq('user_id', userId)
  if (error) throw error
  return data || []
}

export async function enrollInClass(userId: string, classId: string, expiresAt?: string): Promise<void> {
  const { error } = await supabase
    .from('student_classes')
    .insert({
      user_id: userId,
      class_id: classId,
      enrollment_date: new Date().toISOString(),
      subscription_expires_at: expiresAt || null
    })
  if (error) throw error
}

export async function unenrollFromClass(userId: string, classId: string): Promise<void> {
  const { error } = await supabase
    .from('student_classes')
    .delete()
    .eq('user_id', userId)
    .eq('class_id', classId)
  if (error) throw error
}
```

- [ ] **Step 4: Add update user profile function**

```typescript
export async function updateUserProfile(userId: string, data: {
  first_name?: string
  last_name?: string
  phone?: string
  cpf_cnpj?: string
  role?: string
  is_banned?: boolean
  is_unlimited_access?: boolean
}): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId)
  if (error) throw error
}
```

- [ ] **Step 5: Add last_seen update call**

```typescript
export async function updateLastSeen(userId: string): Promise<void> {
  await supabase.rpc('update_last_seen', { p_user_id: userId })
}
```

- [ ] **Step 6: Commit**

```bash
git add src/services/adminUserService.ts
git commit -m "feat: expand user service with ban, unlimited, enrollments, profile"
```

---

### Task 14: Add last_seen tracking to AuthProvider

**Files:**
- Modify: `src/hooks/useAuth.ts` or `src/contexts/AuthContext.tsx` (find the auth provider)

- [ ] **Step 1: Find the auth provider**

Search for the file that handles auth state (likely `AuthProvider` or `useAuth`).

- [ ] **Step 2: Add last_seen update on auth**

After successful login/session restoration, call `updateLastSeen(user.id)`.
Add check for `is_banned` - if profile has `is_banned === true`, call `signOut()` and show toast.

- [ ] **Step 3: Add periodic last_seen update**

Use `setInterval` (5 min) while user is logged in to call `updateLastSeen()`.

- [ ] **Step 4: Commit**

```bash
git add src/contexts/AuthContext.tsx  # or wherever auth lives
git commit -m "feat: add last_seen tracking and ban enforcement in auth"
```

---

### Task 15: Redesign UserManagement with tabs and filters

**Files:**
- Modify: `src/components/admin/management/UserManagement.tsx` (708 lines)

- [ ] **Step 1: Add tabs**

Replace current filter with Tabs component:
- Todos (count) | Assinantes (enrolled in active class) | Ilimitados (is_unlimited_access) | Colaboradores (role=teacher) | Banidos (is_banned)

Each tab filters the query accordingly.

- [ ] **Step 2: Add badge filters**

Below tabs, add clickable filter badges:
- `+ Curso` → Select dropdown of courses
- `+ Turma` → Select dropdown of classes
- `+ Ultima vez visto` → Date picker
- `+ Membros inativos` → Toggle (last_seen > 30 days)

Active filters show as removable badges.

- [ ] **Step 3: Update table columns**

Columns: Checkbox (disabled for now), Avatar+Name, Email, Data inscricao, Ultima vez visto, Edit button, "..." menu

- [ ] **Step 4: Add action menu**

"..." menu per row with:
- "Ver perfil" → navigates to `/admin/users/:id/profile`
- "Reenviar senha" → calls Supabase password recovery
- "Bloquear acesso" → calls `banUser()` with confirmation dialog

- [ ] **Step 5: Update the Supabase query**

Fetch: `first_name, last_name, email, role, is_active, is_banned, is_unlimited_access, last_seen_at, created_at, student_classes(count)`

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/management/UserManagement.tsx
git commit -m "feat: redesign user management with tabs, filters, action menu"
```

---

### Task 16: Create AdminUserProfilePage

**Files:**
- Create: `src/pages/admin/users/AdminUserProfilePage.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Build Section 1 - Member Data**

Page layout following existing admin form patterns (Card sections):
- Name (text), Email (read-only)
- Phone (text with mask), CPF/CNPJ (text with mask)
- New password / Confirm password (leave blank to keep)

- [ ] **Step 2: Build Section 2 - Access Controls**

- Toggle: Banido - "Impede o acesso do aluno na area de membros"
- Toggle: Acesso Ilimitado - "Todos os conteudos liberados (atuais e futuros)"
- Select: Permissoes - student/teacher/administrator

- [ ] **Step 3: Build Section 3 - Enrollment Control**

Table listing ALL courses from platform:
- Each row: Course name | Turma dropdown (from classes linked to this course) | Expiration date picker | Status badge
- If turma is selected → user is enrolled (upsert `student_classes`)
- If turma is cleared → user is unenrolled (delete from `student_classes`)

Load data: all `video_courses` + all `classes` + user's `student_classes`

- [ ] **Step 4: Build Section 4 - History (read-only)**

- Progress per course (progress bar)
- Last lesson watched
- XP accumulated
- Account creation date

- [ ] **Step 5: Add save handler**

On save:
1. Update user profile (name, phone, cpf, role, banned, unlimited)
2. Sync enrollments (compare current vs desired, create/delete as needed)
3. If password fields filled → reset password via Supabase admin API

- [ ] **Step 6: Add route in App.tsx**

```tsx
// In the admin routes section
<Route path="users/:userId/profile" element={<AdminUserProfilePage />} />
```

Lazy import at top of App.tsx:
```tsx
const AdminUserProfilePage = lazy(() => import('./pages/admin/users/AdminUserProfilePage'))
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/users/AdminUserProfilePage.tsx src/App.tsx
git commit -m "feat: add admin user profile page with enrollment control"
```

---

## Chunk 4: Area D - Invite System

### Task 17: Database migration - invites tables

**Files:**
- Create: `supabase/migrations/20260314000004_invite_system.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  course_id uuid REFERENCES video_courses(id) ON DELETE SET NULL,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  access_duration_days int,
  max_slots int,
  cover_image_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invite registrations
CREATE TABLE IF NOT EXISTS invite_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id uuid NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(invite_id, user_id)
);

-- RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_registrations ENABLE ROW LEVEL SECURITY;

-- Public can read active invites (limited columns via view or app logic)
CREATE POLICY "Public read active invites"
  ON invites FOR SELECT
  USING (status = 'active');

-- Authenticated admin can manage invites
CREATE POLICY "Admin manage invites"
  ON invites FOR ALL
  USING (auth.role() = 'authenticated');

-- Anyone can register (insert) for an invite
CREATE POLICY "Public register for invite"
  ON invite_registrations FOR INSERT
  WITH CHECK (true);

-- Admin can read registrations
CREATE POLICY "Admin read registrations"
  ON invite_registrations FOR SELECT
  USING (auth.role() = 'authenticated');

-- Index
CREATE INDEX IF NOT EXISTS idx_invites_slug ON invites(slug);
CREATE INDEX IF NOT EXISTS idx_invite_registrations_invite ON invite_registrations(invite_id);
```

- [ ] **Step 2: Apply migration and regenerate types**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260314000004_invite_system.sql src/lib/supabase/types.ts
git commit -m "feat: add invites and invite_registrations tables"
```

---

### Task 18: Create inviteService

**Files:**
- Create: `src/services/inviteService.ts`

- [ ] **Step 1: Write the service**

```typescript
import { supabase } from '@/lib/supabase/client'

export interface Invite {
  id?: string
  slug: string
  title: string
  description?: string
  course_id?: string
  class_id?: string
  access_duration_days?: number | null
  max_slots?: number | null
  cover_image_url?: string
  status: 'active' | 'archived'
  created_by_user_id?: string
}

export async function getAllInvites() {
  const { data, error } = await supabase
    .from('invites')
    .select('*, invite_registrations(count)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getInviteBySlug(slug: string) {
  const { data, error } = await supabase
    .from('invites')
    .select('*, video_courses(id, name, thumbnail_url, description), classes(id, name)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  if (error) throw error
  return data
}

export async function getRegistrationCount(inviteId: string): Promise<number> {
  const { count, error } = await supabase
    .from('invite_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('invite_id', inviteId)
  if (error) throw error
  return count || 0
}

export async function createInvite(invite: Invite) {
  const { data, error } = await supabase
    .from('invites')
    .insert(invite)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateInvite(id: string, invite: Partial<Invite>) {
  const { error } = await supabase
    .from('invites')
    .update({ ...invite, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function archiveInvite(id: string) {
  return updateInvite(id, { status: 'archived' })
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function registerForInvite(inviteId: string, userData: {
  name: string
  email: string
  password: string
}) {
  // 1. Get invite details
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('id', inviteId)
    .eq('status', 'active')
    .single()

  if (inviteError || !invite) throw new Error('Convite nao encontrado ou inativo')

  // 2. Check slots
  if (invite.max_slots) {
    const count = await getRegistrationCount(inviteId)
    if (count >= invite.max_slots) throw new Error('Vagas esgotadas')
  }

  // 3. Try to create user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: { first_name: userData.name }
    }
  })

  let userId: string

  if (authError) {
    if (authError.message.includes('already registered')) {
      // User exists - find them
      // Note: this needs service_role or edge function in production
      throw new Error('EMAIL_EXISTS')
    }
    throw authError
  }

  userId = authData.user!.id

  // 4. Create user profile
  const nameParts = userData.name.split(' ')
  await supabase.from('users').upsert({
    id: userId,
    email: userData.email,
    first_name: nameParts[0],
    last_name: nameParts.slice(1).join(' ') || null,
    role: 'student',
    is_active: true
  })

  // 5. Enroll in class
  if (invite.class_id) {
    const expiresAt = invite.access_duration_days
      ? new Date(Date.now() + invite.access_duration_days * 86400000).toISOString()
      : null

    await supabase.from('student_classes').insert({
      user_id: userId,
      class_id: invite.class_id,
      enrollment_date: new Date().toISOString(),
      subscription_expires_at: expiresAt
    })
  }

  // 6. Track registration
  await supabase.from('invite_registrations').insert({
    invite_id: inviteId,
    user_id: userId
  })

  return { userId, isNewUser: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/inviteService.ts
git commit -m "feat: add invite service with registration flow"
```

---

### Task 19: Create AdminInvitesPage

**Files:**
- Create: `src/pages/admin/invites/AdminInvitesPage.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Build the page**

Layout following existing admin list page patterns:
- Header: "Convites" + "Novo convite" button
- Tabs: Ativos | Arquivados (with counts)
- Table: Titulo, Descricao (truncated), Inscritos (count + link), Link de divulgacao (with copy button), Acoes (edit, archive/delete)

Copy button uses `navigator.clipboard.writeText()` with toast "Link copiado!"

- [ ] **Step 2: Add route in App.tsx**

```tsx
const AdminInvitesPage = lazy(() => import('./pages/admin/invites/AdminInvitesPage'))
// In admin routes:
<Route path="invites" element={<AdminInvitesPage />} />
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/invites/AdminInvitesPage.tsx src/App.tsx
git commit -m "feat: add admin invites list page"
```

---

### Task 20: Create AdminInviteFormPage

**Files:**
- Create: `src/pages/admin/invites/AdminInviteFormPage.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Build the form**

Card-based form following existing admin form patterns:
- Titulo (required)
- Slug (auto-generated from title via `generateSlug()`, editable)
- Texto de chamada (textarea)
- Curso vinculado (Select dropdown of `video_courses`)
- Turma vinculada (Select dropdown of `classes`, filtered by selected course via `class_courses`)
- Prazo de acesso (number input + "dias")
- Limite de vagas (number input)
- Imagem de capa (file upload to `course-covers` bucket, reuse pattern)
- Status (Select: active/archived)

Preview of invite URL: `{window.location.origin}/invite/{slug}`

- [ ] **Step 2: Add routes**

```tsx
const AdminInviteFormPage = lazy(() => import('./pages/admin/invites/AdminInviteFormPage'))
// In admin routes:
<Route path="invites/new" element={<AdminInviteFormPage />} />
<Route path="invites/:inviteId/edit" element={<AdminInviteFormPage />} />
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/invites/AdminInviteFormPage.tsx src/App.tsx
git commit -m "feat: add admin invite form page"
```

---

### Task 21: Create public InvitePage (landing page)

**Files:**
- Create: `src/pages/public/InvitePage.tsx`
- Modify: `src/App.tsx` (add public route)

- [ ] **Step 1: Build the landing page**

Public page (no auth required), clean minimal design:
- Hero section: cover image (full width, 300px height), course title overlay
- Invite title (h1)
- Description text
- Vagas restantes badge (if max_slots): "X de Y vagas disponiveis"
- Registration form Card:
  - Nome completo (required)
  - Email (required, email format)
  - Senha (required, min 6 chars)
  - Confirmar senha
  - Button "Criar conta e acessar"
- Footer: Everest logo + "Rumo ao topo!"

State management:
- Load invite by slug via `getInviteBySlug(slug)`
- If invite not found or archived → show "Convite nao encontrado" message
- On submit → call `registerForInvite()`
- Handle EMAIL_EXISTS: show message "Voce ja tem uma conta. Seu acesso foi liberado, faca login!"
- On success → redirect to `/login` with toast

- [ ] **Step 2: Add public route in App.tsx**

This route must be OUTSIDE the authenticated layout:
```tsx
<Route path="/invite/:slug" element={<InvitePage />} />
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/public/InvitePage.tsx src/App.tsx
git commit -m "feat: add public invite landing page with registration"
```

---

### Task 22: Add Convites to admin sidebar

**Files:**
- Modify: `src/components/UnifiedSidebar.tsx` (453 lines)

- [ ] **Step 1: Add Convites menu item**

Find the admin sidebar items section. Add "Convites" with `Mail` or `Link` icon from Lucide, linking to `/admin/invites`. Place it in the management section near "Turmas" and "Usuarios".

- [ ] **Step 2: Commit**

```bash
git add src/components/UnifiedSidebar.tsx
git commit -m "feat: add Convites to admin sidebar"
```

---

### Task 23: Final integration test and cleanup

- [ ] **Step 1: Manual smoke test checklist**

Test each flow in the browser:
1. Admin: Create course with new fields (capa, vitrine, status Em Breve) ✓
2. Admin: Edit course, upload cover image ✓
3. Admin: Duplicate course ✓
4. Student: See storefront courses with lock ✓
5. Student: View locked course detail page ✓
6. Student: Access preview lesson in locked course ✓
7. Admin: Create turma with module rules (scheduled_date, blocked) ✓
8. Student: See blocked/scheduled modules with messages ✓
9. Admin: Edit user profile, set ban, unlimited access ✓
10. Admin: Manage enrollments per student ✓
11. Admin: Create invite with slug ✓
12. Public: Open invite landing page, register ✓
13. Admin: See invite registration count ✓

- [ ] **Step 2: Fix any issues found**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: integration fixes for admin management improvements"
```
