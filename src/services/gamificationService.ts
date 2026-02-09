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

// Achievements
export async function getAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get unlock counts for each achievement
  const achievementsWithCounts = await Promise.all(
    (data || []).map(async (achievement) => {
      const { count } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('achievement_id', achievement.id)

      return {
        ...achievement,
        unlocked_count: count || 0
      }
    })
  )

  return achievementsWithCounts
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

// Ranking
export async function getRanking(limit: number = 50): Promise<RankingEntry[]> {
  try {
    // Try to use view first
    const { data, error } = await supabase
      .from('user_ranking')
      .select('*')
      .limit(limit)

    if (!error && data) return data
  } catch (e) {
    console.log('View not available, using fallback query')
  }

  // Fallback: Build ranking from user_progress directly
  const { data: progressData, error: progressError } = await supabase
    .from('user_progress')
    .select(`
      user_id,
      total_xp,
      level
    `)
    .order('total_xp', { ascending: false })
    .limit(limit)

  if (progressError) throw progressError

  // Get user details and achievements count
  const ranking: RankingEntry[] = await Promise.all(
    (progressData || []).map(async (progress, index) => {
      const { data: user } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', progress.user_id)
        .single()

      const { count } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', progress.user_id)

      return {
        user_id: progress.user_id,
        email: user?.email || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        total_xp: progress.total_xp || 0,
        level: progress.level || 1,
        achievements_count: count || 0,
        position: index + 1
      }
    })
  )

  return ranking
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

export async function addXP(
  userId: string,
  xpAmount: number,
  activityType: string,
  activityId?: string
): Promise<void> {
  // Get current progress
  const currentProgress = await getUserProgress(userId)
  const newTotalXP = (currentProgress?.total_xp || 0) + xpAmount
  
  // Calculate new level (100 XP per level for simplicity)
  const newLevel = Math.floor(newTotalXP / 100) + 1

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
  const [achievementsResult, rankingResult, progressResult] = await Promise.all([
    supabase.from('achievements').select('*', { count: 'exact', head: true }),
    supabase.from('user_achievements').select('*', { count: 'exact', head: true }),
    supabase.from('user_progress').select('total_xp')
  ])

  const totalXP = (progressResult.data || []).reduce((sum, p) => sum + (p.total_xp || 0), 0)

  return {
    totalAchievements: achievementsResult.count || 0,
    totalUnlocked: rankingResult.count || 0,
    totalXP,
    activeUsers: progressResult.data?.length || 0
  }
}

