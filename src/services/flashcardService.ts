import { supabase } from '@/lib/supabase/client'

export interface FlashcardSubject {
  id: string
  name: string
  description: string
  image: string
  topics: FlashcardTopic[]
}

export interface FlashcardTopic {
  id: string
  name: string
  description: string
  flashcardCount: number
}

export interface Flashcard {
  id: string
  question: string
  answer: string
  explanation?: string
  difficulty: number
  external_resource_url?: string
}

export interface FlashcardProgress {
  id: string
  flashcard_id: string
  last_reviewed_at: string
  next_review_at?: string
  interval_days: number
  ease_factor: number
  repetitions: number
  quality?: number
}

export const flashcardService = {
  // Buscar todas as matérias com flashcards
  async getFlashcardSubjects(): Promise<FlashcardSubject[]> {
    try {
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
            flashcards (id)
          )
        `)
        .order('name')

      if (error) throw error

      return subjects?.map(subject => ({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        image: subject.image_url || `https://img.usecurling.com/p/400/200?q=${encodeURIComponent(subject.name)}`,
        topics: subject.topics?.map(topic => ({
          id: topic.id,
          name: topic.name,
          description: topic.description,
          flashcardCount: topic.flashcards?.length || 0
        })) || []
      })) || []
    } catch (error) {
      console.error('Erro ao buscar matérias de flashcards:', error)
      return []
    }
  },

  // Buscar flashcards de um tópico
  async getFlashcardsByTopic(topicId: string): Promise<Flashcard[]> {
    try {
      const { data: flashcards, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at')

      if (error) throw error

      return flashcards?.map(flashcard => ({
        id: flashcard.id,
        question: flashcard.question,
        answer: flashcard.answer,
        explanation: flashcard.explanation,
        difficulty: flashcard.difficulty,
        external_resource_url: flashcard.external_resource_url
      })) || []
    } catch (error) {
      console.error('Erro ao buscar flashcards do tópico:', error)
      return []
    }
  },

  // Buscar progresso do usuário em flashcards
  async getUserFlashcardProgress(userId: string, topicId?: string): Promise<Record<string, FlashcardProgress>> {
    try {
      let query = supabase
        .from('flashcard_progress')
        .select('*')
        .eq('user_id', userId)

      if (topicId) {
        query = query.in('flashcard_id', 
          supabase
            .from('flashcards')
            .select('id')
            .eq('topic_id', topicId)
        )
      }

      const { data: progress, error } = await query

      if (error) throw error

      const progressMap: Record<string, FlashcardProgress> = {}
      progress?.forEach(p => {
        progressMap[p.flashcard_id] = {
          id: p.id,
          flashcard_id: p.flashcard_id,
          last_reviewed_at: p.last_reviewed_at,
          next_review_at: p.next_review_at,
          interval_days: p.interval_days,
          ease_factor: p.ease_factor,
          repetitions: p.repetitions,
          quality: p.quality
        }
      })

      return progressMap
    } catch (error) {
      console.error('Erro ao buscar progresso dos flashcards:', error)
      return {}
    }
  },

  // Atualizar progresso de um flashcard
  async updateFlashcardProgress(
    userId: string,
    flashcardId: string,
    quality: number,
    responseTimeSeconds?: number
  ): Promise<void> {
    try {
      // Buscar progresso atual
      const { data: currentProgress, error: fetchError } = await supabase
        .from('flashcard_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('flashcard_id', flashcardId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      // Calcular novos valores usando algoritmo SM-2
      const now = new Date()
      let newInterval = 1
      let newRepetitions = 1
      let newEaseFactor = 2.5

      if (currentProgress) {
        newEaseFactor = currentProgress.ease_factor
        newRepetitions = currentProgress.repetitions

        if (quality >= 3) {
          if (newRepetitions === 0) {
            newInterval = 1
          } else if (newRepetitions === 1) {
            newInterval = 6
          } else {
            newInterval = Math.round(currentProgress.interval_days * newEaseFactor)
          }
          newRepetitions += 1
        } else {
          newRepetitions = 0
          newInterval = 1
        }

        // Ajustar ease factor
        newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        newEaseFactor = Math.max(1.3, newEaseFactor)
      } else {
        newEaseFactor = 2.5 + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        newEaseFactor = Math.max(1.3, newEaseFactor)
      }

      const nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000)

      // Inserir ou atualizar progresso
      const { error: upsertError } = await supabase
        .from('flashcard_progress')
        .upsert({
          user_id: userId,
          flashcard_id: flashcardId,
          last_reviewed_at: now.toISOString(),
          next_review_at: nextReview.toISOString(),
          interval_days: newInterval,
          ease_factor: newEaseFactor,
          repetitions: newRepetitions,
          quality: quality,
          response_time_seconds: responseTimeSeconds
        })

      if (upsertError) throw upsertError
    } catch (error) {
      console.error('Erro ao atualizar progresso do flashcard:', error)
    }
  },

  // Buscar flashcards para revisão
  async getFlashcardsForReview(userId: string, topicId?: string): Promise<Flashcard[]> {
    try {
      const now = new Date().toISOString()
      
      let query = supabase
        .from('flashcards')
        .select(`
          id,
          question,
          answer,
          explanation,
          difficulty,
          external_resource_url,
          flashcard_progress!left (
            next_review_at,
            repetitions
          )
        `)

      if (topicId) {
        query = query.eq('topic_id', topicId)
      }

      const { data: flashcards, error } = await query

      if (error) throw error

      // Filtrar flashcards que precisam de revisão
      const flashcardsForReview = flashcards?.filter(flashcard => {
        const progress = flashcard.flashcard_progress?.[0]
        if (!progress) return true // Novo flashcard
        return !progress.next_review_at || new Date(progress.next_review_at) <= new Date(now)
      }) || []

      return flashcardsForReview.map(flashcard => ({
        id: flashcard.id,
        question: flashcard.question,
        answer: flashcard.answer,
        explanation: flashcard.explanation,
        difficulty: flashcard.difficulty,
        external_resource_url: flashcard.external_resource_url
      }))
    } catch (error) {
      console.error('Erro ao buscar flashcards para revisão:', error)
      return []
    }
  }
}