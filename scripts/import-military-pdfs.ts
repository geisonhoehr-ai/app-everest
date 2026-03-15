/**
 * Military Exam PDF Import Script
 *
 * Extracts questions from military exam PDFs (EAOF, EAOP, CAMAR, etc.)
 * using PyMuPDF for text extraction + Claude API for structured parsing.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... npx tsx scripts/import-military-pdfs.ts
 *
 * Pipeline:
 *   1. PyMuPDF extracts text from each PDF
 *   2. Claude API parses text into structured questions (JSON)
 *   3. Questions are imported into quiz_questions + flashcards
 *   4. Progress tracked via import_jobs table
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { execFileSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// Configuration
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hnhzindsfuqnaxosujay.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

if (!ANTHROPIC_API_KEY) {
  console.error('ERROR: Set ANTHROPIC_API_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

const PROVAS_DIR = path.join(__dirname, '..', 'PROVAS ANTERIORES-20260309T144233Z-3-001', 'PROVAS ANTERIORES')

// PDF manifest: each entry maps a PDF to its exam metadata
interface ExamPDF {
  filePath: string
  exam: string        // EAOF, EAOP, CAMAR, CADAR, CAFAR, CFOE
  year: number
  banca: string       // FGR, FADECIT, Consulplan, CKM
  discipline: string  // Gramática, Aeronaves, etc.
  subject: string     // Maps to our subjects table
}

// ============================================================
// PDF Manifest
// ============================================================

function buildManifest(): ExamPDF[] {
  const manifest: ExamPDF[] = []

  const entries: Array<{ file: string; exam: string; year: number; banca: string; discipline: string; subject: string }> = [
    // EAOF - FGR (2022-2026)
    { file: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2022/EAOF SVM - 2022.pdf', exam: 'EAOF', year: 2022, banca: 'FGR', discipline: 'Gramática e Conhecimentos', subject: 'Português' },
    { file: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2023/EAOF 2023.pdf', exam: 'EAOF', year: 2023, banca: 'FGR', discipline: 'Gramática e Conhecimentos', subject: 'Português' },
    { file: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2024/EAOF 2024 A.pdf', exam: 'EAOF', year: 2024, banca: 'FGR', discipline: 'Gramática e Conhecimentos', subject: 'Português' },
    { file: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2025/SVA 2025.pdf', exam: 'EAOF', year: 2025, banca: 'FGR', discipline: 'Gramática e Conhecimentos', subject: 'Português' },
    { file: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2026/EAOF 2026.pdf', exam: 'EAOF', year: 2026, banca: 'FGR', discipline: 'Gramática e Conhecimentos', subject: 'Português' },
    // EAOF - FADECIT (2017-2021)
    { file: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2017/CADERNO ANV_VERSÃO A.pdf', exam: 'EAOF', year: 2017, banca: 'FADECIT', discipline: 'Aeronaves', subject: 'Conhecimentos Militares' },
    { file: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2018/Aeronaves - Versão A.pdf', exam: 'EAOF', year: 2018, banca: 'FADECIT', discipline: 'Aeronaves', subject: 'Conhecimentos Militares' },
    { file: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2019/Serviços Hospitalares  - Versão A(1).pdf', exam: 'EAOF', year: 2019, banca: 'FADECIT', discipline: 'Serviços Hospitalares', subject: 'Conhecimentos Militares' },
    { file: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2020/Aeronaves - Versão A.pdf', exam: 'EAOF', year: 2020, banca: 'FADECIT', discipline: 'Aeronaves', subject: 'Conhecimentos Militares' },
    { file: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2021_/Serviços Administrativos - Versão A.pdf', exam: 'EAOF', year: 2021, banca: 'FADECIT', discipline: 'Serviços Administrativos', subject: 'Conhecimentos Militares' },
    // EAOF - Consulplan (2014-2015)
    { file: 'PROVAS EAOF (ANTIGAS)/BANCA CONSULPLAN (2014 e 2015)/EAOF 2014/01 GRAMÁTICA E INTERPRETAÇÃO DE TEXTO - VERSÃO A.pdf', exam: 'EAOF', year: 2014, banca: 'Consulplan', discipline: 'Gramática', subject: 'Português' },
    { file: 'PROVAS EAOF (ANTIGAS)/BANCA CONSULPLAN (2014 e 2015)/EAOF 2015/EAOF 2015 GRAMÁTICA E INTERPRETAÇÃO DE TEXTO - VERSÃO A.pdf', exam: 'EAOF', year: 2015, banca: 'Consulplan', discipline: 'Gramática', subject: 'Português' },
    // EAOF - CKM (2016)
    { file: 'PROVAS EAOF (ANTIGAS)/BANCA CKM (2016)/EAOF 2016/EAOF 2016 GRAMÁTICA E INTERPRETAÇÃO DE TEXTO - VERSÃO A.pdf', exam: 'EAOF', year: 2016, banca: 'CKM', discipline: 'Gramática', subject: 'Português' },
    // EAOP/EAOEAR
    { file: 'Prova EAOP 2024/EAOEAR 2024 - Versão A (Versão Final).pdf', exam: 'EAOP', year: 2024, banca: 'FGR', discipline: 'Gramática e Administração', subject: 'Português' },
    { file: 'EAOP 2025/Provas_EAOAP.pdf', exam: 'EAOP', year: 2025, banca: 'FGR', discipline: 'Gramática e Administração', subject: 'Português' },
    { file: 'PROVAS EAOP, EAOEAR (ANTIGAS)/EAOAp ADMINISTRAÇÃO 2021.pdf', exam: 'EAOP', year: 2021, banca: 'FGR', discipline: 'Administração', subject: 'Conhecimentos Militares' },
    { file: 'PROVAS EAOP, EAOEAR (ANTIGAS)/eaoap-gramatica-e-interpretacao-de-texto-2017.pdf', exam: 'EAOP', year: 2017, banca: 'FADECIT', discipline: 'Gramática', subject: 'Português' },
    // CAMAR
    { file: 'PROVA CAMAR 2025/Alergologia - Versão A.pdf', exam: 'CAMAR', year: 2025, banca: 'FGR', discipline: 'Medicina', subject: 'Conhecimentos Militares' },
    { file: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2019/CAMAR 2019 - Alergologia.pdf', exam: 'CAMAR', year: 2019, banca: 'FGR', discipline: 'Medicina', subject: 'Conhecimentos Militares' },
    { file: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2020/CAMAR 2020 - Anestesiologia.pdf', exam: 'CAMAR', year: 2020, banca: 'FGR', discipline: 'Medicina', subject: 'Conhecimentos Militares' },
    { file: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2022/CAMAR 2022 - Anestesiologia.pdf', exam: 'CAMAR', year: 2022, banca: 'FGR', discipline: 'Medicina', subject: 'Conhecimentos Militares' },
    { file: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2023/CAMAR 2023 - Anestesiologia.pdf', exam: 'CAMAR', year: 2023, banca: 'FGR', discipline: 'Medicina', subject: 'Conhecimentos Militares' },
    // CADAR
    { file: 'PROVA CADAR 2026/Provas_CADAR-1-11.pdf', exam: 'CADAR', year: 2026, banca: 'FGR', discipline: 'Conhecimentos Gerais', subject: 'Português' },
    // CAFAR
    { file: 'PROVA CAFAR 2025/Farmácia Bioquímica - Versão A.pdf', exam: 'CAFAR', year: 2025, banca: 'FGR', discipline: 'Farmácia', subject: 'Conhecimentos Militares' },
    // CFOE
    { file: 'PROVA CFOE 2025/Prova de Arm - versão B.pdf', exam: 'CFOE', year: 2025, banca: 'FGR', discipline: 'Armamento', subject: 'Conhecimentos Militares' },
  ]

  for (const e of entries) {
    const fullPath = path.join(PROVAS_DIR, e.file)
    if (fs.existsSync(fullPath)) {
      manifest.push({ filePath: fullPath, ...e })
    }
  }

  return manifest
}

// ============================================================
// Extract text from PDF using PyMuPDF (safe, no shell injection)
// ============================================================

const EXTRACT_SCRIPT = path.join(__dirname, 'extract-pdf-text.py')

function ensureExtractScript() {
  if (!fs.existsSync(EXTRACT_SCRIPT)) {
    fs.writeFileSync(EXTRACT_SCRIPT, `
import fitz, sys, json
doc = fitz.open(sys.argv[1])
pages = []
for i in range(doc.page_count):
    pages.append(doc[i].get_text())
print(json.dumps(pages, ensure_ascii=False))
`.trim())
  }
}

function extractPdfText(pdfPath: string): string {
  ensureExtractScript()
  const result = execFileSync('python3', [EXTRACT_SCRIPT, pdfPath], {
    maxBuffer: 50 * 1024 * 1024,
    encoding: 'utf-8',
  })
  const pages: string[] = JSON.parse(result)
  return pages.join('\n\n--- PÁGINA ---\n\n')
}

// ============================================================
// Parse gabarito
// ============================================================

function findGabarito(examFilePath: string): Record<number, string> | null {
  const dir = path.dirname(examFilePath)
  let files: string[]
  try {
    files = fs.readdirSync(dir)
  } catch {
    return null
  }

  const gabFile = files.find(f => /gabarito/i.test(f) && f.endsWith('.pdf'))
  if (!gabFile) return null

  try {
    const text = extractPdfText(path.join(dir, gabFile))
    const answers: Record<number, string> = {}
    const pattern = /(\d{1,3})\s*[-–.):\s]+([A-E])\b/g
    let match
    while ((match = pattern.exec(text)) !== null) {
      const num = parseInt(match[1])
      if (num > 0 && num <= 200) {
        answers[num] = match[2].toUpperCase()
      }
    }
    if (Object.keys(answers).length > 0) {
      console.log(`    ✓ Gabarito: ${Object.keys(answers).length} answers`)
      return answers
    }
  } catch { /* no gabarito */ }

  return null
}

// ============================================================
// Claude API - parse questions
// ============================================================

interface ParsedQuestion {
  number: number
  context: string | null
  question_text: string
  options: string[]
  correct_answer: string | null
  difficulty: string
  subject_area: string
}

async function parseQuestionsWithClaude(
  text: string,
  exam: string,
  year: number,
  gabarito: Record<number, string> | null
): Promise<ParsedQuestion[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `Extraia TODAS as questões de múltipla escolha deste texto de prova "${exam} ${year}".

Para cada questão, retorne um JSON com:
- number: número da questão (int)
- context: texto de apoio/enunciado longo (se houver), null se não houver
- question_text: a pergunta em si (limpa, sem o número)
- options: array com as alternativas (texto limpo, sem a letra)
- correct_answer: letra correta (A-E) se disponível, null se não
- difficulty: "easy", "medium" ou "hard"
- subject_area: área (ex: "Gramática", "Interpretação de Texto", "Matemática", "Conhecimentos Militares", "Legislação")

REGRAS:
- Extraia TODAS as questões, não pule nenhuma
- Limpe espaços extras e quebras de linha
- Se uma questão referencia um texto, inclua-o no campo context
- Mantenha o português correto
- Retorne APENAS um array JSON válido, sem markdown

TEXTO DA PROVA:
${text.substring(0, 60000)}`
    }],
  })

  const content = (response.content[0] as any).text
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const questions: ParsedQuestion[] = JSON.parse(cleaned)

    if (gabarito) {
      for (const q of questions) {
        if (!q.correct_answer && gabarito[q.number]) {
          q.correct_answer = gabarito[q.number]
        }
      }
    }

    return questions
  } catch {
    console.error(`    ⚠ Failed to parse Claude JSON response`)
    return []
  }
}

// ============================================================
// Import into database
// ============================================================

async function importQuestions(
  questions: ParsedQuestion[],
  exam: ExamPDF,
  adminUserId: string,
  stats: { questionsCreated: number; flashcardsCreated: number; errors: string[]; duplicatesSkipped: number }
) {
  const { data: subjectData } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', exam.subject)
    .limit(1)
    .single()

  let subjectId = subjectData?.id
  if (!subjectId) {
    const { data: fallback } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', 'Conhecimentos Militares')
      .limit(1)
      .single()
    subjectId = fallback?.id
  }
  if (!subjectId) { stats.errors.push(`Subject not found: ${exam.subject}`); return }

  const topicName = `${exam.exam} - ${exam.discipline}`
  const { data: existingTopic } = await supabase
    .from('topics').select('id').eq('name', topicName).eq('subject_id', subjectId).limit(1).single()

  let topicId = existingTopic?.id
  if (!topicId) {
    const { data: created } = await supabase
      .from('topics')
      .insert({ name: topicName, subject_id: subjectId, description: `Questões ${exam.exam} - ${exam.discipline} (${exam.banca})`, created_by_user_id: adminUserId })
      .select('id').single()
    topicId = created?.id
  }
  if (!topicId) { stats.errors.push(`Topic creation failed: ${topicName}`); return }

  const quizTitle = `${exam.exam} ${exam.year} - ${exam.discipline}`
  const { data: existingQuiz } = await supabase
    .from('quizzes').select('id').eq('title', quizTitle).limit(1).single()

  let quizId = existingQuiz?.id
  if (!quizId) {
    const { data: created } = await supabase
      .from('quizzes')
      .insert({
        title: quizTitle,
        description: `Prova ${exam.exam} ${exam.year} - Banca ${exam.banca}`,
        topic_id: topicId, type: 'simulation', status: 'published',
        duration_minutes: 240, show_results_immediately: true, allow_review: true,
        instructions: `Simulado oficial ${exam.exam} ${exam.year} (${exam.banca}).`,
        created_by_user_id: adminUserId,
      })
      .select('id').single()
    quizId = created?.id
  }
  if (!quizId) { stats.errors.push(`Quiz creation failed: ${quizTitle}`); return }

  for (const q of questions) {
    if (!q.question_text || q.options.length < 2) continue

    const { error: qErr } = await supabase.from('quiz_questions').insert({
      quiz_id: quizId, topic_id: topicId,
      question_text: q.question_text, question_format: 'multiple_choice', question_type: 'multiple_choice',
      options: JSON.stringify(q.options), correct_answer: q.correct_answer || 'A',
      explanation: q.context?.substring(0, 1000) || null,
      difficulty: q.difficulty || 'medium', points: 1,
      display_order: q.number, question_number: String(q.number),
      tags: [exam.exam, `${exam.exam} ${exam.year}`, exam.banca, q.subject_area],
      source_exam: exam.exam, source_banca: exam.banca, source_year: exam.year,
      source_question_number: q.number, created_by_user_id: adminUserId,
    })

    if (qErr) {
      qErr.code === '23505' ? stats.duplicatesSkipped++ : stats.errors.push(`Q${q.number}: ${qErr.message}`)
    } else {
      stats.questionsCreated++
    }

    const ci = 'ABCDE'.indexOf(q.correct_answer || 'A')
    const ct = ci >= 0 && ci < q.options.length ? q.options[ci] : ''

    const { error: fcErr } = await supabase.from('flashcards').insert({
      topic_id: topicId, question: q.question_text,
      answer: `${q.correct_answer || '?'}) ${ct}`,
      explanation: q.context?.substring(0, 500) || null,
      difficulty: q.difficulty === 'easy' ? 2 : q.difficulty === 'hard' ? 4 : 3,
      source_exam: exam.exam, source_banca: exam.banca, source_year: exam.year,
      source_type: 'extracted_pdf', created_by_user_id: adminUserId,
    })

    if (fcErr) {
      fcErr.code === '23505' ? stats.duplicatesSkipped++ : stats.errors.push(`FC Q${q.number}: ${fcErr.message}`)
    } else {
      stats.flashcardsCreated++
    }
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║  Military Exam PDF Import - Everest       ║')
  console.log('║  EAOF, EAOP, CAMAR, CADAR, CAFAR, CFOE   ║')
  console.log('╚══════════════════════════════════════════╝\n')

  const manifest = buildManifest()
  console.log(`✓ Found ${manifest.length} exam PDFs`)

  const { data: admin } = await supabase.from('users').select('id').eq('role', 'administrator').limit(1).single()
  if (!admin) { console.error('No admin user'); process.exit(1) }
  console.log(`✓ Admin: ${admin.id}`)

  const { data: job } = await supabase.from('import_jobs').insert({
    job_type: 'military_pdf', source_name: `Military Exams (${manifest.length} PDFs)`,
    status: 'processing', started_at: new Date().toISOString(), created_by: admin.id,
    metadata: { exams: [...new Set(manifest.map(m => m.exam))], total_pdfs: manifest.length },
  }).select('id').single()
  console.log(`✓ Import job: ${job?.id}\n`)

  const stats = { questionsCreated: 0, flashcardsCreated: 0, duplicatesSkipped: 0, errors: [] as string[], pdfsProcessed: 0 }

  for (const exam of manifest) {
    console.log(`📄 ${exam.exam} ${exam.year} (${exam.banca}) - ${path.basename(exam.filePath)}`)
    try {
      console.log(`    Extracting text...`)
      const text = extractPdfText(exam.filePath)
      console.log(`    ✓ ${text.length} chars`)

      if (text.length < 500) {
        console.log(`    ⚠ Too short (scanned?). Skipping.`)
        stats.errors.push(`${exam.exam} ${exam.year}: scanned PDF`)
        continue
      }

      const gabarito = findGabarito(exam.filePath)

      console.log(`    Parsing with Claude...`)
      const questions = await parseQuestionsWithClaude(text, exam.exam, exam.year, gabarito)
      console.log(`    ✓ ${questions.length} questions`)

      if (questions.length === 0) { stats.errors.push(`${exam.exam} ${exam.year}: 0 questions`); continue }

      console.log(`    Importing...`)
      await importQuestions(questions, exam, admin.id, stats)
      stats.pdfsProcessed++
      console.log(`    ✓ Total: ${stats.questionsCreated}Q, ${stats.flashcardsCreated}FC`)

      if (job?.id) {
        await supabase.from('import_jobs').update({
          total_items: stats.pdfsProcessed, imported_items: stats.questionsCreated + stats.flashcardsCreated,
          questions_created: stats.questionsCreated, flashcards_created: stats.flashcardsCreated,
          duplicate_items: stats.duplicatesSkipped, failed_items: stats.errors.length,
        }).eq('id', job.id)
      }
    } catch (err: any) {
      console.error(`    ✗ ${err.message}`)
      stats.errors.push(`${exam.exam} ${exam.year}: ${err.message}`)
    }
    console.log()
  }

  if (job?.id) {
    await supabase.from('import_jobs').update({
      status: stats.errors.length > manifest.length / 2 ? 'failed' : 'completed',
      total_items: stats.pdfsProcessed, imported_items: stats.questionsCreated + stats.flashcardsCreated,
      questions_created: stats.questionsCreated, flashcards_created: stats.flashcardsCreated,
      duplicate_items: stats.duplicatesSkipped, failed_items: stats.errors.length,
      error_log: JSON.stringify(stats.errors.slice(0, 100)), completed_at: new Date().toISOString(),
    }).eq('id', job.id)
  }

  console.log('╔══════════════════════════════════════════╗')
  console.log('║            IMPORT COMPLETE                ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`  PDFs processed:     ${stats.pdfsProcessed}/${manifest.length}`)
  console.log(`  Questions created:  ${stats.questionsCreated}`)
  console.log(`  Flashcards created: ${stats.flashcardsCreated}`)
  console.log(`  Duplicates skipped: ${stats.duplicatesSkipped}`)
  console.log(`  Errors:             ${stats.errors.length}`)
  if (stats.errors.length > 0) {
    console.log('\n  Errors:')
    stats.errors.slice(0, 20).forEach(e => console.log(`    - ${e}`))
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
