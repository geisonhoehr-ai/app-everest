import { supabase } from '@/lib/supabase/client'

export interface QuizSubject {
  id: string
  name: string
  description: string
  image: string
  topics: QuizTopic[]
}

export interface QuizTopic {
  id: string
  name: string
  description: string
  questionCount: number
  quizzes: Quiz[]
}

export interface Quiz {
  id: string
  title: string
  description: string
  type?: string // 'quiz', 'simulation', 'answer_sheet'
  status?: string // 'draft', 'published'
  duration_minutes?: number
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  explanation?: string
  points: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  score: number
  total_questions: number
  attempt_date: string
  duration_seconds?: number
}

// Export individual functions for easier importing
export const getQuizzes = async (): Promise<Quiz[]> => {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        quiz_questions (
          id,
          question_text,
          question_type,
          options,
          correct_answer,
          explanation,
          points
        )
      `)
      .order('title', { ascending: true })

    if (error) throw error

    return quizzes?.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || '',
      duration_minutes: quiz.duration_minutes,
      questions: quiz.quiz_questions?.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options as string[],
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points,
      })) || []
    })) || []
  } catch (error) {
    console.error('Erro ao buscar quizzes:', error)
    return []
  }
}

export const quizService = {
  // Buscar todas as matérias com quizzes
  async getQuizSubjects(): Promise<QuizSubject[]> {
    try {
      console.log('🔍 Fetching quiz subjects from database...')

      const { data: subjects, error } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          description,
          image_url,
          topics (
            id,
            name,
            description,
            quizzes (
              id,
              title,
              description,
              duration_minutes,
              quiz_questions (id)
            )
          )
        `)
        .order('name')

      if (error) {
        console.error('❌ Error fetching quiz subjects:', error)
        throw error
      }

      console.log('✅ Found subjects:', subjects?.length || 0)
      subjects?.forEach(subject => {
        console.log(`📚 Subject: ${subject.name}, Topics: ${subject.topics?.length || 0}`)
        subject.topics?.forEach(topic => {
          console.log(`  📖 Topic: ${topic.name}, Quizzes: ${topic.quizzes?.length || 0}`)
          if (topic.quizzes?.length === 0) {
            console.warn(`  ⚠️ No quizzes found for topic: ${topic.name} in subject: ${subject.name}`)
          }
        })
      })

      return subjects?.map(subject => ({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        image: subject.image_url || `https://img.usecurling.com/p/400/200?q=${encodeURIComponent(subject.name)}`,
        topics: subject.topics?.map(topic => ({
          id: topic.id,
          name: topic.name,
          description: topic.description,
          questionCount: topic.quizzes?.reduce((total, quiz) => total + (quiz.quiz_questions?.length || 0), 0) || 0,
          quizzes: topic.quizzes?.map(quiz => ({
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            duration_minutes: quiz.duration_minutes,
            questions: [] // Será carregado quando necessário
          })) || []
        })) || []
      })) || []
    } catch (error) {
      console.error('Erro ao buscar matérias de quizzes:', error)
      return []
    }
  },

  // Buscar quiz por ID com questões
  async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          description,
          type,
          status,
          duration_minutes,
          quiz_questions (
            id,
            question_text,
            question_type,
            options,
            correct_answer,
            explanation,
            points
          )
        `)
        .eq('id', quizId)
        .single()

      if (error) throw error

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        type: quiz.type,
        status: quiz.status,
        duration_minutes: quiz.duration_minutes,
        questions: quiz.quiz_questions?.map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: (Array.isArray(q.options) ? q.options : []) as string[],
          correct_answer: q.correct_answer,
          explanation: q.explanation || '',
          points: q.points
        })) || []
      }
    } catch (error) {
      console.error('Erro ao buscar quiz:', error)
      return null
    }
  },

  // Salvar tentativa de quiz
  async saveQuizAttempt(
    userId: string,
    quizId: string,
    answers: Record<string, string>,
    score: number,
    durationSeconds: number
  ): Promise<string | null> {
    try {
      // Criar tentativa
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: userId,
          quiz_id: quizId,
          score: score,
          total_questions: Object.keys(answers).length,
          duration_seconds: durationSeconds
        })
        .select('id')
        .single()

      if (attemptError) throw attemptError

      // Salvar respostas
      const answerInserts = Object.entries(answers).map(([questionId, answer]) => ({
        quiz_attempt_id: attempt.id,
        quiz_question_id: questionId,
        user_answer: answer,
        is_correct: false // Será calculado baseado na resposta correta
      }))

      // Buscar respostas corretas para calcular is_correct
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('id, correct_answer')
        .eq('quiz_id', quizId)

      if (questionsError) throw questionsError

      // Atualizar is_correct baseado nas respostas corretas
      const correctAnswers = questions?.reduce((acc, q) => {
        acc[q.id] = q.correct_answer
        return acc
      }, {} as Record<string, string>) || {}

      const finalAnswerInserts = answerInserts.map(answer => ({
        ...answer,
        is_correct: correctAnswers[answer.quiz_question_id] === answer.user_answer
      }))

      const { error: answersError } = await supabase
        .from('quiz_attempt_answers')
        .insert(finalAnswerInserts)

      if (answersError) throw answersError

      return attempt.id
    } catch (error) {
      console.error('Erro ao salvar tentativa de quiz:', error)
      return null
    }
  },

  // Buscar histórico de tentativas do usuário
  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    try {
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          quiz_id,
          score,
          total_questions,
          attempt_date,
          duration_seconds,
          quizzes (
            title
          )
        `)
        .eq('user_id', userId)
        .order('attempt_date', { ascending: false })

      if (error) throw error

      return attempts?.map(attempt => ({
        id: attempt.id,
        quiz_id: attempt.quiz_id,
        score: attempt.score,
        total_questions: attempt.total_questions,
        attempt_date: attempt.attempt_date,
        duration_seconds: attempt.duration_seconds
      })) || []
    } catch (error) {
      console.error('Erro ao buscar tentativas de quiz:', error)
      return []
    }
  },

  // Buscar estatísticas de quiz do usuário
  async getUserQuizStats(userId: string): Promise<{
    totalAttempts: number
    averageScore: number
    bestScore: number
    totalQuestions: number
  }> {
    try {
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('score, total_questions')
        .eq('user_id', userId)

      if (error) throw error

      const totalAttempts = attempts?.length || 0
      const totalScore = attempts?.reduce((sum, attempt) => sum + attempt.score, 0) || 0
      const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0
      const bestScore = attempts?.reduce((max, attempt) => Math.max(max, attempt.score), 0) || 0
      const totalQuestions = attempts?.reduce((sum, attempt) => sum + attempt.total_questions, 0) || 0

      return {
        totalAttempts,
        averageScore,
        bestScore,
        totalQuestions
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de quiz:', error)
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuestions: 0
      }
    }
  }
}