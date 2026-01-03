import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type VideoCourse = Database['public']['Tables']['video_courses']['Row']
export type VideoCourseInsert =
  Database['public']['Tables']['video_courses']['Insert']
export type VideoCourseUpdate =
  Database['public']['Tables']['video_courses']['Update']

export type VideoModule = Database['public']['Tables']['video_modules']['Row']
export type VideoModuleInsert =
  Database['public']['Tables']['video_modules']['Insert']
export type VideoModuleUpdate =
  Database['public']['Tables']['video_modules']['Update']

export type VideoLesson = Database['public']['Tables']['video_lessons']['Row']
export type VideoLessonInsert =
  Database['public']['Tables']['video_lessons']['Insert']
export type VideoLessonUpdate =
  Database['public']['Tables']['video_lessons']['Update']

export type AdminCourse = VideoCourse & {
  modules_count?: number
  lessons_count?: number
}

// =====================================================
// CURSOS
// =====================================================

/**
 * Buscar todos os cursos (para administração)
 */
export const getAllCourses = async (): Promise<AdminCourse[]> => {
  const { data, error } = await supabase
    .from('video_courses')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching courses:', error)
    throw error
  }

  // Buscar contagens separadamente para cada curso
  const coursesWithCounts = await Promise.all(
    (data || []).map(async (course: any) => {
      // Contar módulos
      const { count: modulesCount } = await supabase
        .from('video_modules')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)

      // Contar aulas (buscar IDs dos módulos primeiro)
      const { data: modules } = await supabase
        .from('video_modules')
        .select('id')
        .eq('course_id', course.id)

      const moduleIds = modules?.map(m => m.id) || []

      let lessonsCount = 0
      if (moduleIds.length > 0) {
        const { count } = await supabase
          .from('video_lessons')
          .select('*', { count: 'exact', head: true })
          .in('module_id', moduleIds)
        lessonsCount = count || 0
      }

      return {
        ...course,
        modules_count: modulesCount || 0,
        lessons_count: lessonsCount,
      }
    })
  )

  return coursesWithCounts as AdminCourse[]
}

/**
 * Buscar curso por ID
 */
export const getCourseById = async (
  courseId: string,
): Promise<VideoCourse | null> => {
  const { data, error } = await supabase
    .from('video_courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (error) {
    console.error('Error fetching course:', error)
    throw error
  }

  return data
}

/**
 * Criar novo curso
 */
export const createCourse = async (
  courseData: VideoCourseInsert,
): Promise<VideoCourse> => {
  const { data, error } = await supabase
    .from('video_courses')
    .insert(courseData)
    .select()
    .single()

  if (error) {
    console.error('Error creating course:', error)
    throw error
  }

  return data
}

/**
 * Atualizar curso
 */
export const updateCourse = async (
  courseId: string,
  courseData: VideoCourseUpdate,
): Promise<VideoCourse> => {
  const { data, error } = await supabase
    .from('video_courses')
    .update(courseData)
    .eq('id', courseId)
    .select()
    .single()

  if (error) {
    console.error('Error updating course:', error)
    throw error
  }

  return data
}

/**
 * Deletar curso
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  const { error } = await supabase
    .from('video_courses')
    .delete()
    .eq('id', courseId)

  if (error) {
    console.error('Error deleting course:', error)
    throw error
  }
}

// =====================================================
// MÓDULOS
// =====================================================

/**
 * Buscar módulos de um curso
 */
export const getCourseModules = async (courseId: string) => {
  const { data, error } = await supabase
    .from('video_modules')
    .select(`
      *,
      video_lessons (count)
    `)
    .eq('course_id', courseId)
    .order('order_index')

  if (error) {
    console.error('Error fetching modules:', error)
    throw error
  }

  return data
}

/**
 * Criar módulo
 */
export const createModule = async (
  moduleData: VideoModuleInsert,
): Promise<VideoModule> => {
  const { data, error } = await supabase
    .from('video_modules')
    .insert(moduleData)
    .select()
    .single()

  if (error) {
    console.error('Error creating module:', error)
    throw error
  }

  return data
}

/**
 * Atualizar módulo
 */
export const updateModule = async (
  moduleId: string,
  moduleData: VideoModuleUpdate,
): Promise<VideoModule> => {
  const { data, error } = await supabase
    .from('video_modules')
    .update(moduleData)
    .eq('id', moduleId)
    .select()
    .single()

  if (error) {
    console.error('Error updating module:', error)
    throw error
  }

  return data
}

/**
 * Deletar módulo
 */
export const deleteModule = async (moduleId: string): Promise<void> => {
  const { error } = await supabase
    .from('video_modules')
    .delete()
    .eq('id', moduleId)

  if (error) {
    console.error('Error deleting module:', error)
    throw error
  }
}

// =====================================================
// AULAS
// =====================================================

/**
 * Buscar aulas de um módulo
 */
export const getModuleLessons = async (moduleId: string) => {
  const { data, error } = await supabase
    .from('video_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index')

  if (error) {
    console.error('Error fetching lessons:', error)
    throw error
  }

  return data
}

/**
 * Criar aula
 */
export const createLesson = async (
  lessonData: VideoLessonInsert,
): Promise<VideoLesson> => {
  const { data, error } = await supabase
    .from('video_lessons')
    .insert(lessonData)
    .select()
    .single()

  if (error) {
    console.error('Error creating lesson:', error)
    throw error
  }

  return data
}

/**
 * Atualizar aula
 */
export const updateLesson = async (
  lessonId: string,
  lessonData: VideoLessonUpdate,
): Promise<VideoLesson> => {
  const { data, error } = await supabase
    .from('video_lessons')
    .update(lessonData)
    .eq('id', lessonId)
    .select()
    .single()

  if (error) {
    console.error('Error updating lesson:', error)
    throw error
  }

  return data
}

/**
 * Deletar aula
 */
export const deleteLesson = async (lessonId: string): Promise<void> => {
  const { error } = await supabase
    .from('video_lessons')
    .delete()
    .eq('id', lessonId)

  if (error) {
    console.error('Error deleting lesson:', error)
    throw error
  }
}

/**
 * Buscar curso completo com módulos e aulas
 */
export const getCourseWithContent = async (courseId: string) => {
  const { data, error } = await supabase
    .from('video_courses')
    .select(`
      *,
      video_modules (
        *,
        video_lessons (*)
      )
    `)
    .eq('id', courseId)
    .single()

  if (error) {
    console.error('Error fetching course with content:', error)
    throw error
  }

  return data
}
