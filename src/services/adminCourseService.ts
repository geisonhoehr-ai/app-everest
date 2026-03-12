import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { logger } from '@/lib/logger'

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
    logger.error('Error fetching courses:', error)
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
    logger.error('Error fetching course:', error)
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
    logger.error('Error creating course:', error)
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
    logger.error('Error updating course:', error)
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
    logger.error('Error deleting course:', error)
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
    logger.error('Error fetching modules:', error)
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
    logger.error('Error creating module:', error)
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
    logger.error('Error updating module:', error)
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
    logger.error('Error deleting module:', error)
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
    logger.error('Error fetching lessons:', error)
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
    logger.error('Error creating lesson:', error)
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
    logger.error('Error updating lesson:', error)
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
    logger.error('Error deleting lesson:', error)
    throw error
  }
}

/**
 * Duplicar curso com todos os módulos, aulas e anexos
 */
export const duplicateCourse = async (
  courseId: string,
  adminUserId: string,
): Promise<VideoCourse> => {
  // 1. Fetch course with all modules, lessons, and attachments
  const { data: course, error: courseError } = await supabase
    .from('video_courses')
    .select(`
      *,
      video_modules (
        *,
        video_lessons (
          *,
          lesson_attachments (*)
        )
      )
    `)
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    throw new Error(`Erro ao buscar curso: ${courseError?.message ?? 'nao encontrado'}`)
  }

  // 2. Create the new course (copy)
  const { data: newCourse, error: newCourseError } = await supabase
    .from('video_courses')
    .insert({
      name: `${course.name} (Cópia)`,
      description: course.description,
      thumbnail_url: course.thumbnail_url,
      created_by_user_id: adminUserId,
      is_active: false, // start as draft
    })
    .select()
    .single()

  if (newCourseError || !newCourse) {
    throw new Error(`Erro ao criar copia: ${newCourseError?.message ?? 'sem dados'}`)
  }

  // 3. Copy modules and lessons
  const modules = course.video_modules || []
  for (const mod of modules) {
    const { data: newModule, error: modError } = await supabase
      .from('video_modules')
      .insert({
        course_id: newCourse.id,
        name: mod.name,
        description: mod.description,
        order_index: mod.order_index,
        is_active: mod.is_active,
      })
      .select('id')
      .single()

    if (modError || !newModule) {
      logger.error(`Erro ao copiar modulo "${mod.name}":`, modError)
      continue
    }

    const lessons = (mod as any).video_lessons || []
    for (const lesson of lessons) {
      const { data: newLesson, error: lessonError } = await supabase
        .from('video_lessons')
        .insert({
          module_id: newModule.id,
          title: lesson.title,
          description: lesson.description,
          order_index: lesson.order_index,
          video_source_type: lesson.video_source_type,
          video_source_id: lesson.video_source_id,
          duration_seconds: lesson.duration_seconds,
          is_active: lesson.is_active,
          is_preview: lesson.is_preview,
        })
        .select('id')
        .single()

      if (lessonError || !newLesson) {
        logger.error(`Erro ao copiar aula "${lesson.title}":`, lessonError)
        continue
      }

      // Copy attachments
      const attachments = (lesson as any).lesson_attachments || []
      if (attachments.length > 0) {
        await supabase.from('lesson_attachments').insert(
          attachments.map((a: any) => ({
            lesson_id: newLesson.id,
            file_url: a.file_url,
            file_name: a.file_name,
            file_type: a.file_type,
          }))
        )
      }
    }
  }

  return newCourse
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
    logger.error('Error fetching course with content:', error)
    throw error
  }

  return data
}
