import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export interface AudioLesson {
  id: string
  title: string
  description?: string
  series?: string
  duration_minutes?: number
  audio_url?: string
  thumbnail_url?: string
  audio_source_type?: 'panda_video_hls' | 'mp3_url'
  rating?: number
  listens_count?: number
  created_at?: string
}

export const audioLessonService = {
  // Buscar todas as audioaulas
  async getAudioLessons(): Promise<AudioLesson[]> {
    try {
      logger.debug('🔍 Fetching audio lessons from database...')

      const { data: lessons, error } = await supabase
        .from('audio_lessons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('❌ Error fetching audio lessons:', error)
        throw error
      }

      logger.debug('✅ Found audio lessons:', lessons?.length || 0)

      return lessons?.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        series: lesson.series || 'Evercast',
        duration_minutes: lesson.duration_minutes,
        audio_url: lesson.audio_url,
        thumbnail_url: lesson.thumbnail_url || `https://img.usecurling.com/p/400/400?q=${encodeURIComponent(lesson.title || 'audio lesson')}`,
        audio_source_type: lesson.audio_source_type,
        rating: lesson.rating || 4.8,
        listens_count: lesson.listens_count || 0,
        created_at: lesson.created_at
      })) || []
    } catch (error) {
      logger.error('Erro ao buscar audioaulas:', error)
      return []
    }
  },

  // Buscar audioaula por ID
  async getAudioLessonById(id: string): Promise<AudioLesson | null> {
    try {
      const { data: lesson, error } = await supabase
        .from('audio_lessons')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        series: lesson.series || 'Evercast',
        duration_minutes: lesson.duration_minutes,
        audio_url: lesson.audio_url,
        thumbnail_url: lesson.thumbnail_url || `https://img.usecurling.com/p/400/400?q=${encodeURIComponent(lesson.title || 'audio lesson')}`,
        audio_source_type: lesson.audio_source_type,
        rating: lesson.rating || 4.8,
        listens_count: lesson.listens_count || 0,
        created_at: lesson.created_at
      }
    } catch (error) {
      logger.error('Erro ao buscar audioaula:', error)
      return null
    }
  },

  // Incrementar contador de visualizações
  async incrementListens(id: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_audio_listens', {
        lesson_id: id
      })

      if (error) throw error
    } catch (error) {
      logger.error('Erro ao incrementar contador de ouvintes:', error)
    }
  }
}
