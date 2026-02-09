import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

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
  completed?: boolean
  last_position?: number
}

export interface CourseWithProgress {
  id: string
  title: string
  description: string
  progress: number
  image: string
  modules_count: number
  lessons_count: number
  total_hours: number
  category?: string
}

export interface CourseTrail {
  trailName: string
  totalCourses: number
  totalLessons: number
  completedLessons: number
  averageProgress: number
  completedCourses: number
  courses: CourseWithProgress[]
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
      logger.error('Erro ao buscar cursos:', error)
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
      logger.error('Erro ao buscar curso:', error)
      return null
    }
  },

  // Buscar progresso do usuário em um curso
  async getUserCourseProgress(userId: string, courseId: string): Promise<Record<string, number>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== userId) return {}

      // Primeiro pegamos todos os módulos do curso
      const { data: modules } = await supabase
        .from('video_modules')
        .select('id')
        .eq('course_id', courseId)

      const moduleIds = modules?.map(m => m.id) || []
      if (moduleIds.length === 0) return {}

      // Depois pegamos todas as aulas desses módulos
      const { data: lessons } = await supabase
        .from('video_lessons')
        .select('id')
        .in('module_id', moduleIds)

      const lessonIds = lessons?.map(l => l.id) || []
      if (lessonIds.length === 0) return {}

      // Agora sim buscamos o progresso nessas aulas
      const { data: progress, error } = await supabase
        .from('video_progress')
        .select('lesson_id, progress_percentage')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      if (error) throw error

      const progressMap: Record<string, number> = {}
      progress?.forEach(p => {
        progressMap[p.lesson_id] = p.progress_percentage
      })

      return progressMap
    } catch (error) {
      logger.error('Erro ao buscar progresso do curso:', error)
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
      logger.error('Erro ao atualizar progresso da aula:', error)
    }
  },

  /**
   * Get all courses for a user with detailed progress and statistics
   */
  async getUserCoursesWithDetails(userId: string): Promise<CourseWithProgress[]> {
    try {
      logger.debug('🔍 Getting user courses for user:', userId)

      // Get user's classes
      const { data: userClasses, error: classesError } = await supabase
        .from('student_classes')
        .select('class_id')
        .eq('user_id', userId)

      if (classesError) throw classesError

      const classIds = userClasses?.map(uc => uc.class_id) || []
      logger.debug('📚 User class IDs:', classIds)
      if (classIds.length === 0) return []

      // Get courses for user's classes
      const { data: classCourses, error: coursesError } = await supabase
        .from('class_courses')
        .select(`
          course_id,
          video_courses (
            id,
            name,
            description,
            thumbnail_url
          )
        `)
        .in('class_id', classIds)

      if (coursesError) throw coursesError

      logger.debug('🎓 Class courses found:', classCourses)

      const courseIds = classCourses?.map(cc => cc.course_id) || []
      logger.debug('📖 Course IDs:', courseIds)
      if (courseIds.length === 0) return []

      // Get modules for each course
      const coursesWithDetails = await Promise.all(
        (classCourses || []).map(async (cc) => {
          const courseId = cc.course_id
          const course = cc.video_courses

          // Get modules count
          const { data: modules, error: modulesError } = await supabase
            .from('video_modules')
            .select('id')
            .eq('course_id', courseId)
            .eq('is_active', true)

          if (modulesError) {
            logger.error('Error fetching modules:', modulesError)
          }

          const moduleIds = modules?.map(m => m.id) || []
          const modulesCount = modules?.length || 0

          // Get lessons count and total duration
          let lessonsCount = 0
          let totalSeconds = 0

          if (moduleIds.length > 0) {
            const { data: lessons, error: lessonsError } = await supabase
              .from('video_lessons')
              .select('id, duration_seconds')
              .in('module_id', moduleIds)
              .eq('is_active', true)

            if (!lessonsError && lessons) {
              lessonsCount = lessons.length
              totalSeconds = lessons.reduce((sum, lesson) => sum + (lesson.duration_seconds || 0), 0)
            }
          }

          // Get user progress for this course
          let courseProgress = 0
          let completedLessonsCount = 0

          if (lessonsCount > 0 && moduleIds.length > 0) {
            const { data: progressData, error: progressError } = await supabase
              .from('video_progress')
              .select('lesson_id, progress_percentage, is_completed')
              .eq('user_id', userId)

            if (!progressError && progressData) {
              // Get lesson IDs for this course
              const { data: courseLessons } = await supabase
                .from('video_lessons')
                .select('id')
                .in('module_id', moduleIds)

              const courseLessonIds = courseLessons?.map(l => l.id) || []
              const courseProgressData = progressData.filter(p => courseLessonIds.includes(p.lesson_id))

              if (courseProgressData.length > 0) {
                const totalProgress = courseProgressData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0)
                courseProgress = Math.round(totalProgress / lessonsCount)
                completedLessonsCount = courseProgressData.filter(p => p.is_completed).length
              }
            }
          }

          return {
            id: courseId,
            title: course?.name || 'Curso',
            description: course?.description || '',
            progress: courseProgress,
            image: course?.thumbnail_url || 'https://images.unsplash.com/photo-1516397281156-ca07cf9746fc?w=400&h=200&fit=crop',
            modules_count: modulesCount,
            lessons_count: lessonsCount,
            total_hours: Math.round(totalSeconds / 3600 * 10) / 10, // Round to 1 decimal
            category: 'Geral' // Can be enhanced with actual categories later
          }
        })
      )

      logger.debug('✅ Final courses with details:', coursesWithDetails)
      return coursesWithDetails
    } catch (error) {
      logger.error('❌ Error fetching user courses with details:', error)
      return []
    }
  },

  /**
   * Group courses by trail/category for Netflix-style display
   */
  async getUserCoursesByTrail(userId: string): Promise<CourseTrail[]> {
    try {
      const courses = await this.getUserCoursesWithDetails(userId)

      if (courses.length === 0) {
        return []
      }

      // Group courses by category
      const coursesByCategory = courses.reduce((acc, course) => {
        const category = course.category || 'Geral'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(course)
        return acc
      }, {} as Record<string, CourseWithProgress[]>)

      // Convert to CourseTrail format
      const trails: CourseTrail[] = Object.entries(coursesByCategory).map(([trailName, trailCourses]) => {
        const totalLessons = trailCourses.reduce((sum, c) => sum + c.lessons_count, 0)
        const completedLessons = trailCourses.reduce((sum, c) => {
          return sum + Math.round((c.lessons_count * c.progress) / 100)
        }, 0)
        const averageProgress = trailCourses.length > 0
          ? trailCourses.reduce((sum, c) => sum + c.progress, 0) / trailCourses.length
          : 0
        const completedCourses = trailCourses.filter(c => c.progress === 100).length

        return {
          trailName,
          totalCourses: trailCourses.length,
          totalLessons,
          completedLessons,
          averageProgress: Math.round(averageProgress),
          completedCourses,
          courses: trailCourses
        }
      })

      return trails
    } catch (error) {
      logger.error('Error fetching courses by trail:', error)
      return []
    }
  },

  /**
   * Get a specific course with all its modules and lessons with progress
   */
  async getCourseWithModulesAndProgress(courseId: string, userId: string) {
    try {
      // Get course details
      const { data: course, error: courseError } = await supabase
        .from('video_courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      // Get modules
      const { data: modules, error: modulesError } = await supabase
        .from('video_modules')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('order_index')

      if (modulesError) throw modulesError

      // Get lessons for each module with progress
      const modulesWithLessons = await Promise.all(
        (modules || []).map(async (module) => {
          const { data: lessons, error: lessonsError } = await supabase
            .from('video_lessons')
            .select('*')
            .eq('module_id', module.id)
            .eq('is_active', true)
            .order('order_index')

          if (lessonsError) {
            logger.error('Error fetching lessons:', lessonsError)
            return { ...module, lessons: [] }
          }

          // Get progress for each lesson
          const lessonsWithProgress = await Promise.all(
            (lessons || []).map(async (lesson) => {
              const { data: progress } = await supabase
                .from('video_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('lesson_id', lesson.id)
                .single()

              return {
                ...lesson,
                progress: progress?.progress_percentage || 0,
                completed: !!progress?.completed_at,
                last_position: progress?.last_position_seconds || 0
              }
            })
          )

          return {
            ...module,
            lessons: lessonsWithProgress
          }
        })
      )

      return {
        ...course,
        modules: modulesWithLessons
      }
    } catch (error) {
      logger.error('Error fetching course with modules:', error)
      return null
    }
  }
}
