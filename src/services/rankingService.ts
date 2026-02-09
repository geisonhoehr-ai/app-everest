import { supabase } from '@/lib/supabase/client'

export interface UserRanking {
  user_id: string
  first_name: string
  last_name: string
  email: string
  rank_position: number
  total_xp: number
  total_xp_activity?: number
  total_xp_general?: number
  role: 'student' | 'teacher' | 'administrator'
}

export interface UserPosition {
  user_id: string
  first_name: string
  last_name: string
  email: string
  rank_position: number
  total_xp: number
  role: 'student' | 'teacher' | 'administrator'
}

export interface SubjectRanking {
  user_id: string
  first_name: string
  last_name: string
  email: string
  rank_position: number
  total_xp_activity: number
  total_xp_general: number
}

export interface ScoreHistory {
  id: string
  activity_id: string
  activity_type: string
  score_value: number
  recorded_at: string
}

export interface XPStatistics {
  total_users: number
  total_xp_distributed: number
  average_xp: number
  max_xp: number
  min_xp: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon_url?: string
  xp_reward: number
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  achieved_at: string
  achievement: Achievement
}

export interface LevelInfo {
  level: number
  title: string
  min_xp: number
  max_xp: number
  color: string
  icon: string
  description: string
}

export const rankingService = {
  // Buscar ranking geral de usuários
  async getUserRanking(limit: number = 50): Promise<UserRanking[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_ranking', {
        p_limit: limit
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar ranking de usuários:', error)
      return []
    }
  },

  // Buscar posição específica do usuário
  async getUserPosition(userId: string): Promise<UserPosition | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_rank_position', {
        p_user_id: userId
      })

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Erro ao buscar posição do usuário:', error)
      return null
    }
  },

  // Buscar ranking por tipo de atividade
  async getRankingByActivity(activityType: string, limit: number = 50): Promise<SubjectRanking[]> {
    try {
      const { data, error } = await supabase.rpc('get_ranking_by_activity_type', {
        p_activity_type: activityType,
        p_limit: limit
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar ranking por atividade:', error)
      return []
    }
  },

  // Adicionar pontuação para usuário
  async addUserScore(
    userId: string, 
    activityType: string, 
    scoreValue: number, 
    activityId?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('add_user_score', {
        p_user_id: userId,
        p_activity_type: activityType,
        p_score_value: scoreValue,
        p_activity_id: activityId
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao adicionar pontuação:', error)
      return false
    }
  },

  // Buscar histórico de pontuação do usuário
  async getUserScoreHistory(userId: string, limit: number = 20): Promise<ScoreHistory[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_score_history', {
        p_user_id: userId,
        p_limit: limit
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico de pontuação:', error)
      return []
    }
  },

  // Buscar estatísticas gerais de XP
  async getXPStatistics(): Promise<XPStatistics | null> {
    try {
      const { data, error } = await supabase.rpc('get_xp_statistics')

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Erro ao buscar estatísticas de XP:', error)
      return null
    }
  },

  // Buscar conquistas disponíveis
  async getAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('xp_reward', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error)
      return []
    }
  },

  // Buscar conquistas do usuário
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
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
    } catch (error) {
      console.error('Erro ao buscar conquistas do usuário:', error)
      return []
    }
  },

  // Verificar e conceder conquistas
  async checkAndGrantAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      // Buscar conquistas já obtidas
      const userAchievements = await this.getUserAchievements(userId)
      const achievedIds = userAchievements.map(ua => ua.achievement_id)

      // Buscar todas as conquistas
      const allAchievements = await this.getAchievements()
      const availableAchievements = allAchievements.filter(a => !achievedIds.includes(a.id))

      // Buscar estatísticas do usuário para verificar conquistas
      const userPosition = await this.getUserPosition(userId)
      const scoreHistory = await this.getUserScoreHistory(userId, 100)

      const newAchievements: UserAchievement[] = []

      for (const achievement of availableAchievements) {
        let shouldGrant = false

        // Lógica para diferentes tipos de conquistas
        switch (achievement.name.toLowerCase()) {
          case 'primeiro login':
            if (scoreHistory.length > 0) {
              shouldGrant = true
            }
            break
          case 'estudante dedicado':
            if (userPosition && userPosition.total_xp >= 100) {
              shouldGrant = true
            }
            break
          case 'top 10':
            if (userPosition && userPosition.rank_position <= 10) {
              shouldGrant = true
            }
            break
          case 'maratonista':
            if (scoreHistory.length >= 7) {
              shouldGrant = true
            }
            break
          case 'especialista':
            if (userPosition && userPosition.total_xp >= 500) {
              shouldGrant = true
            }
            break
        }

        if (shouldGrant) {
          // Conceder conquista
          const { data, error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id
            })
            .select(`
              *,
              achievement:achievements(*)
            `)
            .single()

          if (!error && data) {
            newAchievements.push(data)
            // Adicionar XP da conquista
            await this.addUserScore(userId, 'achievement', achievement.xp_reward, achievement.id)
          }
        }
      }

      return newAchievements
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error)
      return []
    }
  },

  // Calcular informações do nível do usuário
  calculateLevelInfo(totalXP: number): LevelInfo {
    const levels: LevelInfo[] = [
      {
        level: 1,
        title: 'Iniciante',
        min_xp: 0,
        max_xp: 100,
        color: 'from-gray-400 to-gray-600',
        icon: '🥉',
        description: 'Começando sua jornada de aprendizado'
      },
      {
        level: 2,
        title: 'Estudante',
        min_xp: 101,
        max_xp: 300,
        color: 'from-blue-400 to-blue-600',
        icon: '🥈',
        description: 'Desenvolvendo suas habilidades'
      },
      {
        level: 3,
        title: 'Aprendiz',
        min_xp: 301,
        max_xp: 600,
        color: 'from-green-400 to-green-600',
        icon: '🥇',
        description: 'Demonstrando dedicação'
      },
      {
        level: 4,
        title: 'Especialista',
        min_xp: 601,
        max_xp: 1000,
        color: 'from-purple-400 to-purple-600',
        icon: '💎',
        description: 'Dominando o conhecimento'
      },
      {
        level: 5,
        title: 'Mestre',
        min_xp: 1001,
        max_xp: 2000,
        color: 'from-orange-400 to-orange-600',
        icon: '👑',
        description: 'Líder em aprendizado'
      },
      {
        level: 6,
        title: 'Lenda',
        min_xp: 2001,
        max_xp: 999999,
        color: 'from-yellow-400 to-yellow-600',
        icon: '🌟',
        description: 'Ícone do conhecimento'
      }
    ]

    const currentLevel = levels.find(level => totalXP >= level.min_xp && totalXP <= level.max_xp) || levels[0]
    const nextLevel = levels.find(level => level.level === currentLevel.level + 1)
    
    return {
      ...currentLevel,
      max_xp: nextLevel ? nextLevel.min_xp - 1 : currentLevel.max_xp
    }
  },

  // Calcular progresso para próximo nível
  calculateProgressToNext(totalXP: number): { progress: number; xpToNext: number } {
    const levelInfo = this.calculateLevelInfo(totalXP)
    const xpInLevel = totalXP - levelInfo.min_xp
    const xpNeededForLevel = levelInfo.max_xp - levelInfo.min_xp
    const progress = Math.min(100, (xpInLevel / xpNeededForLevel) * 100)
    const xpToNext = Math.max(0, levelInfo.max_xp - totalXP)

    return { progress, xpToNext }
  }
}
