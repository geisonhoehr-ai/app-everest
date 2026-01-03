import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-provider'
import { rankingService, type UserAchievement } from '@/services/rankingService'
import { useAchievementNotifications } from '@/components/achievements/AchievementNotification'

export function useAchievements() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const { addNotification } = useAchievementNotifications()

  // Carregar conquistas do usuário
  const loadUserAchievements = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const achievements = await rankingService.getUserAchievements(user.id)
      setUserAchievements(achievements)
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Verificar e conceder conquista de primeiro login para novos usuários
  const grantFirstLoginAchievement = useCallback(async () => {
    if (!user?.id) return

    try {
      const hasFirstLoginKey = localStorage.getItem(`first_login_checked_${user.id}`)

      // Se já verificamos antes, não verificar novamente
      if (hasFirstLoginKey) return

      // Buscar conquistas do usuário
      const userAchievements = await rankingService.getUserAchievements(user.id)

      // Verificar se já tem a conquista "Primeiro Login"
      const hasFirstLogin = userAchievements.some(ua =>
        ua.achievement.name.toLowerCase() === 'primeiro login'
      )

      // Se não tem, conceder
      if (!hasFirstLogin) {
        console.log('🎉 Concedendo conquista de Primeiro Login para novo usuário')

        // Adicionar uma pontuação inicial para ativar a conquista
        await rankingService.addUserScore(user.id, 'login', 5, 'first-login')

        // Verificar e conceder conquistas
        await checkAndGrantAchievements()
      }

      // Marcar como verificado
      localStorage.setItem(`first_login_checked_${user.id}`, 'true')
    } catch (error) {
      console.error('Erro ao conceder conquista de primeiro login:', error)
    }
  }, [user?.id])

  // Verificar e conceder conquistas
  const checkAndGrantAchievements = useCallback(async () => {
    if (!user?.id) return

    try {
      const newAchievements = await rankingService.checkAndGrantAchievements(user.id)
      
      if (newAchievements.length > 0) {
        // Atualizar lista local
        setUserAchievements(prev => [...newAchievements, ...prev])
        
        // Mostrar notificações
        newAchievements.forEach(achievement => {
          addNotification(achievement)
        })
      }
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error)
    }
  }, [user?.id, addNotification])

  // Adicionar pontuação e verificar conquistas
  const addScoreAndCheckAchievements = useCallback(async (
    activityType: string,
    scoreValue: number,
    activityId?: string
  ) => {
    if (!user?.id) return

    try {
      // Adicionar pontuação
      const success = await rankingService.addUserScore(
        user.id,
        activityType,
        scoreValue,
        activityId
      )

      if (success) {
        // Verificar conquistas após adicionar pontuação
        await checkAndGrantAchievements()
      }
    } catch (error) {
      console.error('Erro ao adicionar pontuação:', error)
    }
  }, [user?.id, checkAndGrantAchievements])

  // Carregar conquistas na inicialização
  useEffect(() => {
    loadUserAchievements()
  }, [loadUserAchievements])

  // Verificar e conceder conquista de primeiro login ao carregar
  useEffect(() => {
    if (user?.id) {
      grantFirstLoginAchievement()
    }
  }, [user?.id, grantFirstLoginAchievement])

  return {
    userAchievements,
    isLoading,
    loadUserAchievements,
    checkAndGrantAchievements,
    addScoreAndCheckAchievements,
    grantFirstLoginAchievement
  }
}

// Hook para atividades específicas
export function useActivityScoring() {
  const { addScoreAndCheckAchievements } = useAchievements()

  // Pontuação para flashcards
  const scoreFlashcardActivity = useCallback(async (
    correctAnswers: number,
    totalCards: number,
    sessionId: string
  ) => {
    const accuracy = correctAnswers / totalCards
    let baseScore = totalCards * 2 // 2 XP por card

    // Bônus por precisão
    if (accuracy >= 0.9) baseScore *= 1.5 // 50% bônus para 90%+ precisão
    else if (accuracy >= 0.8) baseScore *= 1.2 // 20% bônus para 80%+ precisão

    // Bônus por quantidade
    if (totalCards >= 50) baseScore *= 1.3 // 30% bônus para 50+ cards
    else if (totalCards >= 20) baseScore *= 1.1 // 10% bônus para 20+ cards

    await addScoreAndCheckAchievements('flashcard', Math.round(baseScore), sessionId)
  }, [addScoreAndCheckAchievements])

  // Pontuação para quizzes
  const scoreQuizActivity = useCallback(async (
    correctAnswers: number,
    totalQuestions: number,
    timeSpent: number,
    quizId: string
  ) => {
    const accuracy = correctAnswers / totalQuestions
    let baseScore = totalQuestions * 3 // 3 XP por questão

    // Bônus por precisão
    if (accuracy >= 0.9) baseScore *= 1.5
    else if (accuracy >= 0.8) baseScore *= 1.2

    // Bônus por velocidade (menos tempo = mais XP)
    const timeBonus = Math.max(0.5, 1 - (timeSpent / (totalQuestions * 60))) // 1 minuto por questão como referência
    baseScore *= timeBonus

    await addScoreAndCheckAchievements('quiz', Math.round(baseScore), quizId)
  }, [addScoreAndCheckAchievements])

  // Pontuação para redações
  const scoreEssayActivity = useCallback(async (
    essayId: string,
    wordCount: number,
    quality: number // 1-5
  ) => {
    let baseScore = Math.min(wordCount / 10, 50) // 1 XP por 10 palavras, máximo 50

    // Bônus por qualidade
    baseScore *= (quality / 5) * 2 // Até 2x bônus baseado na qualidade

    await addScoreAndCheckAchievements('essay', Math.round(baseScore), essayId)
  }, [addScoreAndCheckAchievements])

  // Pontuação para simulados
  const scoreSimulationActivity = useCallback(async (
    correctAnswers: number,
    totalQuestions: number,
    simulationId: string
  ) => {
    const accuracy = correctAnswers / totalQuestions
    let baseScore = totalQuestions * 5 // 5 XP por questão (simulados valem mais)

    // Bônus por precisão
    if (accuracy >= 0.8) baseScore *= 1.5
    else if (accuracy >= 0.7) baseScore *= 1.2

    await addScoreAndCheckAchievements('simulation', Math.round(baseScore), simulationId)
  }, [addScoreAndCheckAchievements])

  // Pontuação para participação no fórum
  const scoreForumActivity = useCallback(async (
    activityType: 'post' | 'reply' | 'like',
    postId: string
  ) => {
    const scores = {
      post: 10,
      reply: 5,
      like: 1
    }

    await addScoreAndCheckAchievements('forum', scores[activityType], postId)
  }, [addScoreAndCheckAchievements])

  // Pontuação para cursos
  const scoreCourseActivity = useCallback(async (
    lessonId: string,
    progressPercentage: number
  ) => {
    const baseScore = Math.round(progressPercentage * 0.5) // 0.5 XP por % de progresso

    await addScoreAndCheckAchievements('course', baseScore, lessonId)
  }, [addScoreAndCheckAchievements])

  return {
    scoreFlashcardActivity,
    scoreQuizActivity,
    scoreEssayActivity,
    scoreSimulationActivity,
    scoreForumActivity,
    scoreCourseActivity
  }
}
