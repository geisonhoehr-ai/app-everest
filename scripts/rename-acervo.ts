import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hnhzindsfuqnaxosujay.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaHppbmRzZnVxbmF4b3N1amF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzU5NTIsImV4cCI6MjA2ODUxMTk1Mn0.cT7fe1wjee9HfZw_IVD7K_exMqu-LtUxiClCD-sDLyU'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ANON_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Helpers ──────────────────────────────────────────────────────────
const SMALL_WORDS = new Set([
  'a', 'e', 'o', 'as', 'os', 'de', 'do', 'da', 'dos', 'das',
  'em', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'uns', 'umas',
  'por', 'para', 'com', 'sem', 'sob', 'que', 'se', 'ou',
])

const ACRONYMS = new Set([
  'EAOF', 'EAOP', 'EAOAP', 'EAOEAR', 'CAMAR', 'CADAR', 'CAFAR', 'CFOE',
  'CIAAR', 'FGR', 'CKM', 'SVA', 'SVM', 'ANV', 'PDF', 'GO',
  'CESBRASPE', 'CESPE',
])

function titleCase(text: string): string {
  return text
    .split(' ')
    .map((word, i) => {
      const upper = word.toUpperCase()
      if (ACRONYMS.has(upper)) return upper
      // Keep "15ª", "6ª" etc unchanged
      if (/^\d+[ªº]/.test(word)) return word
      if (i > 0 && SMALL_WORDS.has(word.toLowerCase())) return word.toLowerCase()
      if (word.length === 0) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

// ── Complete manual mapping: old title → new title ──────────────────
// Every item gets a proper, human-curated name
function getManualTitle(title: string, category: string, concurso: string | null, year: number | null): string | null {
  // Normalize for matching: trim + collapse whitespace
  const key = title.replace(/\s+/g, ' ').trim()

  // First check title+year key (for duplicate titles across years)
  const yearKey = `${key}||${year}`
  const yearMap: Record<string, string> = {
    'Aeronaves - Versão A||2020': 'Prova Aeronaves - Versão A - EAOF 2020',
    'Aeronaves - Versão A||2018': 'Prova Aeronaves - Versão A - EAOF 2018',
  }
  if (yearMap[yearKey]) return yearMap[yearKey]

  const map: Record<string, string> = {
    // ═══ LIVROS ═══════════════════════════════════════════════════════
    '900 QUESTÕES - Gramática aplicada para concursos - 288pg - LIVRO.pdf': '900 Questões de Gramática para Concursos',
    'A Gramatica para Concursos - Fernando Pestana': 'A Gramática para Concursos - Fernando Pestana',
    'A Gramatica para Concursos - Fernando Pestana(1)': 'A Gramática para Concursos - Fernando Pestana (Vol. 2)',
    'APOSTILA DE GRAMÁTICA': 'Apostila de Gramática',
    'Cegalla -gabarito': 'Gramática Cegalla - Gabarito',
    'Cópia de Educatrevo_PORTUGUES-ATUALIZADA-PARA-CONCURSOS_ed1548b889774188821331d15f63d469': 'Português Atualizada para Concursos - Educatrevo',
    'FAÇA E PASSE': 'Faça e Passe',
    'GRAMÁTICA ESQUEMATIZADA - PEDRO LENZA': 'Gramática Esquematizada - Pedro Lenza',
    'Gramática Fácil': 'Gramática Fácil',
    'GRAMÁTICA PELA PRÁTICA 15ª Ed 2012 - ERNANI PMENTEL': 'Gramática pela Prática (15ª Ed.) - Ernani Pimentel',
    'GRÁMATICA_PARA_CONCURSOS_TEORIA_E_MAIS_DE_1000_QUESTÕES_–_6ªED': 'Gramática para Concursos - Teoria e 1000 Questões (6ª Ed.)',
    'Inteligência em Concursos - Prof. Pier': 'Inteligência em Concursos - Prof. Pier',
    'INTERPRETAÇÃO DE TEXTOS': 'Interpretação de Textos',
    'Manual Completo para Concursos em Português': 'Manual Completo de Português para Concursos',
    'Moderna Gramática Portuguesa': 'Moderna Gramática Portuguesa',
    'Nova Gramática da Língua Portuguesa para Concursos': 'Nova Gramática da Língua Portuguesa para Concursos',
    'Para_Entender_o_Texto_Leitura_e_Redação_Platão_&_Fiorin': 'Para Entender o Texto: Leitura e Redação - Platão & Fiorin',
    'Para_Entender_o_Texto_Leitura_e_Redação_Platão_&_Fiorin_GABARITO': 'Para Entender o Texto: Leitura e Redação - Platão & Fiorin (Gabarito)',
    'Serie600_Questoes_CESBRASPE__Portugues_Qs Questao e Simulado': '600 Questões CESBRASPE - Português (Questões e Simulados)',

    // ═══ EAOF - Banca FGR (2022+) ═══════════════════════════════════
    'Prova EAOF 2026 (Versão B) Com anotações': 'Prova EAOF 2026 - Versão B (Com Anotações)',
    'EAOF 2026': 'Prova EAOF 2026',
    'Gabaritoddefinitivo_EAOF2025': 'Gabarito Definitivo - EAOF 2025',
    'SVA 2025': 'Prova SVA - EAOF 2025',
    '08_gabarito_definitivo_mod_EAOF2024': 'Gabarito Definitivo - EAOF 2024',
    'EAOF 2024 A': 'Prova EAOF 2024 - Versão A',
    'EAOF - 2023 - Gabarito Definitivo': 'Gabarito Definitivo - EAOF 2023',
    'Tema de redação': 'Tema de Redação - EAOF 2023',
    'Pag1': 'Prova EAOF 2023 - Caderno',
    'EAOF 2023': 'Prova EAOF 2023',
    'gabaritos_definitivo_EAOF2022': 'Gabarito Definitivo - EAOF 2022',
    'EAOF SVM - 2022': 'Prova EAOF 2022 - SVM',

    // ═══ EAOF - Banca Fadecit (2017-2021) ════════════════════════════
    'GO_Serviços Administrativos (SVA) (PROVA A)': 'Gabarito Oficial SVA (Versão A) - EAOF 2021',
    'Serviços Administrativos - Versão A': 'Prova SVA - Versão A - EAOF 2021',

    // EAOF 2020
    'GO_AERONAVES_A': 'Gabarito Oficial Aeronaves (Versão A) - EAOF 2020',

    // EAOF 2019
    'Serviços Hospitalares - Versão A(1)': 'Prova Serviços Hospitalares - Versão A - EAOF 2019',
    'GO_CIAAR_Serviços Hospitalares_A': 'Gabarito Oficial Serviços Hospitalares (Versão A) - EAOF 2019',

    // EAOF 2018
    'GO_CIAAR_ANV A': 'Gabarito Oficial ANV (Versão A) - EAOF 2018',

    // EAOF 2017
    'ANV': 'Gabarito ANV - EAOF 2017',
    'CADERNO ANV_VERSÃO A': 'Prova ANV - Versão A - EAOF 2017',

    // ═══ EAOF - Banca CKM (2016) ════════════════════════════════════
    'EAOF 2016 GRAMÁTICA E INTERPRETAÇÃO DE TEXTO - VERSÃO A': 'Gramática e Interpretação de Texto - Versão A - EAOF 2016',

    // ═══ EAOF - Banca Consulplan (2014-2015) ═════════════════════════
    'EAOF 2015 GRAMÁTICA E INTERPRETAÇÃO DE TEXTO - VERSÃO A': 'Gramática e Interpretação de Texto - Versão A - EAOF 2015',
    '01 GRAMÁTICA E INTERPRETAÇÃO DE TEXTO - VERSÃO A': 'Gramática e Interpretação de Texto - Versão A - EAOF 2014',

    // ═══ EAOP / EAOEAR ═══════════════════════════════════════════════
    'GestaoResultado_Gabarito_EAOAP_2026': 'Gabarito EAOAP 2026',
    'Provas_EAOAP': 'Prova EAOAP 2025',
    'TEMA EAOP 2024': 'Tema de Redação - EAOP 2024',
    'Recurso deferido questão 25': 'Recurso Deferido - Questão 25 - EAOP 2024',
    'EAOEAR 2024 - Versão A (Versão Final)': 'Prova EAOEAR 2024 - Versão A (Final)',
    'Gabarito_provisrio_EAOAP': 'Gabarito Provisório - EAOAP 2021',
    'eaoap-gramatica-e-interpretacao-de-texto-2017': 'Gramática e Interpretação de Texto - EAOAP 2017',
    'EAOAp GABARITO 2021': 'Gabarito - EAOAP 2021',
    'EAOAp ADMINISTRAÇÃO 2021': 'Prova Administração - EAOAP 2021',

    // ═══ CAMAR ═══════════════════════════════════════════════════════
    'Alergologia - Versão A': 'Prova Alergologia - Versão A - CAMAR 2025',
    'CAMAR2025_Gabarito_Definitivo': 'Gabarito Definitivo - CAMAR 2025',
    'CAMAR 2023 - Anestesiologia': 'Prova Anestesiologia - CAMAR 2023',
    'CAMAR 2023_DEFINITIVO': 'Gabarito Definitivo - CAMAR 2023',
    'CAMAR 2022 - GABARITO': 'Gabarito - CAMAR 2022',
    'CAMAR 2020 - GABARITO': 'Gabarito - CAMAR 2020',
    'CAMAR 2022 - Anestesiologia': 'Prova Anestesiologia - CAMAR 2022',
    'CAMAR 2020 - Anestesiologia': 'Prova Anestesiologia - CAMAR 2020',
    'CAMAR 2019 - Alergologia': 'Prova Alergologia - CAMAR 2019',
    'CAMAR 2019 - GABARITO': 'Gabarito - CAMAR 2019',

    // ═══ CADAR ═══════════════════════════════════════════════════════
    'Provas_CADAR-1-11': 'Prova CADAR 2026',
    'GestaoResultado_Gabarito_CADAR_2026': 'Gabarito - CADAR 2026',

    // ═══ CAFAR ═══════════════════════════════════════════════════════
    '07_Gabarito_Preliminar_CAFAR_2025': 'Gabarito Preliminar - CAFAR 2025',
    'Farmácia Bioquímica - Versão A': 'Prova Farmácia Bioquímica - Versão A - CAFAR 2025',
    'CAFAR2025_Gabarito_Definitivo': 'Gabarito Definitivo - CAFAR 2025',

    // ═══ CFOE ════════════════════════════════════════════════════════
    '08_Gabarito_provisorio_CFOE2025': 'Gabarito Provisório - CFOE 2025',
    'Prova de Arm - versão B': 'Prova de Armamento - Versão B - CFOE 2025',
  }

  return map[key] || null
}

// Fallback auto-standardize for anything not in the manual map
function autoStandardize(title: string, category: string, concurso: string | null, year: number | null): string {
  let t = title

  // Remove file extensions
  t = t.replace(/\.(pdf|jpg|jpeg|png)$/i, '')

  // Replace underscores with spaces
  t = t.replace(/_/g, ' ')

  // Replace hyphens between words (slug-style) with spaces
  t = t.replace(/([A-Za-zÀ-ú])-([A-Za-zÀ-ú])/g, '$1 $2')

  // Remove leading numbers like "01 ", "08 "
  t = t.replace(/^\d{1,2}[\s._-]+/, '')

  // Remove trailing "(1)" or "-1" (duplicate markers), but NOT years
  t = t.replace(/\s*\(\d\)\s*$/, '')
  t = t.replace(/\s*-\s*1\s*$/, '')

  // Remove long hash strings
  t = t.replace(/\s*[a-f0-9]{20,}/gi, '')

  // Clean multiple spaces
  t = t.replace(/\s+/g, ' ').trim()

  // Apply title case
  t = titleCase(t)

  return t
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log(dryRun ? '=== DRY RUN (no changes will be made) ===' : '=== APPLYING CHANGES ===')
  console.log('')

  const { data: items, error } = await supabase
    .from('acervo_items')
    .select('id, title, category, concurso, year')
    .order('category')
    .order('concurso')
    .order('year', { ascending: false })
    .order('title')

  if (error) {
    console.error('Error fetching items:', error.message)
    process.exit(1)
  }

  if (!items || items.length === 0) {
    console.log('No items found.')
    return
  }

  console.log(`Found ${items.length} items\n`)

  const updates: Array<{ id: string; oldTitle: string; newTitle: string }> = []
  const unchanged: string[] = []

  for (const item of items) {
    // Try manual mapping first
    let newTitle = getManualTitle(item.title, item.category, item.concurso, item.year)

    // If no manual mapping, apply auto-standardize
    if (!newTitle) {
      newTitle = autoStandardize(item.title, item.category, item.concurso, item.year)
    }

    if (newTitle !== item.title) {
      updates.push({ id: item.id, oldTitle: item.title, newTitle })
    } else {
      unchanged.push(item.title)
    }
  }

  // Print changes
  if (updates.length > 0) {
    console.log(`📝 ${updates.length} titles to rename:\n`)
    console.log('─'.repeat(100))
    for (const u of updates) {
      console.log(`  ANTES:  ${u.oldTitle}`)
      console.log(`  DEPOIS: ${u.newTitle}`)
      console.log('  ' + '─'.repeat(96))
    }
  }

  if (unchanged.length > 0) {
    console.log(`\n✓ ${unchanged.length} titles already OK:`)
    for (const t of unchanged) {
      console.log(`  · ${t}`)
    }
  }

  if (updates.length === 0) {
    console.log('\nAll titles are already standardized!')
    return
  }

  if (dryRun) {
    console.log(`\n⚠ DRY RUN complete. Run without --dry-run to apply ${updates.length} changes.`)
    return
  }

  // Apply updates
  console.log(`\nApplying ${updates.length} updates...`)
  let success = 0
  let failed = 0

  for (const u of updates) {
    const { error: updateError } = await supabase
      .from('acervo_items')
      .update({ title: u.newTitle })
      .eq('id', u.id)

    if (updateError) {
      console.error(`  ✗ Failed: ${u.oldTitle} → ${updateError.message}`)
      failed++
    } else {
      success++
    }
  }

  console.log(`\n✓ Done! ${success} renamed, ${failed} failed.`)
}

main().catch(console.error)
