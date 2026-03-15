/**
 * Upload PDFs to Acervo Digital (Supabase Storage + acervo_items table)
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/upload-acervo.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hnhzindsfuqnaxosujay.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
if (!SUPABASE_SERVICE_KEY) { console.error('Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const BASE = path.join(__dirname, '..')
const PROVAS_DIR = path.join(BASE, 'PROVAS ANTERIORES-20260309T144233Z-3-001', 'PROVAS ANTERIORES')
const LIVROS_DIR = path.join(BASE, 'LIVROS PARA CONSULTA-20260309T144250Z-3-001', 'LIVROS PARA CONSULTA')

interface AcervoEntry {
  localPath: string; storagePath: string; title: string
  category: 'prova' | 'livro'; concurso: string | null
  subcategory: string | null; year: number | null; banca: string | null
}

function sanitize(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').toLowerCase()
}

function walkDir(dir: string): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...walkDir(full))
    else if (entry.name.endsWith('.pdf')) results.push(full)
  }
  return results
}

function buildManifest(): AcervoEntry[] {
  const entries: AcervoEntry[] = []

  // PROVAS
  if (fs.existsSync(PROVAS_DIR)) {
    for (const fp of walkDir(PROVAS_DIR)) {
      const rel = path.relative(PROVAS_DIR, fp)
      const fileName = path.basename(fp, '.pdf')
      const yearMatch = rel.match(/(\d{4})/)
      const year = yearMatch ? parseInt(yearMatch[1]) : null

      let concurso = 'Outros'
      if (/EAOF/i.test(rel)) concurso = 'EAOF'
      else if (/EAOP|EAOEAR|EAOAp/i.test(rel)) concurso = 'EAOP'
      else if (/CAMAR/i.test(rel)) concurso = 'CAMAR'
      else if (/CADAR/i.test(rel)) concurso = 'CADAR'
      else if (/CAFAR/i.test(rel)) concurso = 'CAFAR'
      else if (/CFOE/i.test(rel)) concurso = 'CFOE'

      let banca: string | null = null
      if (/FGR/i.test(rel)) banca = 'FGR'
      else if (/FADECIT/i.test(rel)) banca = 'FADECIT'
      else if (/Consulplan/i.test(rel)) banca = 'Consulplan'
      else if (/CKM/i.test(rel)) banca = 'CKM'

      let subcategory: string | null = 'Prova Objetiva'
      if (/gabarito/i.test(fileName)) subcategory = 'Gabarito'
      else if (/reda[cç][aã]o|tema/i.test(fileName)) subcategory = 'Redação'
      else if (/recurso/i.test(fileName)) subcategory = 'Recurso'

      entries.push({
        localPath: fp,
        storagePath: `provas/${concurso}/${year || 'geral'}/${sanitize(path.basename(fp))}`,
        title: `${concurso} ${year || ''} - ${fileName}`.trim(),
        category: 'prova', concurso, subcategory, year, banca,
      })
    }
  }

  // LIVROS
  if (fs.existsSync(LIVROS_DIR)) {
    for (const fp of walkDir(LIVROS_DIR)) {
      const fileName = path.basename(fp, '.pdf')
      entries.push({
        localPath: fp,
        storagePath: `livros/${sanitize(path.basename(fp))}`,
        title: fileName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').replace(/\(\d+\)/, '').trim(),
        category: 'livro', concurso: null, subcategory: 'Gramática e Português', year: null, banca: null,
      })
    }
  }

  return entries
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║  Acervo Digital Upload - Everest              ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  const manifest = buildManifest()
  const provas = manifest.filter(e => e.category === 'prova')
  const livros = manifest.filter(e => e.category === 'livro')
  console.log(`✓ ${provas.length} provas, ${livros.length} livros\n`)

  const stats = { uploaded: 0, skipped: 0, errors: [] as string[] }

  for (const entry of manifest) {
    const sizeMB = (fs.statSync(entry.localPath).size / (1024 * 1024)).toFixed(1)
    const icon = entry.category === 'prova' ? '📄' : '📖'
    process.stdout.write(`  ${icon} ${entry.title.substring(0, 55).padEnd(55)} (${sizeMB} MB) `)

    try {
      // Check duplicate
      const { data: existing } = await supabase.from('acervo_items')
        .select('id').eq('file_path', entry.storagePath).limit(1).single()
      if (existing) { console.log('(exists)'); stats.skipped++; continue }

      // Upload file
      const buf = fs.readFileSync(entry.localPath)
      const { error: upErr } = await supabase.storage.from('acervo-digital')
        .upload(entry.storagePath, buf, { contentType: 'application/pdf', upsert: true })
      if (upErr) { console.log('✗ upload'); stats.errors.push(`${entry.title}: ${upErr.message}`); continue }

      // Create record
      const { error: dbErr } = await supabase.from('acervo_items').insert({
        title: entry.title, category: entry.category, concurso: entry.concurso,
        subcategory: entry.subcategory, year: entry.year, banca: entry.banca,
        file_path: entry.storagePath, file_size: buf.length, file_type: 'application/pdf',
      })
      if (dbErr) { console.log('✗ db'); stats.errors.push(`${entry.title}: ${dbErr.message}`); continue }

      console.log('✓')
      stats.uploaded++
    } catch (err: any) {
      console.log('✗')
      stats.errors.push(`${entry.title}: ${err.message}`)
    }
  }

  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║              UPLOAD COMPLETE                  ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`  Uploaded:  ${stats.uploaded}`)
  console.log(`  Skipped:   ${stats.skipped}`)
  console.log(`  Errors:    ${stats.errors.length}`)
  if (stats.errors.length > 0) {
    console.log('\n  Errors:')
    stats.errors.slice(0, 15).forEach(e => console.log(`    - ${e}`))
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
