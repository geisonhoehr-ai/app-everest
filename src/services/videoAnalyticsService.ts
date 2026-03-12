import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VideoAnalyticsOverview {
  totalLessons: number
  totalStudentsWatching: number
  avgCompletionRate: number
  totalWatchTimeHours: number
}

export interface LessonAnalytics {
  lessonId: string
  lessonTitle: string
  moduleName: string
  courseName: string
  durationSeconds: number
  totalViews: number
  completedCount: number
  completionRate: number
  avgProgressPercent: number
  avgWatchTimeSeconds: number
}

export interface CourseAnalytics {
  courseId: string
  courseName: string
  totalLessons: number
  totalStudents: number
  completedLessons: number
  avgCompletionRate: number
  totalWatchTimeHours: number
}

export interface StudentProgressEntry {
  userId: string
  firstName: string
  lastName: string
  email: string
  lessonsStarted: number
  lessonsCompleted: number
  completionRate: number
  totalWatchTimeHours: number
  lastActivity: string
}

export interface WatchTrendPoint {
  date: string
  views: number
  completions: number
}

// ─── Overview KPIs ───────────────────────────────────────────────────────────

export async function getVideoAnalyticsOverview(): Promise<VideoAnalyticsOverview> {
  try {
    const [lessonsResult, progressResult] = await Promise.all([
      supabase.from('video_lessons').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('video_progress').select('user_id, is_completed, current_time_seconds, progress_percentage'),
    ])

    const progress = progressResult.data || []
    const uniqueStudents = new Set(progress.map(p => p.user_id)).size
    const completedCount = progress.filter(p => p.is_completed).length
    const completionRate = progress.length > 0 ? Math.round((completedCount / progress.length) * 100) : 0
    const totalWatchSeconds = progress.reduce((sum, p) => sum + (p.current_time_seconds || 0), 0)

    return {
      totalLessons: lessonsResult.count || 0,
      totalStudentsWatching: uniqueStudents,
      avgCompletionRate: completionRate,
      totalWatchTimeHours: Math.round(totalWatchSeconds / 3600),
    }
  } catch (error) {
    logger.error('Error fetching video analytics overview:', error)
    return { totalLessons: 0, totalStudentsWatching: 0, avgCompletionRate: 0, totalWatchTimeHours: 0 }
  }
}

// ─── Per-lesson analytics ────────────────────────────────────────────────────

export async function getLessonAnalytics(): Promise<LessonAnalytics[]> {
  try {
    // Get all lessons with module and course info
    const { data: lessons } = await supabase
      .from('video_lessons')
      .select(`
        id, title, duration_seconds, is_active,
        video_modules!inner (
          name,
          video_courses!inner ( name )
        )
      `)
      .eq('is_active', true)
      .order('title')

    if (!lessons || lessons.length === 0) return []

    // Get all progress records
    const { data: progress } = await supabase
      .from('video_progress')
      .select('lesson_id, user_id, is_completed, progress_percentage, current_time_seconds')

    const progressByLesson = new Map<string, typeof progress>()
    for (const p of (progress || [])) {
      const arr = progressByLesson.get(p.lesson_id) || []
      arr.push(p)
      progressByLesson.set(p.lesson_id, arr)
    }

    return lessons.map((lesson: any) => {
      const lessonProgress = progressByLesson.get(lesson.id) || []
      const completedCount = lessonProgress.filter(p => p.is_completed).length
      const totalViews = new Set(lessonProgress.map(p => p.user_id)).size
      const avgProgress = lessonProgress.length > 0
        ? Math.round(lessonProgress.reduce((s, p) => s + (p.progress_percentage || 0), 0) / lessonProgress.length)
        : 0
      const avgWatch = lessonProgress.length > 0
        ? Math.round(lessonProgress.reduce((s, p) => s + (p.current_time_seconds || 0), 0) / lessonProgress.length)
        : 0

      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleName: lesson.video_modules?.name || '',
        courseName: lesson.video_modules?.video_courses?.name || '',
        durationSeconds: lesson.duration_seconds || 0,
        totalViews,
        completedCount,
        completionRate: totalViews > 0 ? Math.round((completedCount / totalViews) * 100) : 0,
        avgProgressPercent: avgProgress,
        avgWatchTimeSeconds: avgWatch,
      }
    })
  } catch (error) {
    logger.error('Error fetching lesson analytics:', error)
    return []
  }
}

// ─── Per-course analytics ────────────────────────────────────────────────────

export async function getCourseAnalytics(): Promise<CourseAnalytics[]> {
  try {
    const { data: courses } = await supabase
      .from('video_courses')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (!courses || courses.length === 0) return []

    // Get all lessons grouped by course
    const { data: lessons } = await supabase
      .from('video_lessons')
      .select('id, video_modules!inner ( course_id )')
      .eq('is_active', true)

    // Get all progress
    const { data: progress } = await supabase
      .from('video_progress')
      .select('lesson_id, user_id, is_completed, current_time_seconds')

    // Map lesson → course
    const lessonToCourse = new Map<string, string>()
    for (const l of (lessons || [])) {
      lessonToCourse.set(l.id, (l as any).video_modules?.course_id)
    }

    // Aggregate by course
    return courses.map(course => {
      const courseLessonIds = [...lessonToCourse.entries()]
        .filter(([, cId]) => cId === course.id)
        .map(([lId]) => lId)

      const courseProgress = (progress || []).filter(p => courseLessonIds.includes(p.lesson_id))
      const uniqueStudents = new Set(courseProgress.map(p => p.user_id)).size
      const completedCount = courseProgress.filter(p => p.is_completed).length
      const totalWatch = courseProgress.reduce((s, p) => s + (p.current_time_seconds || 0), 0)

      return {
        courseId: course.id,
        courseName: course.name,
        totalLessons: courseLessonIds.length,
        totalStudents: uniqueStudents,
        completedLessons: completedCount,
        avgCompletionRate: courseProgress.length > 0 ? Math.round((completedCount / courseProgress.length) * 100) : 0,
        totalWatchTimeHours: Math.round((totalWatch / 3600) * 10) / 10,
      }
    })
  } catch (error) {
    logger.error('Error fetching course analytics:', error)
    return []
  }
}

// ─── Top students ────────────────────────────────────────────────────────────

export async function getStudentProgressList(limit = 20): Promise<StudentProgressEntry[]> {
  try {
    const { data: progress } = await supabase
      .from('video_progress')
      .select('user_id, lesson_id, is_completed, current_time_seconds, updated_at')

    if (!progress || progress.length === 0) return []

    // Aggregate by user
    const byUser = new Map<string, { started: Set<string>; completed: number; watchTime: number; lastActivity: string }>()
    for (const p of progress) {
      const entry = byUser.get(p.user_id) || { started: new Set<string>(), completed: 0, watchTime: 0, lastActivity: '' }
      entry.started.add(p.lesson_id)
      if (p.is_completed) entry.completed++
      entry.watchTime += p.current_time_seconds || 0
      if (p.updated_at > entry.lastActivity) entry.lastActivity = p.updated_at
      byUser.set(p.user_id, entry)
    }

    // Get user profiles
    const userIds = [...byUser.keys()].slice(0, limit * 2) // fetch a bit more to account for missing profiles
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', userIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    const result: StudentProgressEntry[] = []
    for (const [userId, data] of byUser) {
      const user = userMap.get(userId)
      if (!user) continue
      result.push({
        userId,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        lessonsStarted: data.started.size,
        lessonsCompleted: data.completed,
        completionRate: data.started.size > 0 ? Math.round((data.completed / data.started.size) * 100) : 0,
        totalWatchTimeHours: Math.round((data.watchTime / 3600) * 10) / 10,
        lastActivity: data.lastActivity,
      })
    }

    return result
      .sort((a, b) => b.lessonsCompleted - a.lessonsCompleted)
      .slice(0, limit)
  } catch (error) {
    logger.error('Error fetching student progress list:', error)
    return []
  }
}

// ─── Watch trends (last N days) ──────────────────────────────────────────────

export async function getWatchTrends(days = 30): Promise<WatchTrendPoint[]> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: progress } = await supabase
      .from('video_progress')
      .select('updated_at, is_completed')
      .gte('updated_at', since.toISOString())

    if (!progress || progress.length === 0) return []

    // Group by day
    const byDay = new Map<string, { views: number; completions: number }>()
    for (const p of progress) {
      const day = p.updated_at.substring(0, 10) // YYYY-MM-DD
      const entry = byDay.get(day) || { views: 0, completions: 0 }
      entry.views++
      if (p.is_completed) entry.completions++
      byDay.set(day, entry)
    }

    // Fill gaps
    const result: WatchTrendPoint[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().substring(0, 10)
      const entry = byDay.get(key) || { views: 0, completions: 0 }
      result.push({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        views: entry.views,
        completions: entry.completions,
      })
    }

    return result
  } catch (error) {
    logger.error('Error fetching watch trends:', error)
    return []
  }
}
