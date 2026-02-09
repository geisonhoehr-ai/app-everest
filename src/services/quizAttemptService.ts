import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  started_at: string
  submitted_at?: string
  time_spent_seconds?: number
  score?: number
  total_points?: number
  percentage?: number
  status: 'in_progress' | 'submitted' | 'expired'
}

export interface QuizAnswer {
  id: string
  attempt_id: string
  question_id: string
  answer_value?: string
  answer_json?: any
  is_correct?: boolean
  points_earned?: number
  time_spent_seconds?: number
}

export interface ReadingText {
  id: string
  quiz_id: string
  title?: string
  content: string
  content_html?: string
  author?: string
  source?: string
  word_count?: number
  display_order: number
}

// Criar nova tentativa
export async function createQuizAttempt(quizId: string): Promise<QuizAttempt | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        status: 'in_progress'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    logger.error('Erro ao criar tentativa:', error)
    throw error
  }
}

// Buscar tentativa em andamento
export async function getCurrentAttempt(quizId: string): Promise<QuizAttempt | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (error) {
    logger.error('Erro ao buscar tentativa:', error)
    return null
  }
}

// Salvar resposta individual
export async function saveQuizAnswer(
  attemptId: string,
  questionId: string,
  answer: any
): Promise<void> {
  try {
    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .select('correct_answer, correct_answers, points')
      .eq('id', questionId)
      .single()

    if (questionError) throw questionError

    // Verificar se a resposta está correta
    let isCorrect = false
    let answerValue = ''

    if (typeof answer === 'string') {
      answerValue = answer
      // Múltipla escolha ou verdadeiro/falso
      isCorrect = answer === question.correct_answer
    } else if (Array.isArray(answer)) {
      answerValue = answer.join(',')
      // Múltipla seleção
      const correctSet = new Set(question.correct_answers || [])
      const answerSet = new Set(answer)
      isCorrect = correctSet.size === answerSet.size &&
        [...correctSet].every(item => answerSet.has(item))
    }

    const pointsEarned = isCorrect ? (question.points || 0) : 0

    const { error } = await supabase
      .from('quiz_answers')
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        answer_value: answerValue,
        answer_json: typeof answer === 'object' ? answer : null,
        is_correct: isCorrect,
        points_earned: pointsEarned
      }, {
        onConflict: 'attempt_id,question_id'
      })

    if (error) throw error
  } catch (error) {
    logger.error('Erro ao salvar resposta:', error)
    throw error
  }
}

// Submeter simulado
export async function submitQuizAttempt(attemptId: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('submit_quiz_attempt', {
      p_attempt_id: attemptId
    })

    if (error) throw error
    return data
  } catch (error) {
    logger.error('Erro ao submeter simulado:', error)
    throw error
  }
}

// Buscar respostas de uma tentativa
export async function getAttemptAnswers(attemptId: string): Promise<QuizAnswer[]> {
  try {
    const { data, error } = await supabase
      .from('quiz_answers')
      .select('*')
      .eq('attempt_id', attemptId)

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Erro ao buscar respostas:', error)
    throw error
  }
}

// Buscar textos de leitura do quiz
export async function getQuizReadingTexts(quizId: string): Promise<ReadingText[]> {
  try {
    const { data, error } = await supabase
      .from('quiz_reading_texts')
      .select('*')
      .eq('quiz_id', quizId)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Erro ao buscar textos:', error)
    throw error
  }
}

// Buscar resultados da tentativa
export async function getAttemptResult(attemptId: string): Promise<QuizAttempt | null> {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quiz:quizzes (
          title,
          description,
          type,
          passing_score
        )
      `)
      .eq('id', attemptId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    logger.error('Erro ao buscar resultado:', error)
    throw error
  }
}

// Buscar estatísticas do quiz
export async function getQuizStatistics(quizId: string) {
  try {
    const { data, error } = await supabase
      .from('quiz_question_stats')
      .select('*')
      .eq('quiz_id', quizId)

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error)
    throw error
  }
}

// Verificar se usuário pode acessar o quiz
export async function canUserAccessQuiz(quizId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('can_user_access_quiz', {
      p_quiz_id: quizId,
      p_user_id: user.id
    })

    if (error) throw error
    return data === true
  } catch (error) {
    logger.error('Erro ao verificar acesso:', error)
    return false
  }
}

// Buscar histórico de tentativas do usuário
export async function getUserAttempts(quizId?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('quiz_attempts')
      .select(`
        *,
        quiz:quizzes (
          title,
          type,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (quizId) {
      query = query.eq('quiz_id', quizId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Erro ao buscar histórico:', error)
    throw error
  }
}
