import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type Simulation = Database['public']['Tables']['quizzes']['Row']
export type SimulationInsert = Database['public']['Tables']['quizzes']['Insert']
export type SimulationUpdate = Database['public']['Tables']['quizzes']['Update']

export type AdminSimulation = Simulation & {
  questions_count?: number
  attempts_count?: number
  assigned_classes?: { id: string; name: string }[]
}

/**
 * Buscar todos os simulados (quizzes com type = 'simulation')
 */
export const getAllSimulations = async (): Promise<AdminSimulation[]> => {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      quiz_questions (count),
      quiz_attempts (count),
      quiz_classes (
        classes (
          id,
          name
        )
      )
    `)
    .eq('type', 'simulation')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching simulations:', error)
    throw error
  }

  return (data || []).map((sim: any) => ({
    ...sim,
    questions_count: sim.quiz_questions?.[0]?.count || 0,
    attempts_count: sim.quiz_attempts?.[0]?.count || 0,
    assigned_classes:
      sim.quiz_classes?.map((qc: any) => qc.classes).filter(Boolean) || [],
  })) as AdminSimulation[]
}

/**
 * Buscar simulado por ID
 */
export const getSimulationById = async (
  simulationId: string,
): Promise<Simulation | null> => {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', simulationId)
    .eq('type', 'simulation')
    .single()

  if (error) {
    console.error('Error fetching simulation:', error)
    throw error
  }

  return data
}

/**
 * Criar novo simulado
 */
export const createSimulation = async (
  simulationData: SimulationInsert,
): Promise<Simulation> => {
  const dataWithType = {
    ...simulationData,
    type: 'simulation',
  }

  const { data, error } = await supabase
    .from('quizzes')
    .insert(dataWithType)
    .select()
    .single()

  if (error) {
    console.error('Error creating simulation:', error)
    throw error
  }

  return data
}

/**
 * Atualizar simulado
 */
export const updateSimulation = async (
  simulationId: string,
  simulationData: SimulationUpdate,
): Promise<Simulation> => {
  const { data, error } = await supabase
    .from('quizzes')
    .update(simulationData)
    .eq('id', simulationId)
    .eq('type', 'simulation')
    .select()
    .single()

  if (error) {
    console.error('Error updating simulation:', error)
    throw error
  }

  return data
}

/**
 * Deletar simulado
 */
export const deleteSimulation = async (simulationId: string): Promise<void> => {
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', simulationId)
    .eq('type', 'simulation')

  if (error) {
    console.error('Error deleting simulation:', error)
    throw error
  }
}

/**
 * Atribuir turmas a um simulado
 */
export const assignClassesToSimulation = async (
  simulationId: string,
  classIds: string[],
): Promise<void> => {
  // Primeiro remove todas as turmas atuais
  await supabase.from('quiz_classes').delete().eq('quiz_id', simulationId)

  // Depois insere as novas
  if (classIds.length > 0) {
    const rows = classIds.map((classId) => ({
      quiz_id: simulationId,
      class_id: classId,
    }))

    const { error } = await supabase.from('quiz_classes').insert(rows)

    if (error) {
      console.error('Error assigning classes to simulation:', error)
      throw error
    }
  }
}

/**
 * Buscar turmas atribuídas a um simulado
 */
export const getSimulationClasses = async (simulationId: string) => {
  const { data, error } = await supabase
    .from('quiz_classes')
    .select(`
      class_id,
      classes (
        id,
        name,
        description
      )
    `)
    .eq('quiz_id', simulationId)

  if (error) {
    console.error('Error fetching simulation classes:', error)
    throw error
  }

  return data?.map((item: any) => item.classes).filter(Boolean) || []
}

/**
 * Buscar estatísticas de um simulado
 */
export const getSimulationStats = async (simulationId: string) => {
  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      score,
      total_points,
      percentage,
      time_spent_seconds,
      status
    `)
    .eq('quiz_id', simulationId)
    .eq('status', 'submitted')

  if (error) {
    console.error('Error fetching simulation stats:', error)
    throw error
  }

  const totalAttempts = attempts?.length || 0
  const completedAttempts =
    attempts?.filter((a) => a.status === 'submitted').length || 0
  const averageScore =
    totalAttempts > 0
      ? attempts!.reduce((sum, a) => sum + (a.percentage || 0), 0) /
        totalAttempts
      : 0
  const averageTime =
    totalAttempts > 0
      ? attempts!.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) /
        totalAttempts
      : 0

  return {
    totalAttempts,
    completedAttempts,
    averageScore: Math.round(averageScore * 10) / 10,
    averageTime: Math.round(averageTime / 60), // em minutos
  }
}

/**
 * Publicar simulado (mudar status para published)
 */
export const publishSimulation = async (
  simulationId: string,
): Promise<void> => {
  const { error } = await supabase
    .from('quizzes')
    .update({ status: 'published' })
    .eq('id', simulationId)
    .eq('type', 'simulation')

  if (error) {
    console.error('Error publishing simulation:', error)
    throw error
  }
}

/**
 * Despublicar simulado (mudar status para draft)
 */
export const unpublishSimulation = async (
  simulationId: string,
): Promise<void> => {
  const { error } = await supabase
    .from('quizzes')
    .update({ status: 'draft' })
    .eq('id', simulationId)
    .eq('type', 'simulation')

  if (error) {
    console.error('Error unpublishing simulation:', error)
    throw error
  }
}

// ─── Question Types ─────────────────────────────────────────────────────

export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row']
export type QuizQuestionInsert = Database['public']['Tables']['quiz_questions']['Insert']
export type QuizQuestionUpdate = Database['public']['Tables']['quiz_questions']['Update']

export type ReadingText = Database['public']['Tables']['quiz_reading_texts']['Row']
export type ReadingTextInsert = Database['public']['Tables']['quiz_reading_texts']['Insert']
export type ReadingTextUpdate = Database['public']['Tables']['quiz_reading_texts']['Update']

// ─── Reading Texts CRUD ─────────────────────────────────────────────────

export const getReadingTexts = async (quizId: string): Promise<ReadingText[]> => {
  const { data, error } = await supabase
    .from('quiz_reading_texts')
    .select('*')
    .eq('quiz_id', quizId)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data || []
}

export const createReadingText = async (text: ReadingTextInsert): Promise<ReadingText> => {
  const { data, error } = await supabase
    .from('quiz_reading_texts')
    .insert(text)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateReadingText = async (id: string, text: ReadingTextUpdate): Promise<ReadingText> => {
  const { data, error } = await supabase
    .from('quiz_reading_texts')
    .update(text)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteReadingText = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('quiz_reading_texts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Questions CRUD ─────────────────────────────────────────────────────

export const getQuestions = async (quizId: string): Promise<QuizQuestion[]> => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data || []
}

export const createQuestion = async (question: QuizQuestionInsert): Promise<QuizQuestion> => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert(question)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateQuestion = async (id: string, question: QuizQuestionUpdate): Promise<QuizQuestion> => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .update(question)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteQuestion = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Buscar simulado completo com questões e textos
 */
export const getSimulationFull = async (simulationId: string) => {
  const [simulation, questions, readingTexts] = await Promise.all([
    getSimulationById(simulationId),
    getQuestions(simulationId),
    getReadingTexts(simulationId),
  ])

  return { simulation, questions, readingTexts }
}
