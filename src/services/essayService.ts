import { supabase } from '@/lib/supabase/client'
import type { Database, Json } from '@/lib/supabase/types'

export type Essay = Database['public']['Tables']['essays']['Row']
export type EssayPrompt = Database['public']['Tables']['essay_prompts']['Row']
export type EssayAnnotation =
  Database['public']['Tables']['essay_annotations']['Row']
export type ErrorCategory =
  Database['public']['Tables']['error_categories']['Row']

export type EssayForCorrection = Essay & {
  essay_prompts: Pick<EssayPrompt, 'title' | 'evaluation_criteria'> | null
  users: {
    first_name: string
    last_name: string
    student_classes: {
      classes: {
        name: string
      }
    }[]
  } | null
}

export const getEssayForCorrection = async (
  submissionId: string,
): Promise<EssayForCorrection | null> => {
  const { data, error } = await supabase
    .from('essays')
    .select(
      `
      *,
      essay_prompts ( title, evaluation_criteria ),
      users ( 
        first_name, 
        last_name,
        student_classes (
          classes (
            name
          )
        )
      )
    `,
    )
    .eq('id', submissionId)
    .single()

  if (error) {
    console.error('Error fetching essay for correction:', error)
    return null
  }

  return data as EssayForCorrection
}

export const getEssaysForComparison = async (
  submissionIds: string[],
): Promise<EssayForCorrection[]> => {
  if (submissionIds.length !== 2) {
    throw new Error('Exactly two submission IDs are required for comparison.')
  }

  const { data, error } = await supabase
    .from('essays')
    .select(
      `
      *,
      essay_prompts ( title, evaluation_criteria ),
      users ( first_name, last_name )
    `,
    )
    .in('id', submissionIds)

  if (error) {
    console.error('Error fetching essays for comparison:', error)
    return []
  }

  return data as EssayForCorrection[]
}

export const getErrorCategories = async (): Promise<ErrorCategory[]> => {
  const { data, error } = await supabase.from('error_categories').select('*')
  if (error) {
    console.error('Error fetching error categories:', error)
    return []
  }
  return data
}

export const saveCorrection = async (
  submissionId: string,
  teacherId: string,
  payload: {
    final_grade: number
    teacher_feedback_text: string
    annotations: Omit<EssayAnnotation, 'id' | 'created_at' | 'essay_id'>[]
  },
) => {
  const { error: updateError } = await supabase
    .from('essays')
    .update({
      final_grade: payload.final_grade,
      teacher_feedback_text: payload.teacher_feedback_text,
      teacher_id: teacherId,
      status: 'corrected',
      correction_date: new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (updateError) throw updateError

  const annotationsToInsert = payload.annotations.map((anno) => ({
    ...anno,
    essay_id: submissionId,
    teacher_id: teacherId,
  }))

  const { error: annotationError } = await supabase
    .from('essay_annotations')
    .upsert(annotationsToInsert)

  if (annotationError) throw annotationError

  return { success: true }
}

export const getStudentEssayDetails = async (
  essayId: string,
): Promise<StudentEssayDetails | null> => {
  const { data, error } = await supabase
    .from('essays')
    .select(
      `
      *,
      essay_prompts ( title, evaluation_criteria ),
      essay_annotations ( * )
    `,
    )
    .eq('id', essayId)
    .single()

  if (error) {
    console.error('Error fetching student essay details:', error)
    return null
  }
  return data as StudentEssayDetails
}

// Funções para página de listagem de redações
export interface EssayListItem {
  id: string
  theme: string
  date: string
  status: 'Rascunho' | 'Enviada' | 'Corrigindo' | 'Corrigida'
  grade: number | null
}

export interface EssayStatsData {
  totalEssays: number
  averageGrade: number
  averageDays: number
  pending: number
}

export const getUserEssaysList = async (userId: string): Promise<EssayListItem[]> => {
  try {
    const { data: essays, error } = await supabase
      .from('essays')
      .select(`
        id,
        status,
        final_grade,
        created_at,
        submission_date,
        essay_prompts (
          title
        )
      `)
      .eq('student_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return essays?.map(essay => ({
      id: essay.id,
      theme: essay.essay_prompts?.title || 'Redação sem título',
      date: new Date(essay.submission_date || essay.created_at).toLocaleDateString('pt-BR'),
      status: mapStatusToPortuguese(essay.status || 'draft'),
      grade: essay.final_grade
    })) || []
  } catch (error) {
    console.error('Erro ao buscar lista de redações:', error)
    return []
  }
}

export const getUserEssayStats = async (userId: string): Promise<EssayStatsData> => {
  try {
    const essays = await getUserEssaysList(userId)

    const correctedEssays = essays.filter(e => e.status === 'Corrigida' && e.grade !== null)
    const averageGrade = correctedEssays.length > 0
      ? Math.round(correctedEssays.reduce((sum, e) => sum + (e.grade || 0), 0) / correctedEssays.length)
      : 0

    // Calcular média de dias (mock por enquanto, pois precisa de correction_date)
    const averageDays = 3

    return {
      totalEssays: essays.length,
      averageGrade,
      averageDays,
      pending: essays.filter(e => e.status === 'Enviada' || e.status === 'Corrigindo').length
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas de redações:', error)
    return {
      totalEssays: 0,
      averageGrade: 0,
      averageDays: 0,
      pending: 0
    }
  }
}


export const submitEssay = async (
  userId: string,
  theme: string,
  content: string,
  file?: File
): Promise<void> => {
  try {
    // 1. Create a prompt for this essay (Free Theme)
    const defaultCriteria = {
      c1: { name: 'Norma Culta', value: 200 },
      c2: { name: 'Compreensão do Tema', value: 200 },
      c3: { name: 'Argumentação', value: 200 },
      c4: { name: 'Coesão', value: 200 },
      c5: { name: 'Proposta de Intervenção', value: 200 }
    }

    const { data: prompt, error: promptError } = await supabase
      .from('essay_prompts')
      .insert({
        title: theme,
        description: 'Tema livre enviado pelo aluno',
        evaluation_criteria: defaultCriteria,
        created_by_user_id: userId,
        // subject_id might be needed, but we leave null for now
      })
      .select('id')
      .single()

    if (promptError) throw promptError

    // 2. Upload file if exists
    let fileUrl = null
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('essays')
        .upload(filePath, file)

      if (uploadError) throw uploadError
      fileUrl = filePath
    }

    // 3. Submit essay
    const { error: essayError } = await supabase
      .from('essays')
      .insert({
        student_id: userId,
        prompt_id: prompt.id,
        submission_text: content || '',
        file_url: fileUrl,
        status: 'submitted',
        submission_date: new Date().toISOString()
      })

    if (essayError) throw essayError

  } catch (error) {
    console.error('Error submitting essay:', error)
    throw error
  }
}

function mapStatusToPortuguese(status: string): 'Rascunho' | 'Enviada' | 'Corrigindo' | 'Corrigida' {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'correcting':
      return 'Corrigindo'
    case 'corrected':
      return 'Corrigida'
    default:
      return 'Enviada'
  }
}

