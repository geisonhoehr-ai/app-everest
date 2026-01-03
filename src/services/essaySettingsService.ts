import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type ErrorCategory =
  Database['public']['Tables']['error_categories']['Row']
export type CriteriaTemplate =
  Database['public']['Tables']['evaluation_criteria_templates']['Row']

// Error Category Management
export const getErrorCategories = async (): Promise<ErrorCategory[]> => {
  const { data, error } = await supabase
    .from('error_categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export const createErrorCategory = async (
  category: Pick<ErrorCategory, 'name' | 'description'>,
): Promise<ErrorCategory> => {
  const { data, error } = await supabase
    .from('error_categories')
    .insert(category)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateErrorCategory = async (
  id: string,
  updates: Partial<ErrorCategory>,
): Promise<ErrorCategory> => {
  const { data, error } = await supabase
    .from('error_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteErrorCategory = async (id: string) => {
  const { error } = await supabase
    .from('error_categories')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Evaluation Criteria Template Management
export const getCriteriaTemplates = async (): Promise<CriteriaTemplate[]> => {
  const { data, error } = await supabase
    .from('evaluation_criteria_templates')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export const createCriteriaTemplate = async (
  template: Pick<CriteriaTemplate, 'name' | 'description' | 'criteria'>,
): Promise<CriteriaTemplate> => {
  const { data, error } = await supabase
    .from('evaluation_criteria_templates')
    .insert(template)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateCriteriaTemplate = async (
  id: string,
  updates: Partial<CriteriaTemplate>,
): Promise<CriteriaTemplate> => {
  const { data, error } = await supabase
    .from('evaluation_criteria_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteCriteriaTemplate = async (id: string) => {
  const { error } = await supabase
    .from('evaluation_criteria_templates')
    .delete()
    .eq('id', id)
  if (error) throw error
}
