import { supabase } from '@/lib/supabase/client'

export interface SystemStats {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalAdministrators: number
  totalClasses: number
  totalCourses: number
  totalFlashcards: number
  totalQuizzes: number
  totalEssays: number
  totalAudioCourses: number
  activeUsers: number
  completionRate: number
}

export async function getSystemStats(): Promise<SystemStats> {
  try {
    const [
      usersResult,
      classesResult,
      coursesResult,
      flashcardsResult,
      quizzesResult,
      essaysResult,
      audioCoursesResult
    ] = await Promise.all([
      supabase.from('users').select('role', { count: 'exact', head: true }),
      supabase.from('classes').select('*', { count: 'exact', head: true }),
      supabase.from('video_courses').select('*', { count: 'exact', head: true }),
      supabase.from('flashcards').select('*', { count: 'exact', head: true }),
      supabase.from('quizzes').select('*', { count: 'exact', head: true }),
      supabase.from('essays').select('*', { count: 'exact', head: true }),
      supabase.from('audio_courses').select('*', { count: 'exact', head: true })
    ])

    // Get users by role
    const { data: usersData } = await supabase
      .from('users')
      .select('role')

    const students = (usersData || []).filter(u => u.role === 'student').length
    const teachers = (usersData || []).filter(u => u.role === 'teacher').length
    const administrators = (usersData || []).filter(u => u.role === 'administrator').length

    // Calculate completion rate (simplified - based on video progress)
    const { data: progressData } = await supabase
      .from('video_progress')
      .select('is_completed')

    const completedCount = (progressData || []).filter(p => p.is_completed).length
    const completionRate = progressData && progressData.length > 0
      ? Math.round((completedCount / progressData.length) * 100)
      : 0

    return {
      totalUsers: usersResult.count || 0,
      totalStudents: students,
      totalTeachers: teachers,
      totalAdministrators: administrators,
      totalClasses: classesResult.count || 0,
      totalCourses: coursesResult.count || 0,
      totalFlashcards: flashcardsResult.count || 0,
      totalQuizzes: quizzesResult.count || 0,
      totalEssays: essaysResult.count || 0,
      totalAudioCourses: audioCoursesResult.count || 0,
      activeUsers: usersResult.count || 0, // Could be enhanced with last_login_at check
      completionRate
    }
  } catch (error) {
    console.error('Error fetching system stats:', error)
    throw error
  }
}

export interface UserActivity {
  date: string
  user_count: number
  activity_count: number
}

export async function getRecentActivity(days: number = 7): Promise<UserActivity[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('user_sessions')
    .select('login_at, user_id')
    .gte('login_at', startDate.toISOString())
    .order('login_at', { ascending: false })

  if (error) throw error

  // Group by date
  const activityMap = new Map<string, Set<string>>()
  
  ;(data || []).forEach(session => {
    const date = new Date(session.login_at).toISOString().split('T')[0]
    if (!activityMap.has(date)) {
      activityMap.set(date, new Set())
    }
    activityMap.get(date)?.add(session.user_id)
  })

  return Array.from(activityMap.entries())
    .map(([date, userIds]) => ({
      date,
      user_count: userIds.size,
      activity_count: userIds.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface ResourceUsage {
  database_size: string
  storage_used: string
  api_calls_today: number
  active_connections: number
}

export async function getResourceUsage(): Promise<ResourceUsage> {
  // Placeholder - these would require additional monitoring setup
  return {
    database_size: '2.4 GB',
    storage_used: '1.2 GB',
    api_calls_today: 12543,
    active_connections: 24
  }
}

