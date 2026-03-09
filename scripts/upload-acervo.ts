import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = 'https://hnhzindsfuqnaxosujay.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY env variable (service role key from Supabase dashboard)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const BUCKET = 'acervo-digital'

function sanitizePath(name: string): string {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

interface AcervoItem {
  title: string
  category: 'livro' | 'prova'
  concurso: string | null
  subcategory: string | null
  year: number | null
  file_path: string
  file_size: number
  file_type: string
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB Supabase free tier limit
const skippedFiles: string[] = []

async function uploadFile(localPath: string, storagePath: string): Promise<number> {
  const fileBuffer = fs.readFileSync(localPath)

  if (fileBuffer.length > MAX_FILE_SIZE) {
    const sizeMb = (fileBuffer.length / (1024 * 1024)).toFixed(1)
    console.warn(`  ⚠ SKIPPED (${sizeMb}MB > 50MB limit): ${path.basename(localPath)}`)
    skippedFiles.push(`${path.basename(localPath)} (${sizeMb}MB)`)
    return -1
  }

  const ext = path.extname(localPath).toLowerCase()
  const contentType = ext === '.pdf' ? 'application/pdf'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.png' ? 'image/png'
    : 'application/octet-stream'

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType, upsert: true })

  if (error) {
    console.error(`  ✗ Upload failed: ${storagePath} - ${error.message}`)
    return -1
  }
  return fileBuffer.length
}

function getFilesInDir(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return []
  return fs.readdirSync(dirPath).filter(f => {
    const full = path.join(dirPath, f)
    return fs.statSync(full).isFile() && /\.(pdf|jpg|jpeg|png)$/i.test(f)
  })
}

async function uploadLivros(baseDir: string): Promise<AcervoItem[]> {
  const items: AcervoItem[] = []
  const livrosDir = path.join(baseDir, 'LIVROS PARA CONSULTA-20260309T144250Z-3-001', 'LIVROS PARA CONSULTA')
  const files = getFilesInDir(livrosDir)

  for (const file of files) {
    const localPath = path.join(livrosDir, file)
    const storagePath = `livros/${sanitizePath(file)}`
    const title = file.replace(/\.(pdf|jpg|png)$/i, '').replace(/-1$/, '').trim()

    console.log(`  Livro: ${title}`)
    const size = await uploadFile(localPath, storagePath)

    if (size > 0) {
      items.push({
        title,
        category: 'livro',
        concurso: null,
        subcategory: null,
        year: null,
        file_path: storagePath,
        file_size: size,
        file_type: 'pdf'
      })
    }
  }
  return items
}

async function uploadProvas(baseDir: string): Promise<AcervoItem[]> {
  const items: AcervoItem[] = []
  const provasDir = path.join(baseDir, 'PROVAS ANTERIORES-20260309T144233Z-3-001', 'PROVAS ANTERIORES')

  const mappings: Array<{ dir: string; concurso: string; subcategory: string | null; year: number }> = [
    // EAOF - Banca Consulplan
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA CONSULPLAN (2014 e 2015)/EAOF 2014', concurso: 'EAOF', subcategory: 'Banca Consulplan (2014-2015)', year: 2014 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA CONSULPLAN (2014 e 2015)/EAOF 2015', concurso: 'EAOF', subcategory: 'Banca Consulplan (2014-2015)', year: 2015 },
    // EAOF - Banca CKM
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA CKM (2016)/EAOF 2016', concurso: 'EAOF', subcategory: 'Banca CKM (2016)', year: 2016 },
    // EAOF - Banca Fadecit
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2017', concurso: 'EAOF', subcategory: 'Banca Fadecit (2017-2021)', year: 2017 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2018', concurso: 'EAOF', subcategory: 'Banca Fadecit (2017-2021)', year: 2018 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2019', concurso: 'EAOF', subcategory: 'Banca Fadecit (2017-2021)', year: 2019 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2020', concurso: 'EAOF', subcategory: 'Banca Fadecit (2017-2021)', year: 2020 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2021_', concurso: 'EAOF', subcategory: 'Banca Fadecit (2017-2021)', year: 2021 },
    // EAOF - Banca FGR (Atual)
    { dir: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2022', concurso: 'EAOF', subcategory: 'Banca FGR - Atual (2022+)', year: 2022 },
    { dir: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2023', concurso: 'EAOF', subcategory: 'Banca FGR - Atual (2022+)', year: 2023 },
    { dir: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2024', concurso: 'EAOF', subcategory: 'Banca FGR - Atual (2022+)', year: 2024 },
    { dir: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2025', concurso: 'EAOF', subcategory: 'Banca FGR - Atual (2022+)', year: 2025 },
    { dir: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2026', concurso: 'EAOF', subcategory: 'Banca FGR - Atual (2022+)', year: 2026 },
    // EAOP
    { dir: 'PROVAS EAOP, EAOEAR (ANTIGAS)', concurso: 'EAOP', subcategory: 'EAOP/EAOEAR Antigas', year: 2021 },
    { dir: 'Prova EAOP 2024', concurso: 'EAOP', subcategory: null, year: 2024 },
    { dir: 'EAOP 2025', concurso: 'EAOP', subcategory: null, year: 2025 },
    // CAMAR
    { dir: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2019', concurso: 'CAMAR', subcategory: 'Provas Antigas', year: 2019 },
    { dir: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2020', concurso: 'CAMAR', subcategory: 'Provas Antigas', year: 2020 },
    { dir: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2022', concurso: 'CAMAR', subcategory: 'Provas Antigas', year: 2022 },
    { dir: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2023', concurso: 'CAMAR', subcategory: 'Provas Antigas', year: 2023 },
    { dir: 'PROVA CAMAR 2025', concurso: 'CAMAR', subcategory: null, year: 2025 },
    // CADAR
    { dir: 'PROVA CADAR 2026', concurso: 'CADAR', subcategory: null, year: 2026 },
    // CAFAR
    { dir: 'PROVA CAFAR 2025', concurso: 'CAFAR', subcategory: null, year: 2025 },
    // CFOE
    { dir: 'PROVA CFOE 2025', concurso: 'CFOE', subcategory: null, year: 2025 },
  ]

  for (const mapping of mappings) {
    const dirPath = path.join(provasDir, mapping.dir)
    const files = getFilesInDir(dirPath)

    if (files.length === 0) {
      console.warn(`  Skipping (empty/not found): ${mapping.dir}`)
      continue
    }

    for (const file of files) {
      const localPath = path.join(dirPath, file)
      const storagePath = `provas/${sanitizePath(mapping.concurso)}/${mapping.year}/${sanitizePath(file)}`
      const title = file.replace(/\.(pdf|jpg|jpeg|png)$/i, '').trim()
      const ext = path.extname(file).slice(1).toLowerCase()

      console.log(`  Prova: ${mapping.concurso} ${mapping.year} - ${title}`)
      const size = await uploadFile(localPath, storagePath)

      if (size > 0) {
        items.push({
          title,
          category: 'prova',
          concurso: mapping.concurso,
          subcategory: mapping.subcategory,
          year: mapping.year,
          file_path: storagePath,
          file_size: size,
          file_type: ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? ext : 'pdf'
        })
      }
    }
  }

  // Handle nested TEMA DA REDACAO subfolder
  const temaDir = path.join(provasDir, 'Prova EAOP 2024', 'TEMA DA REDAÇÃO')
  const temaFiles = getFilesInDir(temaDir)
  for (const file of temaFiles) {
    const localPath = path.join(temaDir, file)
    const storagePath = `provas/eaop/2024/${sanitizePath(file)}`
    const title = file.replace(/\.(pdf|jpg|jpeg|png)$/i, '').trim()

    console.log(`  Prova: EAOP 2024 - ${title}`)
    const size = await uploadFile(localPath, storagePath)

    if (size > 0) {
      items.push({
        title,
        category: 'prova',
        concurso: 'EAOP',
        subcategory: null,
        year: 2024,
        file_path: storagePath,
        file_size: size,
        file_type: 'pdf'
      })
    }
  }

  // Handle CAMAR/CADAR/CAFAR 2018 and 2021 subfolders
  for (const yr of ['2018', '2021']) {
    const yrDir = path.join(provasDir, 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)', yr)
    const yrFiles = getFilesInDir(yrDir)
    for (const file of yrFiles) {
      const localPath = path.join(yrDir, file)
      const storagePath = `provas/camar/${yr}/${sanitizePath(file)}`
      const title = file.replace(/\.(pdf|jpg|jpeg|png)$/i, '').trim()

      console.log(`  Prova: CAMAR ${yr} - ${title}`)
      const size = await uploadFile(localPath, storagePath)

      if (size > 0) {
        items.push({
          title,
          category: 'prova',
          concurso: 'CAMAR',
          subcategory: 'Provas Antigas',
          year: parseInt(yr),
          file_path: storagePath,
          file_size: size,
          file_type: 'pdf'
        })
      }
    }
  }

  return items
}

async function main() {
  // baseDir points to the root where the folders were dropped (parent of app-everest-main)
  const baseDir = path.resolve(__dirname, '..', '..')

  console.log('=== Uploading Livros ===')
  const livros = await uploadLivros(baseDir)
  console.log(`Uploaded ${livros.length} livros\n`)

  console.log('=== Uploading Provas ===')
  const provas = await uploadProvas(baseDir)
  console.log(`Uploaded ${provas.length} provas\n`)

  console.log('=== Inserting metadata into acervo_items ===')
  const allItems = [...livros, ...provas]

  // Clear existing items
  const { error: deleteError } = await supabase
    .from('acervo_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (deleteError) {
    console.error('Error clearing table:', deleteError.message)
  }

  // Insert in batches of 20
  for (let i = 0; i < allItems.length; i += 20) {
    const batch = allItems.slice(i, i + 20)
    const { error } = await supabase.from('acervo_items').insert(batch)
    if (error) {
      console.error(`Batch insert error at ${i}:`, error.message)
    } else {
      console.log(`Inserted batch ${Math.floor(i / 20) + 1} (${batch.length} items)`)
    }
  }

  console.log(`\nDone! Total: ${allItems.length} items uploaded and cataloged`)
}

main().catch(console.error)
