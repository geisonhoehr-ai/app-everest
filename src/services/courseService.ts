import { supabase } from '@/lib/supabase/client'

export interface Course {
  id: string
  name: string
  description: string
  thumbnail_url?: string
  modules: CourseModule[]
}

export interface CourseModule {
  id: string
  name: string
  description: string
  order_index: number
  lessons: CourseLesson[]
}

export interface CourseLesson {
  id: string
  title: string
  description: string
  order_index: number
  duration_seconds?: number
  video_source_type?: string
  video_source_id?: string
  is_preview: boolean
  progress?: number
}

export const courseService = {
  // Buscar todos os cursos
  async getAllCourses(): Promise<Course[]> {
    try {
      const { data: courses, error } = await supabase
        .from('video_courses')
        .select(`
          id,
          name,
          description,
          thumbnail_url,
          video_modules (
            id,
            name,
            description,
            order_index,
            video_lessons (
              id,
              title,
              description,
              order_index,
              duration_seconds,
              video_source_type,
              video_source_id,
              is_preview
            )
          )
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      return courses?.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        modules: course.video_modules?.map(module => ({
          id: module.id,
          name: module.name,
          description: module.description,
          order_index: module.order_index,
          lessons: module.video_lessons?.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            order_index: lesson.order_index,
            duration_seconds: lesson.duration_seconds,
            video_source_type: lesson.video_source_type,
            video_source_id: lesson.video_source_id,
            is_preview: lesson.is_preview
          })) || []
        })) || []
      })) || []
    } catch (error) {
      console.error('Erro ao buscar cursos:', error)
      return []
    }
  },

  // Buscar curso por ID
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const { data: course, error } = await supabase
        .from('video_courses')
        .select(`
          id,
          name,
          description,
          thumbnail_url,
          video_modules (
            id,
            name,
            description,
            order_index,
            video_lessons (
              id,
              title,
              description,
              order_index,
              duration_seconds,
              video_source_type,
              video_source_id,
              is_preview
            )
          )
        `)
        .eq('id', courseId)
        .eq('is_active', true)
        .single()

      if (error) throw error

      return {
        id: course.id,
        name: course.name,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        modules: course.video_modules?.map(module => ({
          id: module.id,
          name: module.name,
          description: module.description,
          order_index: module.order_index,
          lessons: module.video_lessons?.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            order_index: lesson.order_index,
            duration_seconds: lesson.duration_seconds,
            video_source_type: lesson.video_source_type,
            video_source_id: lesson.video_source_id,
            is_preview: lesson.is_preview
          })) || []
        })) || []
      }
    } catch (error) {
      console.error('Erro ao buscar curso:', error)
      return null
    }
  },

  // Buscar progresso do usuário em um curso
  async getUserCourseProgress(userId: string, courseId: string): Promise<Record<string, number>> {
    try {
      const { data: progress, error } = await supabase
        .from('video_progress')
        .select('lesson_id, progress_percentage')
        .eq('user_id', userId)
        .in('lesson_id', [courseId]) // Assumindo que lesson_id corresponde ao course_id

      if (error) throw error

      const progressMap: Record<string, number> = {}
      progress?.forEach(p => {
        progressMap[p.lesson_id] = p.progress_percentage
      })

      return progressMap
    } catch (error) {
      console.error('Erro ao buscar progresso do curso:', error)
      return {}
    }
  },

  // Atualizar progresso do usuário em uma aula
  async updateLessonProgress(
    userId: string, 
    lessonId: string, 
    progressPercentage: number,
    currentTimeSeconds: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('video_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          progress_percentage: progressPercentage,
          current_time_seconds: currentTimeSeconds,
          is_completed: progressPercentage >= 90
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao atualizar progresso da aula:', error)
    }
  }
}
