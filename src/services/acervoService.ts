import { supabase } from '@/lib/supabase/client'

export interface AcervoItem {
  id: string
  title: string
  category: 'livro' | 'prova'
  concurso: string | null
  subcategory: string | null
  year: number | null
  file_path: string
  file_size: number
  file_type: string
  created_at: string
}

export interface ProvaGroup {
  concurso: string
  subcategories: {
    name: string | null
    years: {
      year: number
      items: AcervoItem[]
    }[]
  }[]
  totalFiles: number
  yearRange: string
}

export type AcervoCreateInput = Omit<AcervoItem, 'id' | 'created_at'>

export const acervoService = {
  async getAll(): Promise<AcervoItem[]> {
    const { data, error } = await supabase
      .from('acervo_items')
      .select('*')
      .order('category')
      .order('concurso')
      .order('year', { ascending: false })
      .order('title')

    if (error) throw error
    return data || []
  },

  async create(item: AcervoCreateInput): Promise<AcervoItem> {
    const { data, error } = await supabase
      .from('acervo_items')
      .insert(item)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<AcervoCreateInput>): Promise<AcervoItem> {
    const { data, error } = await supabase
      .from('acervo_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    // Get file_path to delete from storage too
    const { data: item } = await supabase
      .from('acervo_items')
      .select('file_path')
      .eq('id', id)
      .single()

    if (item?.file_path) {
      await supabase.storage.from('acervo-digital').remove([item.file_path])
    }

    const { error } = await supabase
      .from('acervo_items')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async uploadFile(file: File, storagePath: string): Promise<{ path: string; size: number }> {
    const { error } = await supabase.storage
      .from('acervo-digital')
      .upload(storagePath, file, { contentType: file.type, upsert: true })

    if (error) throw error
    return { path: storagePath, size: file.size }
  },

  async getLivros(): Promise<AcervoItem[]> {
    const { data, error } = await supabase
      .from('acervo_items')
      .select('*')
      .eq('category', 'livro')
      .order('title')

    if (error) throw error
    return data || []
  },

  async getProvas(): Promise<AcervoItem[]> {
    const { data, error } = await supabase
      .from('acervo_items')
      .select('*')
      .eq('category', 'prova')
      .order('concurso')
      .order('year', { ascending: false })

    if (error) throw error
    return data || []
  },

  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('acervo-digital')
      .getPublicUrl(filePath)
    return data.publicUrl
  },

  groupProvasByConcurso(provas: AcervoItem[]): ProvaGroup[] {
    const concursoMap = new Map<string, AcervoItem[]>()

    for (const prova of provas) {
      if (!prova.concurso) continue
      const existing = concursoMap.get(prova.concurso) || []
      existing.push(prova)
      concursoMap.set(prova.concurso, existing)
    }

    const order = ['EAOF', 'EAOP', 'CAMAR', 'CADAR', 'CAFAR', 'CFOE']

    return order
      .filter(c => concursoMap.has(c))
      .map(concurso => {
        const items = concursoMap.get(concurso)!
        const years = [...new Set(items.map(i => i.year!))].sort((a, b) => b - a)
        const subcats = [...new Set(items.map(i => i.subcategory))]

        const subcategories = subcats.map(subcat => ({
          name: subcat,
          years: years
            .filter(y => items.some(i => i.year === y && i.subcategory === subcat))
            .map(year => ({
              year,
              items: items.filter(i => i.year === year && i.subcategory === subcat)
            }))
        })).filter(s => s.years.length > 0)

        return {
          concurso,
          subcategories,
          totalFiles: items.length,
          yearRange: `${Math.min(...years)}-${Math.max(...years)}`
        }
      })
  }
}
