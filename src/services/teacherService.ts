import { supabase } from '@/lib/supabase/client'

export interface Teacher {
    id: string
    user_id: string
    employee_id_number?: string
    hire_date?: string
    department?: string
    first_name: string
    last_name: string
    email: string
}

export async function getTeachers(): Promise<Teacher[]> {
    try {
        const { data, error } = await (supabase as any)
            .from('teachers')
            .select(`
        id,
        user_id,
        employee_id_number,
        hire_date,
        department,
        users:users (
          first_name,
          last_name,
          email
        )
      `)

        if (error) {
            console.error('Error fetching teachers:', error)
            return []
        }

        return (data || []).map((t: any) => ({
            id: t.id,
            user_id: t.user_id,
            employee_id_number: t.employee_id_number,
            hire_date: t.hire_date,
            department: t.department,
            first_name: t.users?.first_name || '',
            last_name: t.users?.last_name || '',
            email: t.users?.email || ''
        }))
    } catch (error) {
        console.error('Network error fetching teachers:', error)
        return []
    }
}

export async function getTeacherByUserId(userId: string): Promise<Teacher | null> {
    try {
        const { data, error } = await (supabase as any)
            .from('teachers')
            .select(`
        id,
        user_id,
        employee_id_number,
        hire_date,
        department,
        users:users (
          first_name,
          last_name,
          email
        )
      `)
            .eq('user_id', userId)
            .single()

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('Error fetching teacher by user ID:', error)
            }
            return null
        }

        return {
            id: data.id,
            user_id: data.user_id,
            employee_id_number: data.employee_id_number,
            hire_date: data.hire_date,
            department: data.department,
            first_name: data.users?.first_name || '',
            last_name: data.users?.last_name || '',
            email: data.users?.email || ''
        }
    } catch (error) {
        console.error('Network error fetching teacher by user ID:', error)
        return null
    }
}
