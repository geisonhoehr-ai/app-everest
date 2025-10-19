import { supabase } from '@/lib/supabase/client'
import type { Database, Json } from '@/lib/supabase/types'

export type AdminQuiz = Database['public']['Tables']['quizzes']['Row'] & {
  topics: { name: string } | null
  quiz_questions: { count: number }[]
}

export type AdminTopic = Database['public']['Tables']['topics']['Row']

export type QuizInsert = Database['public']['Tables']['quizzes']['Insert']
export type QuestionInsert =
  Database['public']['Tables']['quiz_questions']['Insert']

export interface QuestionPerformance {
  question_id: string
  question_text: string
  correct_answers: number
  incorrect_answers: number
}

export interface StudentAttempt {
  attempt_id: string
  user_id: string
  user_name: string
  user_email: string
  score: number
  total_questions: number
  duration_seconds: number | null
  attempt_date: string
}

export interface QuizReport {
  quiz_title: string
  total_attempts: number
  average_score_percentage: number
  average_duration_seconds: number
  question_performance: QuestionPerformance[]
  student_attempts: StudentAttempt[]
}

export interface AttemptAnswer {
  question_text: string
  options: Json | null
  user_answer: string | null
  correct_answer: string
  is_correct: boolean
}

export const getAdminQuizzes = async (): Promise<AdminQuiz[]> => {
  const { data, error } = await supabase
    .from('quizzes')
    .select(
      `
      *,
      topics ( name ),
      quiz_questions ( count )
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quizzes:', error)
    throw error
  }

  return data as AdminQuiz[]
}

export const getTopics = async (): Promise<AdminTopic[]> => {
  const { data, error } = await supabase.from('topics').select('id, name')

  if (error) {
    console.error('Error fetching topics:', error)
    throw error
  }
  return data
}

export const getAllQuestions = async () => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select(`
      id,
      question_text,
      question_type,
      options,
      correct_answer,
      explanation,
      points,
      topics (
        id,
        name,
        subjects (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching questions:', error)
    throw error
  }
  return data
}

export const createQuiz = async (
  quizData: QuizInsert,
): Promise<AdminQuiz | null> => {
  const { data, error } = await supabase
    .from('quizzes')
    .insert(quizData)
    .select(`*, topics(name), quiz_questions(count)`)
    .single()

  if (error) {
    console.error('Error creating quiz:', error)
    throw error
  }
  return data as AdminQuiz
}

export const getQuizById = async (quizId: string): Promise<AdminQuiz | null> => {
  const { data, error } = await supabase
    .from('quizzes')
    .select(
      `
      *,
      topics ( name ),
      quiz_questions ( count )
    `,
    )
    .eq('id', quizId)
    .single()

  if (error) {
    console.error('Error fetching quiz:', error)
    throw error
  }

  return data as AdminQuiz
}

export const updateQuiz = async (
  quizId: string,
  quizData: Partial<QuizInsert>,
): Promise<AdminQuiz | null> => {
  const { data, error } = await supabase
    .from('quizzes')
    .update(quizData)
    .eq('id', quizId)
    .select(`*, topics(name), quiz_questions(count)`)
    .single()

  if (error) {
    console.error('Error updating quiz:', error)
    throw error
  }
  return data as AdminQuiz
}

export const deleteQuiz = async (quizId: string): Promise<void> => {
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId)

  if (error) {
    console.error('Error deleting quiz:', error)
    throw error
  }
}

export const bulkInsertQuestions = async (
  questions: QuestionInsert[],
): Promise<void> => {
  const { error } = await supabase.from('quiz_questions').insert(questions)
  if (error) {
    console.error('Error bulk inserting questions:', error)
    throw error
  }
}

export const updateQuestion = async (
  questionId: string,
  questionData: Partial<QuestionInsert>,
): Promise<void> => {
  const { error } = await supabase
    .from('quiz_questions')
    .update(questionData)
    .eq('id', questionId)

  if (error) {
    console.error('Error updating question:', error)
    throw error
  }
}

export const deleteQuestion = async (questionId: string): Promise<void> => {
  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', questionId)

  if (error) {
    console.error('Error deleting question:', error)
    throw error
  }
}

export const getQuizReport = async (
  quizId: string,
): Promise<QuizReport | null> => {
  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .select('title')
    .eq('id', quizId)
    .single()

  if (quizError || !quizData) {
    console.error('Error fetching quiz details:', quizError)
    return null
  }

  const { data: attemptsData, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select(
      `
      id,
      score,
      total_questions,
      duration_seconds,
      attempt_date,
      users ( id, first_name, last_name, email )
    `,
    )
    .eq('quiz_id', quizId)

  if (attemptsError) {
    console.error('Error fetching quiz attempts:', attemptsError)
    return null
  }

  const total_attempts = attemptsData.length
  if (total_attempts === 0) {
    return {
      quiz_title: quizData.title,
      total_attempts: 0,
      average_score_percentage: 0,
      average_duration_seconds: 0,
      question_performance: [],
      student_attempts: [],
    }
  }

  const total_score = attemptsData.reduce(
    (acc, attempt) => acc + attempt.score / attempt.total_questions,
    0,
  )
  const average_score_percentage = (total_score / total_attempts) * 100
  const total_duration = attemptsData.reduce(
    (acc, attempt) => acc + (attempt.duration_seconds || 0),
    0,
  )
  const average_duration_seconds = total_duration / total_attempts

  const student_attempts: StudentAttempt[] = attemptsData.map(
    (attempt: any) => ({
      attempt_id: attempt.id,
      user_id: attempt.users?.id || '',
      user_name:
        `${attempt.users?.first_name || ''} ${attempt.users?.last_name || ''}`.trim(),
      user_email: attempt.users?.email || '',
      score: attempt.score,
      total_questions: attempt.total_questions,
      duration_seconds: attempt.duration_seconds,
      attempt_date: attempt.attempt_date,
    }),
  )

  const { data: qpData, error: qpError } = await supabase.rpc(
    'get_question_performance_for_quiz',
    {
      p_quiz_id: quizId,
    },
  )

  if (qpError) {
    console.error('Error fetching question performance:', qpError)
  }

  return {
    quiz_title: quizData.title,
    total_attempts,
    average_score_percentage,
    average_duration_seconds,
    question_performance: (qpData as any) || [],
    student_attempts,
  }
}

export const getAttemptDetails = async (
  attemptId: string,
): Promise<AttemptAnswer[] | null> => {
  const { data, error } = await supabase
    .from('quiz_attempt_answers')
    .select(
      `
      is_correct,
      user_answer,
      quiz_questions (
        question_text,
        options,
        correct_answer
      )
    `,
    )
    .eq('quiz_attempt_id', attemptId)

  if (error) {
    console.error('Error fetching attempt details:', error)
    return null
  }

  return data.map((item: any) => ({
    question_text: item.quiz_questions?.question_text || '',
    options: item.quiz_questions?.options || [],
    user_answer: item.user_answer,
    correct_answer: item.quiz_questions?.correct_answer || '',
    is_correct: item.is_correct,
  }))
}
