import { supabase } from '@/lib/supabase/client'

export interface Achievement {
  id: string
  name: string
  description: string
  icon_url: string
  xp_reward: number
  category: string
  created_at: string
  unlocked_count?: number
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  achieved_at: string
  achievement?: Achievement
}

export interface RankingEntry {
  user_id: string
  email: string
  first_name: string
  last_name: string
  total_xp: number
  level: number
  achievements_count: number
  position: number
}

export interface UserProgress {
  user_id: string
  total_xp: number
  level: number
  current_streak_days: number
  longest_streak_days: number
  last_activity_date: string
}

// Achievements (optimized: 2 queries instead of 1+N)
export async function getAchievements(): Promise<Achievement[]> {
  const [achievementsResult, countsResult] = await Promise.all([
    supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('user_achievements')
      .select('achievement_id'),
  ])

  if (achievementsResult.error) throw achievementsResult.error

  // Count unlocks per achievement in memory
  const unlockCounts = new Map<string, number>()
  for (const ua of countsResult.data || []) {
    unlockCounts.set(ua.achievement_id, (unlockCounts.get(ua.achievement_id) || 0) + 1)
  }

  return (achievementsResult.data || []).map(achievement => ({
    ...achievement,
    unlocked_count: unlockCounts.get(achievement.id) || 0,
  }))
}

export async function createAchievement(achievement: {
  name: string
  description: string
  icon_url: string
  xp_reward: number
  category: string
}): Promise<Achievement> {
  const { data, error } = await supabase
    .from('achievements')
    .insert(achievement)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAchievement(
  achievementId: string,
  updates: Partial<Achievement>
): Promise<Achievement> {
  const { data, error } = await supabase
    .from('achievements')
    .update(updates)
    .eq('id', achievementId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAchievement(achievementId: string): Promise<void> {
  const { error } = await supabase
    .from('achievements')
    .delete()
    .eq('id', achievementId)

  if (error) throw error
}

// User Achievements
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function unlockAchievement(userId: string, achievementId: string): Promise<void> {
  const { error } = await supabase
    .from('user_achievements')
    .insert({
      user_id: userId,
      achievement_id: achievementId
    })

  if (error) throw error
}

// Ranking by Class (turma)
export async function getRankingByClass(classId: string, limit: number = 50): Promise<RankingEntry[]> {
  try {
    // Get student IDs in this class
    const { data: classStudents, error: classError } = await supabase
      .from('student_classes')
      .select('user_id')
      .eq('class_id', classId)

    if (classError || !classStudents || classStudents.length === 0) return []

    const studentIds = classStudents.map(s => s.user_id)

    // Try view first
    try {
      const { data, error } = await supabase
        .from('user_ranking')
        .select('*')
        .in('user_id', studentIds)
        .limit(limit)

      if (!error && data && data.length > 0) {
        return data.map((entry, index) => ({ ...entry, position: index + 1 }))
      }
    } catch {
      // View not available
    }

    // Fallback: Build from user_progress (optimized: 3 queries instead of 2×N)
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('user_id, total_xp, level')
      .in('user_id', studentIds)
      .order('total_xp', { ascending: false })
      .limit(limit)

    if (progressError || !progressData || progressData.length === 0) return []

    const userIds = progressData.map(p => p.user_id)

    // Batch fetch users and achievement counts
    const [usersResult, achievementsResult] = await Promise.all([
      supabase.from('users').select('id, email, first_name, last_name').in('id', userIds),
      supabase.from('user_achievements').select('user_id').in('user_id', userIds),
    ])

    const usersMap = new Map((usersResult.data || []).map(u => [u.id, u]))
    const achievementCounts = new Map<string, number>()
    for (const ua of achievementsResult.data || []) {
      achievementCounts.set(ua.user_id, (achievementCounts.get(ua.user_id) || 0) + 1)
    }

    return progressData.map((progress, index) => {
      const user = usersMap.get(progress.user_id)
      return {
        user_id: progress.user_id,
        email: user?.email || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        total_xp: progress.total_xp || 0,
        level: progress.level || 1,
        achievements_count: achievementCounts.get(progress.user_id) || 0,
        position: index + 1,
      }
    })
  } catch {
    return []
  }
}

// Get student's class IDs
export async function getStudentClassIds(userId: string): Promise<{ class_id: string; class_name: string }[]> {
  try {
    const { data, error } = await supabase
      .from('student_classes')
      .select('class_id, classes(name)')
      .eq('user_id', userId)

    if (error || !data) return []

    return data.map((sc: any) => ({
      class_id: sc.class_id,
      class_name: sc.classes?.name || 'Turma'
    }))
  } catch {
    return []
  }
}

// Ranking
export async function getRanking(limit: number = 50): Promise<RankingEntry[]> {
  try {
    // Try to use view first
    const { data, error } = await supabase
      .from('user_ranking')
      .select('*')
      .limit(limit)

    if (!error && data) return data
  } catch {
    // View not available
  }

  try {
    // Fallback: Build ranking from user_progress (optimized: 3 queries instead of 2×N)
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('user_id, total_xp, level')
      .order('total_xp', { ascending: false })
      .limit(limit)

    if (progressError || !progressData || progressData.length === 0) return []

    const userIds = progressData.map(p => p.user_id)

    // Batch fetch users and achievement counts
    const [usersResult, achievementsResult] = await Promise.all([
      supabase.from('users').select('id, email, first_name, last_name').in('id', userIds),
      supabase.from('user_achievements').select('user_id').in('user_id', userIds),
    ])

    const usersMap = new Map((usersResult.data || []).map(u => [u.id, u]))
    const achievementCounts = new Map<string, number>()
    for (const ua of achievementsResult.data || []) {
      achievementCounts.set(ua.user_id, (achievementCounts.get(ua.user_id) || 0) + 1)
    }

    return progressData.map((progress, index) => {
      const user = usersMap.get(progress.user_id)
      return {
        user_id: progress.user_id,
        email: user?.email || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        total_xp: progress.total_xp || 0,
        level: progress.level || 1,
        achievements_count: achievementCounts.get(progress.user_id) || 0,
        position: index + 1,
      }
    })
  } catch {
    return []
  }
}

// User Progress
export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('user_id, total_xp, level, current_streak_days, longest_streak_days, last_activity_date')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  
  return data
}

export async function updateUserProgress(
  userId: string,
  updates: {
    total_xp?: number
    level?: number
    current_streak_days?: number
    longest_streak_days?: number
    last_activity_date?: string
  }
): Promise<void> {
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      ...updates
    })

  if (error) throw error
}

/**
 * Calcula nível baseado no XP total.
 *   Nv 1: 0–1000 | Nv 2: 1001–2500 | Nv 3: 2501–5000
 *   Nv 4: 5001–10000 | Nv 5: 10001–20000 | Nv 6: 20001+
 */
function calculateLevel(totalXP: number): number {
  if (totalXP <= 1000) return 1
  if (totalXP <= 2500) return 2
  if (totalXP <= 5000) return 3
  if (totalXP <= 10000) return 4
  if (totalXP <= 20000) return 5
  return 6
}

export async function addXP(
  userId: string,
  xpAmount: number,
  activityType: string,
  activityId?: string
): Promise<void> {
  // Get current progress
  const currentProgress = await getUserProgress(userId)
  const newTotalXP = (currentProgress?.total_xp || 0) + xpAmount
  const newLevel = calculateLevel(newTotalXP)

  // Update progress
  await updateUserProgress(userId, {
    total_xp: newTotalXP,
    level: newLevel,
    last_activity_date: new Date().toISOString().split('T')[0]
  })

  // Record in scores table
  await supabase
    .from('scores')
    .insert({
      user_id: userId,
      score_value: xpAmount,
      activity_type: activityType,
      activity_id: activityId
    })
}

// Global Stats
export async function getGamificationStats() {
  try {
    const [achievementsResult, rankingResult, progressResult] = await Promise.all([
      supabase.from('achievements').select('*', { count: 'exact', head: true }),
      supabase.from('user_achievements').select('*', { count: 'exact', head: true }),
      supabase.from('user_progress').select('total_xp'),
    ])

    const totalXP = (progressResult.data || []).reduce((sum, p) => sum + (p.total_xp || 0), 0)

    return {
      totalAchievements: achievementsResult.count || 0,
      totalUnlocked: rankingResult.count || 0,
      totalXP,
      activeUsers: progressResult.data?.length || 0,
    }
  } catch {
    return { totalAchievements: 0, totalUnlocked: 0, totalXP: 0, activeUsers: 0 }
  }
}

