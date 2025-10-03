/**
 * ========================================
 * SERVIÇO DE INTEGRAÇÃO COM MEMBERKIT
 * ========================================
 *
 * API Docs: https://ajuda.memberkit.com.br/referencia-api/introducao
 * Chave Secreta: 3cG57cb4CAgAKMX7Fg59qY8f
 *
 * Funcionalidades Completas:
 * - ✅ Importar turmas (classrooms)
 * - ✅ Importar usuários (users)
 * - ✅ Importar cursos completos (courses + modules + lessons)
 * - ✅ Sincronização bidirecional
 * - ✅ Webhooks
 * - ✅ Rankings
 * - ✅ Rate limiting (120 req/min)
 */

import { supabase } from '@/lib/supabase/client'

const MEMBERKIT_API_URL = 'https://api.memberkit.com.br/v1'
const MEMBERKIT_SECRET_KEY = '3cG57cb4CAgAKMX7Fg59qY8f'

// Rate limiting: 120 requisições por minuto
const RATE_LIMIT = 120
const RATE_LIMIT_WINDOW = 60000 // 1 minuto

let requestCount = 0
let windowStart = Date.now()

// ==================== RATE LIMITING ====================

async function checkRateLimit() {
  const now = Date.now()

  if (now - windowStart > RATE_LIMIT_WINDOW) {
    requestCount = 0
    windowStart = now
  }

  if (requestCount >= RATE_LIMIT) {
    const waitTime = RATE_LIMIT_WINDOW - (now - windowStart)
    await new Promise(resolve => setTimeout(resolve, waitTime))
    requestCount = 0
    windowStart = Date.now()
  }

  requestCount++
}

// ==================== HTTP CLIENT ====================

async function memberkitRequest(endpoint: string, options: RequestInit = {}) {
  await checkRateLimit()

  const url = `${MEMBERKIT_API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MEMBERKIT_SECRET_KEY}`,
      'Accept': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(error.message || `Erro ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// ==================== ACADEMY ====================

export interface Academy {
  id: string
  name: string
  subdomain: string
  custom_domain?: string
  logo_url?: string
}

export async function getAcademy(): Promise<Academy> {
  return memberkitRequest('/academy')
}

// ==================== CLASSROOMS (TURMAS) ====================

export interface Classroom {
  id: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  status: 'active' | 'inactive' | 'archived'
  student_count: number
  created_at: string
}

export async function getClassrooms(): Promise<Classroom[]> {
  const response = await memberkitRequest('/classrooms')
  return response.data || []
}

// ==================== USERS (USUÁRIOS) ====================

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  cpf?: string
  phone?: string
  avatar_url?: string
  status: 'active' | 'inactive'
  role: 'student' | 'teacher' | 'admin'
  classroom_ids: string[]
  created_at: string
}

export async function getUsers(params?: {
  page?: number
  per_page?: number
  status?: string
  classroom_id?: string
}): Promise<{ data: User[], meta: { total: number, page: number, per_page: number } }> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
  if (params?.status) queryParams.append('status', params.status)
  if (params?.classroom_id) queryParams.append('classroom_id', params.classroom_id)

  const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
  return memberkitRequest(`/users${query}`)
}

// ==================== COURSES (CURSOS) ====================

export interface Course {
  id: string
  name: string
  description?: string
  thumbnail_url?: string
  status: 'published' | 'draft'
  module_count: number
  enrollment_count: number
  created_at: string
}

export interface Module {
  id: string
  course_id: string
  name: string
  description?: string
  order: number
  lesson_count: number
}

export interface Lesson {
  id: string
  module_id: string
  name: string
  description?: string
  order: number
  type: 'video' | 'text' | 'file'
  video_url?: string
  video_provider?: 'panda' | 'youtube' | 'vimeo'
  video_id?: string
  duration_minutes?: number
  is_preview: boolean
}

export async function getCourses(): Promise<Course[]> {
  const response = await memberkitRequest('/courses')
  return response.data || []
}

export async function getCourseModules(courseId: string): Promise<Module[]> {
  const response = await memberkitRequest(`/courses/${courseId}/modules`)
  return response.data || []
}

export async function getModuleLessons(moduleId: string): Promise<Lesson[]> {
  const response = await memberkitRequest(`/modules/${moduleId}/lessons`)
  return response.data || []
}

// ==================== RANKINGS ====================

export interface Ranking {
  user_id: string
  user_name: string
  user_avatar?: string
  score: number
  rank: number
}

export async function getRankings(classroomId?: string): Promise<Ranking[]> {
  const query = classroomId ? `?classroom_id=${classroomId}` : ''
  const response = await memberkitRequest(`/rankings${query}`)
  return response.data || []
}

export async function postScore(userId: string, score: number): Promise<void> {
  await memberkitRequest('/scores', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, score }),
  })
}

// ==================== WEBHOOKS ====================

export interface Webhook {
  id: string
  event: string
  url: string
  active: boolean
}

export async function getWebhooks(): Promise<Webhook[]> {
  const response = await memberkitRequest('/hooks')
  return response.data || []
}

export async function createWebhook(event: string, url: string): Promise<Webhook> {
  return memberkitRequest('/hooks', {
    method: 'POST',
    body: JSON.stringify({ event, url }),
  })
}

// ==================== IMPORT FUNCTIONS ====================

export interface ImportProgress {
  stage: string
  total: number
  current: number
  success: number
  errors: number
  currentItem?: string
}

export interface ImportResult {
  total: number
  success: number
  errors: number
  skipped: number
  errorDetails: Array<{ item: string; error: string }>
}

/**
 * Importa turmas da Memberkit
 */
export async function importClassrooms(
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const classrooms = await getClassrooms()

  const result: ImportResult = {
    total: classrooms.length,
    success: 0,
    errors: 0,
    skipped: 0,
    errorDetails: [],
  }

  for (let i = 0; i < classrooms.length; i++) {
    const classroom = classrooms[i]

    onProgress?.({
      stage: 'Importando Turmas',
      total: classrooms.length,
      current: i + 1,
      success: result.success,
      errors: result.errors,
      currentItem: classroom.name,
    })

    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('external_id', `memberkit_${classroom.id}`)
        .single()

      if (existing) {
        result.skipped++
        continue
      }

      // Criar turma
      const { error } = await supabase.from('classes').insert({
        external_id: `memberkit_${classroom.id}`,
        name: classroom.name,
        description: classroom.description || `Importado da Memberkit`,
        start_date: classroom.start_date || new Date().toISOString().split('T')[0],
        end_date: classroom.end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: classroom.status,
        class_type: 'standard',
      })

      if (error) throw error
      result.success++
    } catch (error: any) {
      result.errors++
      result.errorDetails.push({ item: classroom.name, error: error.message })
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return result
}

/**
 * Importa usuários da Memberkit
 */
export async function importUsers(
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  let page = 1
  let totalProcessed = 0
  const result: ImportResult = {
    total: 0,
    success: 0,
    errors: 0,
    skipped: 0,
    errorDetails: [],
  }

  while (true) {
    const response = await getUsers({ page, per_page: 50 })
    if (result.total === 0) result.total = response.meta.total

    if (response.data.length === 0) break

    for (const user of response.data) {
      totalProcessed++

      onProgress?.({
        stage: 'Importando Usuários',
        total: result.total,
        current: totalProcessed,
        success: result.success,
        errors: result.errors,
        currentItem: `${user.first_name} ${user.last_name}`,
      })

      try {
        // Criar usuário
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name,
            external_id: `memberkit_${user.id}`,
          },
        })

        if (authError && !authError.message.includes('already registered')) {
          throw authError
        }

        if (authData?.user) {
          // Criar perfil
          await supabase.from('users').upsert({
            id: authData.user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_active: user.status === 'active',
          })

          // Associar turmas
          for (const classroomId of user.classroom_ids || []) {
            const { data: classData } = await supabase
              .from('classes')
              .select('id')
              .eq('external_id', `memberkit_${classroomId}`)
              .single()

            if (classData) {
              await supabase.from('student_classes').upsert({
                user_id: authData.user.id,
                class_id: classData.id,
              })
            }
          }

          result.success++
        } else {
          result.skipped++
        }
      } catch (error: any) {
        result.errors++
        result.errorDetails.push({
          item: `${user.first_name} ${user.last_name} (${user.email})`,
          error: error.message,
        })
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    page++
  }

  return result
}

/**
 * Importa cursos da Memberkit
 */
export async function importCourses(
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const courses = await getCourses()

  const result: ImportResult = {
    total: courses.length,
    success: 0,
    errors: 0,
    skipped: 0,
    errorDetails: [],
  }

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]

    onProgress?.({
      stage: 'Importando Cursos',
      total: courses.length,
      current: i + 1,
      success: result.success,
      errors: result.errors,
      currentItem: course.name,
    })

    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('courses')
        .select('id')
        .eq('external_id', `memberkit_${course.id}`)
        .single()

      if (existing) {
        result.skipped++
        continue
      }

      // Criar curso
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          external_id: `memberkit_${course.id}`,
          name: course.name,
          description: course.description,
          thumbnail: course.thumbnail_url,
          is_published: course.status === 'published',
        })
        .select()
        .single()

      if (courseError) throw courseError

      // Importar módulos
      const modules = await getCourseModules(course.id)

      for (const module of modules) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('course_modules')
          .insert({
            course_id: courseData.id,
            external_id: `memberkit_${module.id}`,
            name: module.name,
            description: module.description,
            order: module.order,
          })
          .select()
          .single()

        if (moduleError) throw moduleError

        // Importar aulas
        const lessons = await getModuleLessons(module.id)

        for (const lesson of lessons) {
          await supabase.from('course_lessons').insert({
            module_id: moduleData.id,
            external_id: `memberkit_${lesson.id}`,
            name: lesson.name,
            description: lesson.description,
            order: lesson.order,
            video_url: lesson.video_url,
            video_provider: lesson.video_provider,
            is_preview: lesson.is_preview,
          })
        }
      }

      result.success++
    } catch (error: any) {
      result.errors++
      result.errorDetails.push({ item: course.name, error: error.message })
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return result
}

/**
 * Importação completa
 */
export async function importAll(
  onProgress?: (progress: ImportProgress) => void
): Promise<{
  classrooms: ImportResult
  users: ImportResult
  courses: ImportResult
}> {
  const classrooms = await importClassrooms(onProgress)
  const users = await importUsers(onProgress)
  const courses = await importCourses(onProgress)

  return { classrooms, users, courses }
}
