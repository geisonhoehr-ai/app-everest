import { supabase } from '@/lib/supabase/client'

const MEMBERKIT_API_KEY = '3cG57cb4CAgAKMX7Fg59qY8f'
const MEMBERKIT_BASE_URL = 'https://memberkit.com.br/api/v1'

interface MemberkitCourse {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
  [key: string]: any
}

interface MemberkitStudent {
  id: number
  name: string
  email: string
  [key: string]: any
}

/**
 * Busca todos os cursos/turmas da Memberkit
 */
export async function fetchMemberkitCourses(): Promise<MemberkitCourse[]> {
  console.log('📚 Buscando cursos da Memberkit...')

  const allCourses: MemberkitCourse[] = []
  let currentPage = 1
  let totalPages = 1

  try {
    while (currentPage <= totalPages) {
      const url = `${MEMBERKIT_BASE_URL}/courses?api_key=${MEMBERKIT_API_KEY}&page=${currentPage}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Erro na API Memberkit: ${response.status} ${response.statusText}`)
      }

      // Pegar informações de paginação dos headers
      const totalPagesHeader = response.headers.get('Total-Pages')
      if (totalPagesHeader) {
        totalPages = parseInt(totalPagesHeader, 10)
      }

      const courses = await response.json()
      allCourses.push(...courses)

      console.log(`✅ Página ${currentPage}/${totalPages} - ${courses.length} cursos`)
      currentPage++

      // Respeitar limite de 120 requisições por minuto
      if (currentPage <= totalPages) {
        await new Promise(resolve => setTimeout(resolve, 600)) // 600ms entre requisições
      }
    }

    console.log(`✅ Total de cursos encontrados: ${allCourses.length}`)
    return allCourses
  } catch (error) {
    console.error('❌ Erro ao buscar cursos da Memberkit:', error)
    throw error
  }
}

/**
 * Importa um curso da Memberkit para o sistema
 */
export async function importCourseToClass(course: MemberkitCourse) {
  console.log(`📥 Importando curso: ${course.name}`)

  try {
    // Verificar se já existe uma turma com esse ID externo
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id')
      .eq('external_id', `memberkit_${course.id}`)
      .single()

    if (existingClass) {
      console.log(`⏭️ Turma já existe: ${course.name}`)
      return existingClass
    }

    // Criar nova turma
    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        name: course.name,
        description: course.description || `Importado da Memberkit - ${course.name}`,
        external_id: `memberkit_${course.id}`,
        status: 'active',
        class_type: 'standard',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +1 ano
        created_at: course.created_at,
        updated_at: course.updated_at
      })
      .select()
      .single()

    if (error) {
      console.error(`❌ Erro ao criar turma ${course.name}:`, error)
      throw error
    }

    console.log(`✅ Turma criada: ${course.name}`)
    return newClass
  } catch (error) {
    console.error(`❌ Erro ao importar curso ${course.name}:`, error)
    throw error
  }
}

/**
 * Importa TODOS os cursos da Memberkit
 */
export async function importAllMemberkitCourses() {
  console.log('🚀 Iniciando importação de cursos da Memberkit...')

  try {
    const courses = await fetchMemberkitCourses()

    console.log(`📊 Importando ${courses.length} cursos...`)

    const results = {
      total: courses.length,
      imported: 0,
      skipped: 0,
      errors: 0
    }

    for (const course of courses) {
      try {
        await importCourseToClass(course)
        results.imported++
      } catch (error) {
        console.error(`❌ Falha ao importar ${course.name}:`, error)
        results.errors++
      }

      // Pequeno delay entre imports
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('✅ Importação concluída!')
    console.log(`📊 Resultados:`)
    console.log(`   Total: ${results.total}`)
    console.log(`   Importados: ${results.imported}`)
    console.log(`   Ignorados (já existiam): ${results.skipped}`)
    console.log(`   Erros: ${results.errors}`)

    return results
  } catch (error) {
    console.error('❌ Erro na importação:', error)
    throw error
  }
}
