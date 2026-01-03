import { supabase } from '@/lib/supabase/client'

/**
 * Service para gerenciar limites e conteúdo trial (degustação)
 *
 * Funcionalidades:
 * - Verificar se usuário está em turma trial
 * - Verificar se conteúdo está liberado para trial
 * - Controlar limites de uso (quiz por dia, flashcards por dia, etc.)
 * - Prover dados para componentes de bloqueio/upgrade
 */

export interface TrialLimits {
  isTrialUser: boolean
  className: string | null
  durationDays: number | null
  flashcardLimitPerDay: number | null
  quizLimitPerDay: number | null
  essaySubmissionLimit: number | null
  enrollmentDate: string | null
}

export interface TrialAllowedContent {
  subjects: string[] // IDs de matérias liberadas
  topics: string[] // IDs de tópicos liberados
  quizzes: string[] // IDs de quizzes liberados
  flashcardSets: string[] // IDs de conjuntos liberados
}

export interface ContentAccessResult {
  hasAccess: boolean
  reason?: 'trial_locked' | 'no_permission' | 'limit_exceeded' | 'allowed'
  upgradeMessage?: string
}

/**
 * Verifica se o usuário está em uma turma trial
 */
export const getUserTrialStatus = async (userId: string): Promise<TrialLimits> => {
  try {
    console.log('🔍 Verificando status trial do usuário:', userId)

    // Buscar turma trial do usuário
    const { data: studentClass, error } = await supabase
      .from('student_classes')
      .select(`
        enrollment_date,
        classes!inner(
          name,
          class_type,
          trial_duration_days,
          trial_flashcard_limit_per_day,
          trial_quiz_limit_per_day,
          trial_essay_submission_limit
        )
      `)
      .eq('user_id', userId)
      .eq('classes.class_type', 'trial')
      .single()

    if (error || !studentClass) {
      console.log('✅ Usuário não está em turma trial')
      return {
        isTrialUser: false,
        className: null,
        durationDays: null,
        flashcardLimitPerDay: null,
        quizLimitPerDay: null,
        essaySubmissionLimit: null,
        enrollmentDate: null,
      }
    }

    const classData = studentClass.classes as any

    console.log('🎯 Usuário em turma trial:', classData.name)

    return {
      isTrialUser: true,
      className: classData.name,
      durationDays: classData.trial_duration_days,
      flashcardLimitPerDay: classData.trial_flashcard_limit_per_day,
      quizLimitPerDay: classData.trial_quiz_limit_per_day,
      essaySubmissionLimit: classData.trial_essay_submission_limit,
      enrollmentDate: studentClass.enrollment_date,
    }
  } catch (error) {
    console.error('💥 Erro ao verificar status trial:', error)
    return {
      isTrialUser: false,
      className: null,
      durationDays: null,
      flashcardLimitPerDay: null,
      quizLimitPerDay: null,
      essaySubmissionLimit: null,
      enrollmentDate: null,
    }
  }
}

/**
 * Busca conteúdo liberado para trial
 */
export const getTrialAllowedContent = async (userId: string): Promise<TrialAllowedContent> => {
  try {
    console.log('🔍 Buscando conteúdo liberado para trial:', userId)

    // Buscar class_id do usuário
    const { data: studentClass } = await supabase
      .from('student_classes')
      .select('class_id, classes!inner(class_type)')
      .eq('user_id', userId)
      .eq('classes.class_type', 'trial')
      .single()

    if (!studentClass) {
      return { subjects: [], topics: [], quizzes: [], flashcardSets: [] }
    }

    // Buscar conteúdo liberado
    const { data: allowedContent, error } = await supabase
      .from('trial_allowed_content')
      .select('content_type, content_id')
      .eq('class_id', studentClass.class_id)

    if (error || !allowedContent) {
      console.error('❌ Erro ao buscar conteúdo liberado:', error)
      return { subjects: [], topics: [], quizzes: [], flashcardSets: [] }
    }

    // Agrupar por tipo
    const result: TrialAllowedContent = {
      subjects: allowedContent.filter(c => c.content_type === 'subject').map(c => c.content_id),
      topics: allowedContent.filter(c => c.content_type === 'topic').map(c => c.content_id),
      quizzes: allowedContent.filter(c => c.content_type === 'quiz').map(c => c.content_id),
      flashcardSets: allowedContent.filter(c => c.content_type === 'flashcard_set').map(c => c.content_id),
    }

    console.log('✅ Conteúdo trial liberado:', result)
    return result
  } catch (error) {
    console.error('💥 Erro ao buscar conteúdo trial:', error)
    return { subjects: [], topics: [], quizzes: [], flashcardSets: [] }
  }
}

/**
 * Verifica se um conteúdo específico está acessível para o usuário
 */
export const checkContentAccess = async (
  userId: string,
  contentType: 'subject' | 'topic' | 'quiz' | 'flashcard_set',
  contentId: string
): Promise<ContentAccessResult> => {
  try {
    // Verificar se é usuário trial
    const trialStatus = await getUserTrialStatus(userId)

    if (!trialStatus.isTrialUser) {
      // Não é trial, tem acesso baseado em permissões normais
      return { hasAccess: true, reason: 'allowed' }
    }

    // É usuário trial - verificar se conteúdo está liberado
    const allowedContent = await getTrialAllowedContent(userId)

    let isAllowed = false
    let contentName = ''

    switch (contentType) {
      case 'subject':
        isAllowed = allowedContent.subjects.includes(contentId)
        contentName = 'matéria'
        break
      case 'topic':
        isAllowed = allowedContent.topics.includes(contentId)
        contentName = 'tópico'
        break
      case 'quiz':
        isAllowed = allowedContent.quizzes.includes(contentId)
        contentName = 'quiz'
        break
      case 'flashcard_set':
        isAllowed = allowedContent.flashcardSets.includes(contentId)
        contentName = 'conjunto de flashcards'
        break
    }

    if (isAllowed) {
      return { hasAccess: true, reason: 'allowed' }
    }

    return {
      hasAccess: false,
      reason: 'trial_locked',
      upgradeMessage: `Este ${contentName} está disponível apenas para assinantes. Faça upgrade para acessar todo o conteúdo!`
    }
  } catch (error) {
    console.error('💥 Erro ao verificar acesso ao conteúdo:', error)
    return { hasAccess: false, reason: 'trial_locked' }
  }
}

/**
 * Verifica se usuário atingiu limite diário de quizzes
 */
export const checkQuizDailyLimit = async (userId: string): Promise<ContentAccessResult> => {
  try {
    const trialStatus = await getUserTrialStatus(userId)

    if (!trialStatus.isTrialUser) {
      return { hasAccess: true, reason: 'allowed' }
    }

    if (!trialStatus.quizLimitPerDay) {
      return { hasAccess: true, reason: 'allowed' }
    }

    // Contar quizzes feitos hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('user_id', userId)
      .gte('attempt_date', today.toISOString())

    if (error) {
      console.error('❌ Erro ao verificar limite de quizzes:', error)
      return { hasAccess: false, reason: 'trial_locked' }
    }

    const attemptCount = attempts?.length || 0

    if (attemptCount >= trialStatus.quizLimitPerDay) {
      return {
        hasAccess: false,
        reason: 'limit_exceeded',
        upgradeMessage: `Você atingiu o limite de ${trialStatus.quizLimitPerDay} quiz(es) por dia. Faça upgrade para acesso ilimitado!`
      }
    }

    return { hasAccess: true, reason: 'allowed' }
  } catch (error) {
    console.error('💥 Erro ao verificar limite de quizzes:', error)
    return { hasAccess: false, reason: 'trial_locked' }
  }
}

/**
 * Verifica se usuário atingiu limite diário de flashcards
 */
export const checkFlashcardDailyLimit = async (userId: string): Promise<ContentAccessResult> => {
  try {
    const trialStatus = await getUserTrialStatus(userId)

    if (!trialStatus.isTrialUser) {
      return { hasAccess: true, reason: 'allowed' }
    }

    if (!trialStatus.flashcardLimitPerDay) {
      return { hasAccess: true, reason: 'allowed' }
    }

    // Contar flashcards revisados hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: progress, error } = await supabase
      .from('flashcard_progress')
      .select('id')
      .eq('user_id', userId)
      .gte('last_reviewed_at', today.toISOString())

    if (error) {
      console.error('❌ Erro ao verificar limite de flashcards:', error)
      return { hasAccess: false, reason: 'trial_locked' }
    }

    const reviewCount = progress?.length || 0

    if (reviewCount >= trialStatus.flashcardLimitPerDay) {
      return {
        hasAccess: false,
        reason: 'limit_exceeded',
        upgradeMessage: `Você atingiu o limite de ${trialStatus.flashcardLimitPerDay} flashcards por dia. Faça upgrade para acesso ilimitado!`
      }
    }

    return { hasAccess: true, reason: 'allowed' }
  } catch (error) {
    console.error('💥 Erro ao verificar limite de flashcards:', error)
    return { hasAccess: false, reason: 'trial_locked' }
  }
}

/**
 * Dados para exibir modal/banner de upgrade
 */
export const getUpgradeCallToAction = (trialStatus: TrialLimits) => {
  if (!trialStatus.isTrialUser) return null

  return {
    title: '🚀 Desbloqueie Todo o Conteúdo!',
    description: 'Você está em modo degustação. Faça upgrade para ter acesso completo a todas as matérias, quizzes, flashcards e muito mais!',
    benefits: [
      '✅ Acesso ilimitado a todas as matérias',
      '✅ Todos os tópicos e conteúdos',
      '✅ Quizzes e simulados ilimitados',
      '✅ Flashcards sem limites diários',
      '✅ Sistema de redações completo',
      '✅ Evercast e videoaulas',
      '✅ Suporte prioritário',
    ],
    ctaButton: 'Fazer Upgrade Agora',
    ctaLink: '/upgrade',
  }
}

export type { TrialLimits, TrialAllowedContent, ContentAccessResult }
