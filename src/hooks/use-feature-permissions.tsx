import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getUserAllowedFeatures,
  hasFeaturePermission,
  type FeatureKey,
  FEATURE_KEYS,
} from '@/services/classPermissionsService'

interface UseFeaturePermissionsReturn {
  allowedFeatures: FeatureKey[]
  loading: boolean
  hasFeature: (featureKey: FeatureKey) => boolean
  checkFeature: (featureKey: FeatureKey) => Promise<boolean>
  refresh: () => Promise<void>
}

/**
 * Hook para gerenciar permissões de recursos por turma
 *
 * Este hook é específico para alunos e verifica automaticamente
 * quais recursos eles podem acessar baseado nas turmas em que estão matriculados.
 *
 * Para professores e administradores, sempre retorna TODAS as permissões.
 *
 * @example
 * ```tsx
 * const { hasFeature, loading } = useFeaturePermissions()
 *
 * if (loading) return <Spinner />
 *
 * return (
 *   <>
 *     {hasFeature(FEATURE_KEYS.FLASHCARDS) && <FlashcardSection />}
 *     {hasFeature(FEATURE_KEYS.QUIZ) && <QuizSection />}
 *   </>
 * )
 * ```
 */
export const useFeaturePermissions = (): UseFeaturePermissionsReturn => {
  const { profile, isStudent, isAuthenticated } = useAuth()
  const [allowedFeatures, setAllowedFeatures] = useState<FeatureKey[]>([])
  const [loading, setLoading] = useState(true)

  // Função para carregar as permissões
  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated || !profile) {
      setAllowedFeatures([])
      setLoading(false)
      return
    }

    // Se não for aluno (professor ou admin), tem acesso a TUDO
    if (!isStudent) {
      const allFeatures = Object.values(FEATURE_KEYS) as FeatureKey[]
      setAllowedFeatures(allFeatures)
      setLoading(false)
      console.log('✅ Usuário não-aluno tem acesso a todos os recursos')
      return
    }

    // Se for aluno, busca as permissões baseadas nas turmas
    // Evita recarregar se já temos permissões
    if (allowedFeatures.length > 0) {
      console.log('⏭️ Permissões já carregadas, pulando...')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const features = await getUserAllowedFeatures(profile.id)
      setAllowedFeatures(features)
      console.log(`✅ Permissões carregadas para aluno: ${features.length} recursos`)
    } catch (error) {
      console.error('❌ Erro ao carregar permissões:', error)
      setAllowedFeatures([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, profile, isStudent, allowedFeatures.length])

  // Carregar permissões quando o hook é montado ou quando o usuário muda
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // Função síncrona para verificar se tem acesso a um recurso
  // (usa o cache local)
  const hasFeature = useCallback(
    (featureKey: FeatureKey): boolean => {
      // Se não estiver autenticado, não tem acesso
      if (!isAuthenticated || !profile) return false

      // Se não for aluno, tem acesso a tudo
      if (!isStudent) return true

      // Se for aluno, verifica no cache
      return allowedFeatures.includes(featureKey)
    },
    [isAuthenticated, profile, isStudent, allowedFeatures]
  )

  // Função assíncrona para verificar permissão
  // (faz uma nova consulta ao banco - use com moderação)
  const checkFeature = useCallback(
    async (featureKey: FeatureKey): Promise<boolean> => {
      if (!isAuthenticated || !profile) return false
      if (!isStudent) return true
      return await hasFeaturePermission(profile.id, featureKey)
    },
    [isAuthenticated, profile, isStudent]
  )

  // Função para forçar refresh das permissões
  const refresh = useCallback(async () => {
    await loadPermissions()
  }, [loadPermissions])

  return {
    allowedFeatures,
    loading,
    hasFeature,
    checkFeature,
    refresh,
  }
}

/**
 * Hook para verificar uma permissão específica
 *
 * Mais simples que o useFeaturePermissions quando você só precisa
 * verificar uma única permissão.
 *
 * @example
 * ```tsx
 * const canAccessFlashcards = useHasFeature(FEATURE_KEYS.FLASHCARDS)
 *
 * if (!canAccessFlashcards) {
 *   return <AccessDenied />
 * }
 * ```
 */
export const useHasFeature = (featureKey: FeatureKey): boolean => {
  const { hasFeature } = useFeaturePermissions()
  return hasFeature(featureKey)
}

/**
 * Hook para exigir uma permissão específica
 *
 * Lança um erro se o usuário não tiver a permissão necessária.
 * Útil para componentes que DEVEM ter a permissão.
 *
 * @example
 * ```tsx
 * const FlashcardPage = () => {
 *   useRequireFeature(FEATURE_KEYS.FLASHCARDS)
 *   return <FlashcardContent />
 * }
 * ```
 */
export const useRequireFeature = (featureKey: FeatureKey): void => {
  const { hasFeature, loading } = useFeaturePermissions()

  useEffect(() => {
    if (!loading && !hasFeature(featureKey)) {
      throw new Error(`Acesso negado: recurso '${featureKey}' não disponível`)
    }
  }, [featureKey, hasFeature, loading])
}
