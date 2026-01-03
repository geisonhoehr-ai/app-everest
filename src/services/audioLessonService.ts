import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export interface AudioLesson {
  id: string
  title: string
  description?: string
  series?: string // Mapped from module name
  module_id: string
  duration_minutes?: number
  audio_url?: string // Mapped from audio_source_url
  audio_source_type: 'panda_video_hls' | 'mp3_url'
  thumbnail_url?: string
  rating?: number
  listens_count?: number
  created_at?: string
}

export interface AudioModule {
  id: string
  name: string
  course_id: string
}

export const audioLessonService = {
  // Buscar todas as audioaulas
  async getAudioLessons(): Promise<AudioLesson[]> {
    try {
      logger.debug('🔍 Fetching audio lessons from database...')

      const { data: lessons, error } = await supabase
        .from('audio_lessons')
        .select(`
            *,
            audio_modules (
                name,
                audio_courses (
                    thumbnail_url
                )
            )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('❌ Error fetching audio lessons:', error)
        throw error
      }

      logger.debug('✅ Found audio lessons:', lessons?.length || 0)

      return lessons?.map(lesson => {
        // @ts-ignore
        const moduleName = lesson.audio_modules?.name || 'Geral'
        // @ts-ignore
        const courseThumb = lesson.audio_modules?.audio_courses?.thumbnail_url

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          series: moduleName,
          module_id: lesson.module_id,
          duration_minutes: lesson.duration_seconds ? Math.round(lesson.duration_seconds / 60) : 0,
          audio_url: lesson.audio_source_url,
          // Use course thumbnail or default
          thumbnail_url: courseThumb || `https://img.usecurling.com/p/400/400?q=${encodeURIComponent(lesson.title || 'audio lesson')}`,
          audio_source_type: lesson.audio_source_type || 'panda_video_hls',
          rating: 5.0, // Not in DB yet
          listens_count: 0, // Not in DB yet
          created_at: lesson.created_at
        }
      }) || []
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
        .select(`
            *,
            audio_modules (
                name,
                audio_courses (
                    thumbnail_url
                )
            )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // @ts-ignore
      const moduleName = lesson.audio_modules?.name || 'Geral'
      // @ts-ignore
      const courseThumb = lesson.audio_modules?.audio_courses?.thumbnail_url

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || '',
        series: moduleName,
        module_id: lesson.module_id,
        duration_minutes: lesson.duration_seconds ? Math.round(lesson.duration_seconds / 60) : 0,
        audio_url: lesson.audio_source_url,
        thumbnail_url: courseThumb || `https://img.usecurling.com/p/400/400?q=${encodeURIComponent(lesson.title || 'audio lesson')}`,
        audio_source_type: lesson.audio_source_type || 'panda_video_hls',
        rating: 5.0,
        listens_count: 0,
        created_at: lesson.created_at
      }
    } catch (error) {
      logger.error('Erro ao buscar audioaula:', error)
      return null
    }
  },

  async getAudioModules(): Promise<AudioModule[]> {
    const { data, error } = await supabase
      .from('audio_modules')
      .select('id, name, course_id')
      .eq('is_active', true)
      .order('name')

    if (error) return []
    return data
  },

  async createAudioLesson(lesson: {
    title: string,
    module_id: string,
    duration_seconds: number,
    audio_source_url: string,
    audio_source_type: 'panda_video_hls' | 'mp3_url',
    description?: string
  }): Promise<AudioLesson | null> {
    try {
      // Find next order index
      const { count } = await supabase.from('audio_lessons').select('*', { count: 'exact', head: true }).eq('module_id', lesson.module_id)

      const { data, error } = await supabase
        .from('audio_lessons')
        .insert({
          ...lesson,
          order_index: (count || 0) + 1,
          is_active: true,
          is_preview: false
        })
        .select()
        .single()

      if (error) throw error
      return data as any
    } catch (error) {
      logger.error('Error creating audio lesson:', error)
      throw error
    }
  },

  async updateAudioLesson(id: string, updates: Partial<AudioLesson>): Promise<AudioLesson | null> {
    try {
      const dbUpdates: any = {}
      if (updates.title) dbUpdates.title = updates.title
      if (updates.description) dbUpdates.description = updates.description
      if (updates.module_id) dbUpdates.module_id = updates.module_id
      if (updates.duration_minutes) dbUpdates.duration_seconds = updates.duration_minutes * 60
      if (updates.audio_url) dbUpdates.audio_source_url = updates.audio_url
      if (updates.audio_source_type) dbUpdates.audio_source_type = updates.audio_source_type

      const { data, error } = await supabase
        .from('audio_lessons')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as any
    } catch (error) {
      logger.error('Error updating audio lesson:', error)
      throw error
    }
  },

  async deleteAudioLesson(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('audio_lessons')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      logger.error('Error deleting audio lesson:', error)
      throw error
    }
  },

  // Incrementar contador de visualizações
  async incrementListens(id: string): Promise<void> {
    // Placeholder as DB doesn't have it yet
    logger.debug('Increment listen', id)
  }
}
