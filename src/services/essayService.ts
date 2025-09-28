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
  users: { first_name: string; last_name: string } | null
}

export type StudentEssayDetails = Essay & {
  essay_prompts: Pick<EssayPrompt, 'title' | 'evaluation_criteria'> | null
  essay_annotations: EssayAnnotation[]
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
      users ( first_name, last_name )
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
