import { supabase } from '@/lib/supabase/client'

/**
 * Service para gerenciar permissões de recursos por turma (class_feature_permissions)
 *
 * Este serviço gerencia o controle granular de acesso de alunos aos recursos
 * da plataforma baseado na turma em que estão matriculados.
 */

export interface ClassFeaturePermission {
  id: string
  class_id: string
  feature_key: string
  created_at: string
  updated_at: string
}

/**
 * Chaves de recursos disponíveis na plataforma
 */
export const FEATURE_KEYS = {
  FLASHCARDS: 'flashcards',
  QUIZ: 'quiz',
  EVERCAST: 'evercast',
  ESSAYS: 'essays',
  RANKING: 'ranking',
  VIDEO_LESSONS: 'video_lessons',
  AUDIO_LESSONS: 'audio_lessons',
  CALENDAR: 'calendar',
} as const

export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS]

/**
 * Busca as permissões de recursos de uma turma específica
 */
export const getClassFeaturePermissions = async (
  classId: string
): Promise<ClassFeaturePermission[]> => {
  try {
    console.log('🔍 Buscando permissões de recursos da turma:', classId)

    const { data, error } = await supabase
      .from('class_feature_permissions')
      .select('*')
      .eq('class_id', classId)

    if (error) {
      console.error('❌ Erro ao buscar permissões de recursos:', error)
      return []
    }

    console.log(`✅ Encontradas ${data?.length || 0} permissões de recursos`)
    return data || []
  } catch (error) {
    console.error('💥 Erro de rede ao buscar permissões de recursos:', error)
    return []
  }
}

/**
 * Busca as feature_keys permitidas para um usuário específico
 * com base em suas turmas matriculadas
 */
export const getUserAllowedFeatures = async (
  userId: string
): Promise<FeatureKey[]> => {
  try {
    console.log('🔍 Buscando recursos permitidos para o usuário:', userId)

    // 1. Buscar turmas do aluno
    const { data: studentClasses, error: classError } = await supabase
      .from('student_classes')
      .select('class_id')
      .eq('user_id', userId)

    if (classError) {
      console.error('❌ Erro ao buscar turmas do aluno:', classError)
      return []
    }

    if (!studentClasses || studentClasses.length === 0) {
      console.log('⚠️ Aluno não está matriculado em nenhuma turma')
      return []
    }

    const classIds = studentClasses.map(sc => sc.class_id)
    console.log(`📚 Aluno matriculado em ${classIds.length} turma(s)`)

    // 2. Buscar permissões de todas as turmas do aluno
    const { data: permissions, error: permError } = await supabase
      .from('class_feature_permissions')
      .select('feature_key')
      .in('class_id', classIds)

    if (permError) {
      console.error('❌ Erro ao buscar permissões de recursos:', permError)
      return []
    }

    // 3. Remover duplicatas e retornar apenas as feature_keys
    const uniqueFeatures = [...new Set(permissions?.map(p => p.feature_key) || [])]
    console.log(`✅ Usuário tem acesso a ${uniqueFeatures.length} recursos:`, uniqueFeatures)

    return uniqueFeatures as FeatureKey[]
  } catch (error) {
    console.error('💥 Erro de rede ao buscar recursos permitidos:', error)
    return []
  }
}

/**
 * Verifica se um usuário tem permissão para acessar um recurso específico
 */
export const hasFeaturePermission = async (
  userId: string,
  featureKey: FeatureKey
): Promise<boolean> => {
  try {
    const allowedFeatures = await getUserAllowedFeatures(userId)
    const hasPermission = allowedFeatures.includes(featureKey)

    console.log(
      hasPermission
        ? `✅ Usuário tem permissão para: ${featureKey}`
        : `🚫 Usuário NÃO tem permissão para: ${featureKey}`
    )

    return hasPermission
  } catch (error) {
    console.error('💥 Erro ao verificar permissão:', error)
    return false
  }
}

/**
 * Adiciona uma permissão de recurso a uma turma
 * (APENAS para uso administrativo)
 */
export const addClassFeaturePermission = async (
  classId: string,
  featureKey: FeatureKey
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`➕ Adicionando permissão ${featureKey} à turma ${classId}`)

    const { error } = await supabase
      .from('class_feature_permissions')
      .insert({
        class_id: classId,
        feature_key: featureKey,
      })

    if (error) {
      console.error('❌ Erro ao adicionar permissão:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Permissão adicionada com sucesso')
    return { success: true }
  } catch (error) {
    console.error('💥 Erro de rede ao adicionar permissão:', error)
    return { success: false, error: 'Erro de rede' }
  }
}

/**
 * Remove uma permissão de recurso de uma turma
 * (APENAS para uso administrativo)
 */
export const removeClassFeaturePermission = async (
  classId: string,
  featureKey: FeatureKey
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`➖ Removendo permissão ${featureKey} da turma ${classId}`)

    const { error } = await supabase
      .from('class_feature_permissions')
      .delete()
      .eq('class_id', classId)
      .eq('feature_key', featureKey)

    if (error) {
      console.error('❌ Erro ao remover permissão:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Permissão removida com sucesso')
    return { success: true }
  } catch (error) {
    console.error('💥 Erro de rede ao remover permissão:', error)
    return { success: false, error: 'Erro de rede' }
  }
}

/**
 * Atualiza todas as permissões de uma turma de uma vez
 * (APENAS para uso administrativo)
 */
export const updateClassFeaturePermissions = async (
  classId: string,
  featureKeys: FeatureKey[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🔄 Atualizando permissões da turma ${classId}`)

    // 1. Remover todas as permissões existentes
    const { error: deleteError } = await supabase
      .from('class_feature_permissions')
      .delete()
      .eq('class_id', classId)

    if (deleteError) {
      console.error('❌ Erro ao remover permissões antigas:', deleteError)
      return { success: false, error: deleteError.message }
    }

    // 2. Inserir novas permissões (se houver)
    if (featureKeys.length > 0) {
      const permissions = featureKeys.map(featureKey => ({
        class_id: classId,
        feature_key: featureKey,
      }))

      const { error: insertError } = await supabase
        .from('class_feature_permissions')
        .insert(permissions)

      if (insertError) {
        console.error('❌ Erro ao inserir novas permissões:', insertError)
        return { success: false, error: insertError.message }
      }
    }

    console.log('✅ Permissões atualizadas com sucesso')
    return { success: true }
  } catch (error) {
    console.error('💥 Erro de rede ao atualizar permissões:', error)
    return { success: false, error: 'Erro de rede' }
  }
}

export type {
  ClassFeaturePermission as ClassFeaturePermissionType,
}
