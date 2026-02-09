import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type EssayPrompt = Database['public']['Tables']['essay_prompts']['Row']
export type EssayPromptInsert = Database['public']['Tables']['essay_prompts']['Insert']
export type EssayPromptUpdate = Database['public']['Tables']['essay_prompts']['Update']

export type AdminEssayPrompt = EssayPrompt & {
  submissions_count?: number
}

/**
 * Buscar todos os temas de redação (para administração)
 */
export const getAllEssayPrompts = async (): Promise<AdminEssayPrompt[]> => {
  const { data, error } = await supabase
    .from('essay_prompts')
    .select(`
      *,
      essays (count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching essay prompts:', error)
    throw error
  }

  return (data || []).map((prompt: any) => ({
    ...prompt,
    submissions_count: prompt.essays?.[0]?.count || 0,
  })) as AdminEssayPrompt[]
}

/**
 * Buscar tema de redação por ID
 */
export const getEssayPromptById = async (
  promptId: string,
): Promise<EssayPrompt | null> => {
  const { data, error } = await supabase
    .from('essay_prompts')
    .select('*')
    .eq('id', promptId)
    .single()

  if (error) {
    console.error('Error fetching essay prompt:', error)
    throw error
  }

  return data
}

/**
 * Criar novo tema de redação
 */
export const createEssayPrompt = async (
  promptData: EssayPromptInsert,
): Promise<EssayPrompt> => {
  const { data, error } = await supabase
    .from('essay_prompts')
    .insert(promptData)
    .select()
    .single()

  if (error) {
    console.error('Error creating essay prompt:', error)
    throw error
  }

  return data
}

/**
 * Atualizar tema de redação
 */
export const updateEssayPrompt = async (
  promptId: string,
  promptData: EssayPromptUpdate,
): Promise<EssayPrompt> => {
  const { data, error } = await supabase
    .from('essay_prompts')
    .update(promptData)
    .eq('id', promptId)
    .select()
    .single()

  if (error) {
    console.error('Error updating essay prompt:', error)
    throw error
  }

  return data
}

/**
 * Deletar tema de redação
 */
export const deleteEssayPrompt = async (promptId: string): Promise<void> => {
  const { error } = await supabase
    .from('essay_prompts')
    .delete()
    .eq('id', promptId)

  if (error) {
    console.error('Error deleting essay prompt:', error)
    throw error
  }
}

/**
 * Buscar submissões de um tema específico
 */
export const getEssaySubmissions = async (promptId: string) => {
  const { data, error } = await supabase
    .from('essays')
    .select(`
      id,
      status,
      final_grade,
      submission_date,
      created_at,
      users (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('essay_prompt_id', promptId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching essay submissions:', error)
    throw error
  }

  return data
}

/**
 * Buscar estatísticas de um tema
 */
export const getEssayPromptStats = async (promptId: string) => {
  const { data: essays, error } = await supabase
    .from('essays')
    .select('status, final_grade')
    .eq('essay_prompt_id', promptId)

  if (error) {
    console.error('Error fetching essay stats:', error)
    throw error
  }

  const total = essays?.length || 0
  const corrected = essays?.filter((e) => e.status === 'corrected').length || 0
  const pending = essays?.filter((e) => e.status === 'submitted').length || 0
  const correcting =
    essays?.filter((e) => e.status === 'correcting').length || 0

  const gradedEssays = essays?.filter(
    (e) => e.final_grade !== null && e.final_grade !== undefined,
  )
  const averageGrade =
    gradedEssays && gradedEssays.length > 0
      ? gradedEssays.reduce((sum, e) => sum + (e.final_grade || 0), 0) /
        gradedEssays.length
      : 0

  return {
    total,
    corrected,
    pending,
    correcting,
    averageGrade: Math.round(averageGrade * 10) / 10,
  }
}
