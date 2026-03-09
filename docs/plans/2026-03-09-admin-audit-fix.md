# Admin Panel - Audit Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all broken buttons, stubs, and missing features in the admin panel so administrators can fully manage the platform.

**Architecture:** Fix-first approach — no refactoring, no new features. Each etapa targets a severity level (critical → high → medium → low). Each task is self-contained and can be committed independently.

**Tech Stack:** React 19, TypeScript, Supabase (tables + RPC), Shadcn UI, Recharts

---

## Etapa 1: CRITICAL — AdminSettingsPage (settings não persistem)

### Task 1.1: Create system_settings table in Supabase

**Context:** AdminSettingsPage.tsx (457 lines) has a full settings UI but "Salvar Alterações" doesn't persist anything. We need a key-value table.

**Step 1:** Run SQL migration via Supabase dashboard or CLI:

```sql
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS: only administrators can read/write
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

-- Seed default settings
INSERT INTO system_settings (key, value) VALUES
  ('general', '{"platformName": "Everest Preparatórios", "platformUrl": "https://app.everestpreparatorios.com.br", "description": "Plataforma de estudos para concursos militares", "timezone": "America/Sao_Paulo", "maintenanceMode": false, "allowSignups": true}'),
  ('notifications', '{"newStudents": true, "newSubmissions": true, "systemAlerts": true, "weeklyReport": true, "essayCorrections": true, "forumActivity": false}'),
  ('security', '{"sessionTimeout": 60, "maxLoginAttempts": 5, "twoFactorEnabled": false, "passwordMinLength": 8, "auditLog": true}'),
  ('appearance', '{"primaryColor": "#ff6b35", "secondaryColor": "#1a1a2e", "darkMode": true, "animations": true}')
ON CONFLICT (key) DO NOTHING;
```

### Task 1.2: Create systemSettingsService.ts

**Files:**
- Create: `src/services/systemSettingsService.ts`

```typescript
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export type SettingsKey = 'general' | 'notifications' | 'security' | 'appearance'

export async function getSettings(key: SettingsKey) {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    logger.error(`Error fetching settings [${key}]:`, error)
    return null
  }
  return data?.value
}

export async function getAllSettings() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')

  if (error) {
    logger.error('Error fetching all settings:', error)
    return {}
  }

  const settings: Record<string, any> = {}
  for (const row of data || []) {
    settings[row.key] = row.value
  }
  return settings
}

export async function updateSettings(key: SettingsKey, value: Record<string, any>) {
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    }, { onConflict: 'key' })

  if (error) {
    logger.error(`Error updating settings [${key}]:`, error)
    throw error
  }
}
```

### Task 1.3: Rewrite AdminSettingsPage.tsx to use real persistence

**Files:**
- Modify: `src/pages/admin/settings/AdminSettingsPage.tsx`

**Changes:**
1. Import `getAllSettings`, `updateSettings` from systemSettingsService
2. Load settings on mount with `useEffect` → `getAllSettings()`
3. Replace local state initialization with loaded DB values
4. Wire `handleSave()` to call `updateSettings(activeTab, currentTabData)`
5. Add loading state while fetching settings
6. Show success/error toast on save

**Step:** Commit: `fix: persist admin settings to Supabase system_settings table`

---

## Etapa 2: HIGH — AdminReportsPage (export + filtro de data)

### Task 2.1: Fix date range filter

**Files:**
- Modify: `src/pages/admin/reports/AdminReportsPage.tsx`
- Modify: `src/services/adminStatsService.ts`

**Changes in adminStatsService.ts:**
1. Add `days` parameter to `getUserGrowthData(days)` and `getWeeklyActivityData(days)`
2. Filter queries by `created_at >= now() - interval '${days} days'`

**Changes in AdminReportsPage.tsx:**
1. Pass selected date range (7/30/90/365) to service calls
2. Re-fetch data when date range changes

### Task 2.2: Implement CSV export

**Files:**
- Modify: `src/pages/admin/reports/AdminReportsPage.tsx`

**Changes:**
1. Add `handleExport()` function that:
   - Collects current visible data (growth, activity, distribution)
   - Converts to CSV format
   - Triggers browser download as `relatorio-everest-YYYY-MM-DD.csv`
2. Wire "Exportar" button to `handleExport()`
3. Remove "Personalizar" button (YAGNI — no real use case)

**Step:** Commit: `fix: wire admin reports date filter and CSV export`

---

## Etapa 3: HIGH — AdminGamificationPage (edit/delete stubs)

### Task 3.1: Wire edit/delete achievement handlers

**Files:**
- Modify: `src/pages/admin/gamification/AdminGamificationPage.tsx`

**Changes:**
1. Add `handleEditAchievement(achievement)` — opens create dialog pre-filled, calls `gamificationService.updateAchievement(id, data)`
2. Add `handleDeleteAchievement(id)` — confirmation dialog, calls `gamificationService.deleteAchievement(id)`
3. Wire Edit/Delete buttons in achievement rows (lines ~459-464)
4. Remove stub "Configurar Pontos" and "Configurar Níveis" buttons (YAGNI — XP levels are hardcoded in rankingService and work fine)

**Step:** Commit: `fix: implement achievement edit/delete in gamification page`

---

## Etapa 4: HIGH — AdminSimulationReportsPage (dados mock)

### Task 4.1: Replace mock data with real queries

**Files:**
- Modify: `src/pages/admin/simulations/AdminSimulationReportsPage.tsx`
- Modify: `src/services/adminSimulationService.ts` (if needed)

**Changes:**
1. Populate `questionPerformance` array from `adminSimulationService.getSimulationStats(id)` — map question texts with correct/incorrect counts
2. Replace mock "Attempts" tab (hardcoded Math.random) with real attempt data from `quiz_attempts` table
3. Show real student names, scores, dates, duration

**Step:** Commit: `fix: replace mock data in simulation reports with real queries`

---

## Etapa 5: MEDIUM — AdminSystemControlPage (dados hardcoded)

### Task 5.1: Replace hardcoded metrics with real data

**Files:**
- Modify: `src/pages/admin/system/AdminSystemControlPage.tsx`

**Changes:**
1. Replace hardcoded DB stats (1.2K queries, 45ms) with actual Supabase health check or remove the section entirely (we don't have access to PG stats via Supabase client)
2. Replace hardcoded performance stats with real data from `adminStatsService.getSystemStats()`
3. Verify all module navigation routes are correct

**Step:** Commit: `fix: replace hardcoded system control metrics`

---

## Etapa 6: MEDIUM — Calendar Update event + Class Delete

### Task 6.1: Add edit event to AdminCalendarPage

**Files:**
- Modify: `src/pages/admin/calendar/AdminCalendarPage.tsx`

**Changes:**
1. Add "Editar" button on each event card
2. Open create dialog pre-filled with event data
3. Wire to `calendarService.updateEvent(id, data)`

### Task 6.2: Add delete class to AdminClassesPage

**Files:**
- Modify: `src/pages/admin/classes/AdminClassesPage.tsx`

**Changes:**
1. Add delete button with confirmation on class list
2. Wire to `classService.deleteClass(id)` or Supabase direct
3. Validate: don't delete classes with active students (show warning)

**Step:** Commit: `fix: add edit event and delete class to admin`

---

## Etapa 7: LOW — Cleanup

### Task 7.1: Remove unused functions from adminStatsService.ts
- Remove `getRecentActivity()` (never used)
- Remove `getResourceUsage()` (returns hardcoded data)
- Make `calculateChange()` and `getRelativeTime()` non-exported

### Task 7.2: Remove image upload stub from AdminSubjectFormPage.tsx
- Remove non-functional upload button or wire it to Supabase Storage

### Task 7.3: Remove duplicate CRUD in adminSimulationService.ts
- ReadingText and Question functions are duplicated from adminQuizService
- Import from adminQuizService instead of duplicating

**Step:** Commit: `chore: clean up unused admin code and duplicates`

---

## Execution Order

| Etapa | Prioridade | Estimativa | Dependência |
|-------|-----------|------------|-------------|
| 1 | CRITICAL | Maior (precisa SQL) | Nenhuma |
| 2 | HIGH | Média | Nenhuma |
| 3 | HIGH | Pequena | Nenhuma |
| 4 | HIGH | Média | Nenhuma |
| 5 | MEDIUM | Pequena | Nenhuma |
| 6 | MEDIUM | Média | Nenhuma |
| 7 | LOW | Pequena | Nenhuma |

Etapas 1-4 podem ser feitas em paralelo (independentes).
Etapas 5-7 são cleanup e podem ser feitas depois.
