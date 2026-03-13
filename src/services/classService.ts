import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export interface Class {
  id: string
  name: string
  description: string
  teacher_id: string
  start_date: string
  end_date: string
  status: 'active' | 'inactive' | 'archived'
  class_type: 'standard' | 'trial'
  student_count?: number
  enabled_features_count?: number
  created_at: string
  updated_at: string
}

export interface ClassStudent {
  id: string
  user_id: string
  class_id: string
  enrollment_date: string
  first_name: string
  last_name: string
  email: string
}

export async function getClasses(): Promise<Class[]> {


  try {
    // Try to use view first
    const { data, error } = await supabase
      .from('class_stats')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data
    }
  } catch (e) {
    // View not available, using fallback query
  }

  // Fallback: Query classes and count students manually
  const { data: classesData, error: classesError } = await supabase
    .from('classes')
    .select('*')
    .order('created_at', { ascending: false })

  if (classesError) {
    logger.error('❌ Error loading classes:', classesError)
    // Return empty array instead of throwing - don't crash the app
    return []
  }

  // Batch fetch counts instead of per-class queries (2 queries instead of 2×N)
  try {
    const classIds = (classesData || []).map(c => c.id)

    const [studentsResult, permissionsResult] = await Promise.all([
      supabase.from('student_classes').select('class_id').in('class_id', classIds),
      supabase.from('class_feature_permissions').select('class_id').in('class_id', classIds),
    ])

    // Count in memory
    const studentCounts = new Map<string, number>()
    for (const sc of studentsResult.data || []) {
      studentCounts.set(sc.class_id, (studentCounts.get(sc.class_id) || 0) + 1)
    }
    const permissionCounts = new Map<string, number>()
    for (const p of permissionsResult.data || []) {
      permissionCounts.set(p.class_id, (permissionCounts.get(p.class_id) || 0) + 1)
    }

    return (classesData || []).map(classItem => ({
      ...classItem,
      student_count: studentCounts.get(classItem.id) || 0,
      enabled_features_count: permissionCounts.get(classItem.id) || 0,
      status: classItem.status || 'active' as any,
    }))
  } catch (e) {
    logger.error('Error enriching class data:', e)
    return classesData || []
  }
}

export async function getClassById(classId: string): Promise<Class | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single()

  if (error) throw error
  return data
}

export async function createClass(classData: {
  name: string
  description?: string
  start_date: string
  end_date: string
  teacher_id?: string
  class_type?: 'standard' | 'trial'
}): Promise<Class> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get teacher_id from current user if not provided
  let teacherId = classData.teacher_id
  if (!teacherId && user) {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    teacherId = teacher?.id
  }

  const { data, error } = await supabase
    .from('classes')
    .insert({
      name: classData.name,
      description: classData.description || '',
      teacher_id: teacherId,
      start_date: classData.start_date,
      end_date: classData.end_date,
      class_type: classData.class_type || 'standard',
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateClass(classId: string, updates: Partial<Class>): Promise<Class> {
  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', classId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteClass(classId: string): Promise<void> {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId)

  if (error) throw error
}

export async function getClassStudents(classId: string): Promise<ClassStudent[]> {
  const { data, error } = await supabase
    .from('student_classes')
    .select(`
      id,
      user_id,
      class_id,
      enrollment_date,
      users!inner(
        email,
        first_name,
        last_name
      )
    `)
    .eq('class_id', classId)

  if (error) throw error

  return (data || []).map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    class_id: item.class_id,
    enrollment_date: item.enrollment_date,
    email: item.users.email,
    first_name: item.users.first_name,
    last_name: item.users.last_name
  }))
}

export async function addStudentToClass(classId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('student_classes')
    .insert({
      class_id: classId,
      user_id: userId,
      enrollment_date: new Date().toISOString().split('T')[0]
    })

  if (error) throw error
}

export async function removeStudentFromClass(enrollmentId: string): Promise<void> {
  const { error } = await supabase
    .from('student_classes')
    .delete()
    .eq('id', enrollmentId)

  if (error) throw error
}

export async function getClassFeaturePermissions(classId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('class_feature_permissions')
    .select('feature_key')
    .eq('class_id', classId)

  if (error) throw error
  return (data || []).map(item => item.feature_key)
}

export async function setClassFeaturePermissions(
  classId: string, 
  featureKeys: string[]
): Promise<void> {
  // First, delete all existing permissions for this class
  await supabase
    .from('class_feature_permissions')
    .delete()
    .eq('class_id', classId)

  // Then insert the new permissions
  if (featureKeys.length > 0) {
    const { error } = await supabase
      .from('class_feature_permissions')
      .insert(
        featureKeys.map(featureKey => ({
          class_id: classId,
          feature_key: featureKey
        }))
      )

    if (error) throw error
  }
}

