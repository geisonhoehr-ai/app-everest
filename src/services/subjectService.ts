import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type SubjectWithTopicCount =
  Database['public']['Tables']['subjects']['Row'] & {
    topics: { count: number }[]
  }

export const getSubjects = async (): Promise<SubjectWithTopicCount[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select(
      `
      *,
      topics ( count )
    `,
    )
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching subjects:', error)
    throw error
  }

  return data as SubjectWithTopicCount[]
}
