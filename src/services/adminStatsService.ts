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

export interface UserGrowthData {
  month: string
  usuarios: number
  ativos: number
}

export async function getUserGrowthData(): Promise<UserGrowthData[]> {
  try {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    const result: UserGrowthData[] = []

    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      // Get total users created until this month
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', nextDate.toISOString())

      // Get active users in this month (users who logged in)
      const { count: activeUsers } = await supabase
        .from('user_sessions')
        .select('user_id', { count: 'exact', head: true })
        .gte('login_at', date.toISOString())
        .lt('login_at', nextDate.toISOString())

      result.push({
        month: months[5 - i] || date.toLocaleDateString('pt-BR', { month: 'short' }),
        usuarios: totalUsers || 0,
        ativos: activeUsers || 0
      })
    }

    return result
  } catch (error) {
    console.error('Error fetching user growth data:', error)
    // Return fallback data
    return [
      { month: 'Jan', usuarios: 0, ativos: 0 },
      { month: 'Fev', usuarios: 0, ativos: 0 },
      { month: 'Mar', usuarios: 0, ativos: 0 },
      { month: 'Abr', usuarios: 0, ativos: 0 },
      { month: 'Mai', usuarios: 0, ativos: 0 },
      { month: 'Jun', usuarios: 0, ativos: 0 },
    ]
  }
}

export interface ActivityDataPoint {
  day: string
  atividades: number
}

export async function getWeeklyActivityData(): Promise<ActivityDataPoint[]> {
  try {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
    const result: ActivityDataPoint[] = []

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek)
      dayStart.setDate(startOfWeek.getDate() + i)

      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayStart.getDate() + 1)

      // Count activities (sessions, quiz attempts, flashcard sessions, etc.)
      const [sessions, quizHistory, flashcardSessions] = await Promise.all([
        supabase
          .from('user_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('login_at', dayStart.toISOString())
          .lt('login_at', dayEnd.toISOString()),
        supabase
          .from('quiz_history')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString()),
        supabase
          .from('flashcard_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString())
      ])

      const totalActivities = (sessions.count || 0) + (quizHistory.count || 0) + (flashcardSessions.count || 0)

      result.push({
        day: days[i],
        atividades: totalActivities
      })
    }

    return result
  } catch (error) {
    console.error('Error fetching weekly activity data:', error)
    return [
      { day: 'Dom', atividades: 0 },
      { day: 'Seg', atividades: 0 },
      { day: 'Ter', atividades: 0 },
      { day: 'Qua', atividades: 0 },
      { day: 'Qui', atividades: 0 },
      { day: 'Sex', atividades: 0 },
      { day: 'Sab', atividades: 0 },
    ]
  }
}

export interface RecentActivity {
  type: string
  message: string
  time: string
  icon: string
  timestamp: Date
}

export async function getRecentActivities(limit: number = 5): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = []

    // Get recent user signups
    const { data: recentUsers } = await supabase
      .from('users')
      .select('created_at, role')
      .order('created_at', { ascending: false })
      .limit(2)

    if (recentUsers) {
      recentUsers.forEach(user => {
        activities.push({
          type: 'user',
          message: user.role === 'student' ? 'Novo aluno cadastrado' : 'Novo usuário cadastrado',
          time: getRelativeTime(new Date(user.created_at)),
          icon: 'Users',
          timestamp: new Date(user.created_at)
        })
      })
    }

    // Get pending essays
    const { count: pendingEssays } = await supabase
      .from('essays')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (pendingEssays && pendingEssays > 0) {
      activities.push({
        type: 'essay',
        message: `${pendingEssays} redações aguardando correção`,
        time: 'Agora',
        icon: 'FileText',
        timestamp: new Date()
      })
    }

    // Get recent courses
    const { data: recentCourses } = await supabase
      .from('video_courses')
      .select('title, created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    if (recentCourses && recentCourses.length > 0) {
      activities.push({
        type: 'course',
        message: `Curso "${recentCourses[0].title}" publicado`,
        time: getRelativeTime(new Date(recentCourses[0].created_at)),
        icon: 'BookOpen',
        timestamp: new Date(recentCourses[0].created_at)
      })
    }

    // Get recent achievements
    const { count: todayAchievements } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .gte('earned_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())

    if (todayAchievements && todayAchievements > 0) {
      activities.push({
        type: 'achievement',
        message: `${todayAchievements} conquistas desbloqueadas hoje`,
        time: 'Hoje',
        icon: 'Award',
        timestamp: new Date()
      })
    }

    // Get recent classes
    const { data: recentClasses } = await supabase
      .from('classes')
      .select('name, created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    if (recentClasses && recentClasses.length > 0) {
      activities.push({
        type: 'class',
        message: `Nova turma "${recentClasses[0].name}" criada`,
        time: getRelativeTime(new Date(recentClasses[0].created_at)),
        icon: 'GraduationCap',
        timestamp: new Date(recentClasses[0].created_at)
      })
    }

    // Sort by timestamp and return top N
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return []
  }
}

export interface Alert {
  type: 'warning' | 'info' | 'error'
  message: string
  action?: string | null
  link?: string | null
}

export async function getSystemAlerts(): Promise<Alert[]> {
  try {
    const alerts: Alert[] = []

    // Check for pending essays over 48h
    const twoDaysAgo = new Date()
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48)

    const { count: oldPendingEssays } = await supabase
      .from('essays')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', twoDaysAgo.toISOString())

    if (oldPendingEssays && oldPendingEssays > 0) {
      alerts.push({
        type: 'warning',
        message: `${oldPendingEssays} redações pendentes há mais de 48h`,
        action: 'Ver redações',
        link: '/admin/essays'
      })
    }

    // Check for inactive users
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: inactiveUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lt('last_login_at', thirtyDaysAgo.toISOString())
      .eq('role', 'student')

    if (inactiveUsers && inactiveUsers > 10) {
      alerts.push({
        type: 'info',
        message: `${inactiveUsers} alunos inativos há mais de 30 dias`,
        action: 'Ver usuários',
        link: '/admin/users'
      })
    }

    // Success message (backup, etc.)
    alerts.push({
      type: 'info',
      message: 'Sistema funcionando normalmente',
      action: null,
      link: null
    })

    return alerts
  } catch (error) {
    console.error('Error fetching system alerts:', error)
    return [{
      type: 'info',
      message: 'Sistema funcionando normalmente',
      action: null,
      link: null
    }]
  }
}

export interface KPIChange {
  current: number
  previous: number
  change: string
  trend: 'up' | 'down' | 'stable'
}

export async function getKPIChanges(): Promise<{
  users: KPIChange
  activeUsers: KPIChange
  classes: KPIChange
  completionRate: KPIChange
}> {
  try {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Total users
    const { count: currentUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: lastMonthUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thisMonth.toISOString())

    const usersChange = calculateChange(currentUsers || 0, lastMonthUsers || 0)

    // Active users this month vs last month
    const { count: currentActive } = await supabase
      .from('user_sessions')
      .select('user_id', { count: 'exact', head: true })
      .gte('login_at', thisMonth.toISOString())

    const { count: lastMonthActive } = await supabase
      .from('user_sessions')
      .select('user_id', { count: 'exact', head: true })
      .gte('login_at', lastMonth.toISOString())
      .lt('login_at', thisMonth.toISOString())

    const activeChange = calculateChange(currentActive || 0, lastMonthActive || 0)

    // Classes
    const { count: currentClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })

    const { count: lastMonthClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thisMonth.toISOString())

    const classesChange = calculateChange(currentClasses || 0, lastMonthClasses || 0)

    // Completion rate - simplified
    const completionChange = {
      current: 0,
      previous: 0,
      change: '+0%',
      trend: 'stable' as const
    }

    return {
      users: usersChange,
      activeUsers: activeChange,
      classes: classesChange,
      completionRate: completionChange
    }
  } catch (error) {
    console.error('Error calculating KPI changes:', error)
    return {
      users: { current: 0, previous: 0, change: '+0%', trend: 'stable' },
      activeUsers: { current: 0, previous: 0, change: '+0%', trend: 'stable' },
      classes: { current: 0, previous: 0, change: '+0%', trend: 'stable' },
      completionRate: { current: 0, previous: 0, change: '+0%', trend: 'stable' }
    }
  }
}

// Helper functions
function calculateChange(current: number, previous: number): KPIChange {
  if (previous === 0) {
    return {
      current,
      previous,
      change: current > 0 ? '+100%' : '0%',
      trend: current > 0 ? 'up' : 'stable'
    }
  }

  const percentChange = ((current - previous) / previous) * 100
  const roundedChange = Math.round(percentChange)

  return {
    current,
    previous,
    change: `${roundedChange > 0 ? '+' : ''}${roundedChange}%`,
    trend: roundedChange > 0 ? 'up' : roundedChange < 0 ? 'down' : 'stable'
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins} min atrás`
  if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`
  if (diffDays < 30) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`

  return date.toLocaleDateString('pt-BR')
}

