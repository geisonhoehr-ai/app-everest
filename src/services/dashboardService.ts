import { supabase } from '@/lib/supabase/client'

export interface DashboardStats {
  courses: number
  flashcards: number
  quizzes: number
  simulations: number
  questions: number
  events: number
  evercasts: number
  students: number
}

export interface Course {
  id: string
  title: string
  description: string
  progress: number
  image: string
}

export interface Event {
  title: string
  date: string
  type: 'exam' | 'deadline' | 'live'
}

export const dashboardService = {
  // Buscar estatísticas do dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        coursesResult,
        flashcardsResult,
        quizzesResult,
        questionsResult,
        eventsResult,
        studentsResult,
        simulationsResult,
        evercastsResult
      ] = await Promise.all([
        supabase.from('video_courses').select('id', { count: 'exact' }),
        supabase.from('flashcards').select('id', { count: 'exact' }),
        supabase.from('quizzes').select('id', { count: 'exact' }),
        supabase.from('quiz_questions').select('id', { count: 'exact' }),
        supabase.from('calendar_events').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('simulations').select('id', { count: 'exact' }),
        supabase.from('audio_lessons').select('id', { count: 'exact' })
      ])

      return {
        courses: coursesResult.count || 0,
        flashcards: flashcardsResult.count || 0,
        quizzes: quizzesResult.count || 0,
        simulations: simulationsResult.count || 0,
        questions: questionsResult.count || 0,
        events: eventsResult.count || 0,
        evercasts: evercastsResult.count || 0,
        students: studentsResult.count || 0
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error)
      // Retorna valores padrão em caso de erro
      return {
        courses: 0,
        flashcards: 0,
        quizzes: 0,
        simulations: 0,
        questions: 0,
        events: 0,
        evercasts: 0,
        students: 0
      }
    }
  },

  // Buscar cursos do usuário
  async getUserCourses(userId: string): Promise<Course[]> {
    try {
      // Reusing the robust logic from courseService
      const { courseService } = await import('./courseService');
      const coursesWithDetails = await courseService.getUserCoursesWithDetails(userId);

      return coursesWithDetails.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        progress: c.progress,
        image: c.image
      }));
    } catch (error) {
      console.error('Erro ao buscar cursos do usuário:', error)
      return []
    }
  },

  // Buscar próximos eventos
  async getUpcomingEvents(userId: string): Promise<Event[]> {
    try {
      // Buscar turmas do usuário
      const { data: userClasses, error: classesError } = await supabase
        .from('student_classes')
        .select('class_id')
        .eq('user_id', userId)

      if (classesError) throw classesError

      const classIds = userClasses?.map(uc => uc.class_id) || []

      // Buscar eventos das turmas do usuário e eventos gerais
      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .or(`class_id.in.(${classIds.join(',')}),class_id.is.null`)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5)

      if (eventsError) throw eventsError

      return events?.map(event => ({
        title: event.title,
        date: new Date(event.start_time).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: event.event_type === 'LIVE_CLASS' ? 'live' :
          event.event_type === 'ESSAY_DEADLINE' ? 'deadline' : 'exam'
      })) || []
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)
      return []
    }
  },

  // Buscar estatísticas do professor
  async getTeacherStats(teacherId: string): Promise<{
    essaysToCorrect: number
    forumQuestions: number
    activeStudents: number
  }> {
    try {
      const [
        essaysResult,
        studentsResult
      ] = await Promise.all([
        supabase.from('essays').select('id', { count: 'exact' }).eq('teacher_id', teacherId).eq('status', 'draft'),
        supabase.from('student_classes').select('user_id', { count: 'exact' })
      ])

      return {
        essaysToCorrect: essaysResult.count || 0,
        forumQuestions: 8, // Mockado por enquanto
        activeStudents: studentsResult.count || 0
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do professor:', error)
      return {
        essaysToCorrect: 0,
        forumQuestions: 0,
        activeStudents: 0
      }
    }
  }
}
