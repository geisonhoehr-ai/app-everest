import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getUserTrialStatus,
  getTrialAllowedContent,
  checkContentAccess,
  checkQuizDailyLimit,
  checkFlashcardDailyLimit,
  getUpgradeCallToAction,
  type TrialLimits,
  type TrialAllowedContent,
  type ContentAccessResult,
} from '@/services/trialLimitsService'

interface UseTrialLimitsReturn {
  isTrialUser: boolean
  trialStatus: TrialLimits | null
  allowedContent: TrialAllowedContent | null
  loading: boolean
  hasAccessToContent: (
    contentType: 'subject' | 'topic' | 'quiz' | 'flashcard_set',
    contentId: string
  ) => Promise<ContentAccessResult>
  canDoQuiz: () => Promise<ContentAccessResult>
  canStudyFlashcards: () => Promise<ContentAccessResult>
  getUpgradeCTA: () => any
  refresh: () => Promise<void>
}

/**
 * Hook principal para gerenciar status e limites de trial
 *
 * @example
 * ```tsx
 * const { isTrialUser, hasAccessToContent, getUpgradeCTA } = useTrialLimits()
 *
 * // Verificar acesso a um tópico
 * const access = await hasAccessToContent('topic', topicId)
 * if (!access.hasAccess) {
 *   // Mostrar componente de upgrade
 * }
 * ```
 */
export const useTrialLimits = (): UseTrialLimitsReturn => {
  const { profile, isAuthenticated } = useAuth()
  const [trialStatus, setTrialStatus] = useState<TrialLimits | null>(null)
  const [allowedContent, setAllowedContent] = useState<TrialAllowedContent | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar status trial
  const loadTrialData = useCallback(async () => {
    if (!isAuthenticated || !profile) {
      setTrialStatus(null)
      setAllowedContent(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [status, content] = await Promise.all([
        getUserTrialStatus(profile.id),
        getTrialAllowedContent(profile.id),
      ])

      setTrialStatus(status)
      setAllowedContent(content)
    } catch (error) {
      console.error('❌ Erro ao carregar dados trial:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, profile])

  useEffect(() => {
    loadTrialData()
  }, [loadTrialData])

  // Verificar acesso a conteúdo específico
  const hasAccessToContent = useCallback(
    async (
      contentType: 'subject' | 'topic' | 'quiz' | 'flashcard_set',
      contentId: string
    ): Promise<ContentAccessResult> => {
      if (!profile) {
        return { hasAccess: false, reason: 'trial_locked' }
      }
      return await checkContentAccess(profile.id, contentType, contentId)
    },
    [profile]
  )

  // Verificar se pode fazer quiz
  const canDoQuiz = useCallback(async (): Promise<ContentAccessResult> => {
    if (!profile) {
      return { hasAccess: false, reason: 'trial_locked' }
    }
    return await checkQuizDailyLimit(profile.id)
  }, [profile])

  // Verificar se pode estudar flashcards
  const canStudyFlashcards = useCallback(async (): Promise<ContentAccessResult> => {
    if (!profile) {
      return { hasAccess: false, reason: 'trial_locked' }
    }
    return await checkFlashcardDailyLimit(profile.id)
  }, [profile])

  // Obter dados para CTA de upgrade
  const getUpgradeCTA = useCallback(() => {
    if (!trialStatus) return null
    return getUpgradeCallToAction(trialStatus)
  }, [trialStatus])

  return {
    isTrialUser: trialStatus?.isTrialUser || false,
    trialStatus,
    allowedContent,
    loading,
    hasAccessToContent,
    canDoQuiz,
    canStudyFlashcards,
    getUpgradeCTA,
    refresh: loadTrialData,
  }
}

/**
 * Hook simplificado para verificar se é usuário trial
 *
 * @example
 * ```tsx
 * const isTrialUser = useIsTrialUser()
 * ```
 */
export const useIsTrialUser = (): boolean => {
  const { isTrialUser } = useTrialLimits()
  return isTrialUser
}

/**
 * Hook para componentes que precisam bloquear acesso
 *
 * @example
 * ```tsx
 * const { isLocked, upgradeMessage } = useContentLock('topic', topicId)
 *
 * if (isLocked) {
 *   return <UpgradeOverlay message={upgradeMessage} />
 * }
 * ```
 */
export const useContentLock = (
  contentType: 'subject' | 'topic' | 'quiz' | 'flashcard_set',
  contentId: string
) => {
  const { hasAccessToContent } = useTrialLimits()
  const [isLocked, setIsLocked] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true)
      const access = await hasAccessToContent(contentType, contentId)
      setIsLocked(!access.hasAccess)
      setUpgradeMessage(access.upgradeMessage || null)
      setLoading(false)
    }

    checkAccess()
  }, [contentType, contentId, hasAccessToContent])

  return { isLocked, upgradeMessage, loading }
}
