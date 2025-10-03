import { supabase } from '@/lib/supabase/client'

export interface SimulationQuestion {
  id: string
  question_format: string
  question_text: string
  question_html?: string
  question_image_url?: string
  question_image_caption?: string
  options?: string[]
  options_rich?: Array<{
    id: string
    text: string
    html?: string
    imageUrl?: string
    isCorrect?: boolean
  }>
  correct_answer?: string
  correct_answers?: string[]
  explanation?: string
  explanation_html?: string
  difficulty?: string
  points?: number
  time_limit_seconds?: number
  source?: string
  year?: number
  subject?: string
}

export interface Simulation {
  id: string
  title: string
  description?: string
  duration_minutes?: number
  questions: SimulationQuestion[]
}

export async function getSimulation(quizId: string): Promise<Simulation | null> {
  try {
    // Buscar quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, description, duration_minutes')
      .eq('id', quizId)
      .single()

    if (quizError) throw quizError
    if (!quiz) return null

    // Buscar questões do quiz
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: true })

    if (questionsError) throw questionsError

    // Transformar options de JSONB para array de strings
    const formattedQuestions = questions?.map(q => ({
      ...q,
      options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(JSON.stringify(q.options))) : undefined,
    })) || []

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      duration_minutes: quiz.duration_minutes,
      questions: formattedQuestions,
    }
  } catch (error) {
    console.error('Error fetching simulation:', error)
    throw error
  }
}

export async function getAvailableSimulations() {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        quiz_questions (count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching simulations:', error)
    throw error
  }
}

export async function saveSimulationAnswer(
  quizId: string,
  questionId: string,
  answer: any
) {
  // TODO: Implementar salvamento de respostas
  console.log('Saving answer:', { quizId, questionId, answer })
}

export async function submitSimulation(quizId: string, answers: Record<string, any>) {
  // TODO: Implementar submissão de simulado
  console.log('Submitting simulation:', { quizId, answers })
}
