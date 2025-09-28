import { supabase } from '@/lib/supabase/client'

export interface Quiz {
  id: string
  title: string
  description: string
  questionCount: number
}

export const getQuizzes = async (searchTerm: string = ''): Promise<Quiz[]> => {
  let query = supabase.from('quizzes').select(
    `
    id,
    title,
    description,
    quiz_questions ( count )
  `,
  )

  if (searchTerm) {
    query = query.ilike('title', `%${searchTerm}%`)
  }

  const { data, error } = await query.order('title', { ascending: true })

  if (error) {
    console.error('Error fetching quizzes:', error)
    throw error
  }

  return data.map((quiz: any) => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description || '',
    questionCount: quiz.quiz_questions[0]?.count || 0,
  }))
}
