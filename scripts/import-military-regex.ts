/**
 * Military Exam PDF Import - Regex Parser (no AI API needed)
 *
 * Extracts questions from military exam PDFs using PyMuPDF + regex parsing.
 * Uses execFileSync (safe, no shell injection) for Python subprocess.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-military-regex.ts
 */

import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hnhzindsfuqnaxosujay.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const PROVAS_DIR = path.join(__dirname, '..', 'PROVAS ANTERIORES-20260309T144233Z-3-001', 'PROVAS ANTERIORES')
const EXTRACT_SCRIPT = path.join(__dirname, 'extract-pdf-text.py')

interface ExamPDF {
  file: string; exam: string; year: number; banca: string; discipline: string; subject: string
}

interface ParsedQ {
  number: number; text: string; options: string[]; correct: string | null
}

const MANIFEST: ExamPDF[] = [
  { file: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2022/EAOF SVM - 2022.pdf', exam: 'EAOF', year: 2022, banca: 'FGR', discipline: 'Gramática e Conhecimentos', subject: 'Português' },
  { file: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2023/EAOF 2023.pdf', exam: 'EAOF', year: 2023, banca: 'FGR', discipline: 'Gramática e Conhecimentos', subject: 'Português' },
  { file: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2024/EAOF 2024 A.pdf', exam: 'EAOF', year: 2024, banca: 'FGR', discipline: 'Gramática e Conhecimentos', subject: 'Português' },
  { file: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2025/SVA 2025.pdf', exam: 'EAOF', year: 2025, banca: 'FGR', discipline: 'Gramática e Conhecimentos', subject: 'Português' },
  { file: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2026/EAOF 2026.pdf', exam: 'EAOF', year: 2026, banca: 'FGR', discipline: 'Gramática e Conhecimentos', subject: 'Português' },
  { file: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2017/CADERNO ANV_VERSÃO A.pdf', exam: 'EAOF', year: 2017, banca: 'FADECIT', discipline: 'Aeronaves', subject: 'Conhecimentos Militares' },
  { file: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2018/Aeronaves - Versão A.pdf', exam: 'EAOF', year: 2018, banca: 'FADECIT', discipline: 'Aeronaves', subject: 'Conhecimentos Militares' },
  { file: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2019/Serviços Hospitalares  - Versão A(1).pdf', exam: 'EAOF', year: 2019, banca: 'FADECIT', discipline: 'Serviços Hospitalares', subject: 'Conhecimentos Militares' },
  { file: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2020/Aeronaves - Versão A.pdf', exam: 'EAOF', year: 2020, banca: 'FADECIT', discipline: 'Aeronaves', subject: 'Conhecimentos Militares' },
  { file: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2021_/Serviços Administrativos - Versão A.pdf', exam: 'EAOF', year: 2021, banca: 'FADECIT', discipline: 'Serviços Administrativos', subject: 'Conhecimentos Militares' },
  { file: 'PROVAS EAOF (ANTIGAS)/BANCA CONSULPLAN (2014 e 2015)/EAOF 2014/01 GRAMÁTICA E INTERPRETAÇÃO DE TEXTO - VERSÃO A.pdf', exam: 'EAOF', year: 2014, banca: 'Consulplan', discipline: 'Gramática', subject: 'Português' },
  { file: 'PROVAS EAOF (ANTIGAS)/BANCA CONSULPLAN (2014 e 2015)/EAOF 2015/EAOF 2015 GRAMÁTICA E INTERPRETAÇÃO DE TEXTO - VERSÃO A.pdf', exam: 'EAOF', year: 2015, banca: 'Consulplan', discipline: 'Gramática', subject: 'Português' },
  { file: 'PROVAS EAOF (ANTIGAS)/BANCA CKM (2016)/EAOF 2016/EAOF 2016 GRAMÁTICA E INTERPRETAÇÃO DE TEXTO - VERSÃO A.pdf', exam: 'EAOF', year: 2016, banca: 'CKM', discipline: 'Gramática', subject: 'Português' },
  { file: 'Prova EAOP 2024/EAOEAR 2024 - Versão A (Versão Final).pdf', exam: 'EAOP', year: 2024, banca: 'FGR', discipline: 'Gramática e Administração', subject: 'Português' },
  { file: 'EAOP 2025/Provas_EAOAP.pdf', exam: 'EAOP', year: 2025, banca: 'FGR', discipline: 'Gramática e Administração', subject: 'Português' },
  { file: 'PROVAS EAOP, EAOEAR (ANTIGAS)/EAOAp ADMINISTRAÇÃO 2021.pdf', exam: 'EAOP', year: 2021, banca: 'FGR', discipline: 'Administração', subject: 'Conhecimentos Militares' },
  { file: 'PROVAS EAOP, EAOEAR (ANTIGAS)/eaoap-gramatica-e-interpretacao-de-texto-2017.pdf', exam: 'EAOP', year: 2017, banca: 'FADECIT', discipline: 'Gramática', subject: 'Português' },
  { file: 'PROVA CAMAR 2025/Alergologia - Versão A.pdf', exam: 'CAMAR', year: 2025, banca: 'FGR', discipline: 'Medicina', subject: 'Conhecimentos Militares' },
  { file: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2019/CAMAR 2019 - Alergologia.pdf', exam: 'CAMAR', year: 2019, banca: 'FGR', discipline: 'Medicina', subject: 'Conhecimentos Militares' },
  { file: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2020/CAMAR 2020 - Anestesiologia.pdf', exam: 'CAMAR', year: 2020, banca: 'FGR', discipline: 'Medicina', subject: 'Conhecimentos Militares' },
  { file: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2022/CAMAR 2022 - Anestesiologia.pdf', exam: 'CAMAR', year: 2022, banca: 'FGR', discipline: 'Medicina', subject: 'Conhecimentos Militares' },
  { file: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2023/CAMAR 2023 - Anestesiologia.pdf', exam: 'CAMAR', year: 2023, banca: 'FGR', discipline: 'Medicina', subject: 'Conhecimentos Militares' },
  { file: 'PROVA CADAR 2026/Provas_CADAR-1-11.pdf', exam: 'CADAR', year: 2026, banca: 'FGR', discipline: 'Conhecimentos Gerais', subject: 'Português' },
  { file: 'PROVA CAFAR 2025/Farmácia Bioquímica - Versão A.pdf', exam: 'CAFAR', year: 2025, banca: 'FGR', discipline: 'Farmácia', subject: 'Conhecimentos Militares' },
  { file: 'PROVA CFOE 2025/Prova de Arm - versão B.pdf', exam: 'CFOE', year: 2025, banca: 'FGR', discipline: 'Armamento', subject: 'Conhecimentos Militares' },
]

// NOTE: This script uses execFileSync (not exec) which is safe against shell injection.
// The Python script path and PDF paths are constructed from constants, not user input.

function extractPdfText(pdfPath: string): string {
  const result = execFileSync('python3', [EXTRACT_SCRIPT, pdfPath], {
    maxBuffer: 50 * 1024 * 1024, encoding: 'utf-8',
  })
  return JSON.parse(result).join('\n\n')
}

function findGabarito(examFilePath: string): Record<number, string> {
  const dir = path.dirname(examFilePath)
  let files: string[]
  try { files = fs.readdirSync(dir) } catch { return {} }
  const gabFile = files.find(f => /gabarito/i.test(f) && f.endsWith('.pdf'))
  if (!gabFile) return {}
  try {
    const text = extractPdfText(path.join(dir, gabFile))
    const answers: Record<number, string> = {}
    const patterns = [/(\d{1,3})\s*[-–.):\s]+\s*([A-E])\b/g, /(\d{1,3})\s+([A-E])\s/g]
    for (const p of patterns) {
      let m; while ((m = p.exec(text)) !== null) {
        const num = parseInt(m[1])
        if (num > 0 && num <= 200) answers[num] = m[2].toUpperCase()
      }
    }
    return answers
  } catch { return {} }
}

function parseQuestions(text: string, gabarito: Record<number, string>): ParsedQ[] {
  const questions: ParsedQ[] = []
  const qPattern = /(?:^|\n)\s*(\d{1,3})\)\s/g
  const qStarts: Array<{ num: number; pos: number }> = []
  let m; while ((m = qPattern.exec(text)) !== null) qStarts.push({ num: parseInt(m[1]), pos: m.index })

  for (let i = 0; i < qStarts.length; i++) {
    const start = qStarts[i].pos
    const end = i + 1 < qStarts.length ? qStarts[i + 1].pos : Math.min(start + 5000, text.length)
    const block = text.substring(start, end).trim()
    const qNum = qStarts[i].num
    const body = block.substring(block.indexOf(')') + 1).trim()

    const altPattern = /\n\s*([a-eA-E])\)\s/g
    const alts: Array<{ letter: string; pos: number }> = []
    let am; while ((am = altPattern.exec(body)) !== null) alts.push({ letter: am[1].toUpperCase(), pos: am.index })

    if (alts.length < 2) continue

    const qText = body.substring(0, alts[0].pos).trim().replace(/\s+/g, ' ')
    if (qText.length < 10) continue

    const options: string[] = []
    for (let j = 0; j < alts.length; j++) {
      const aEnd = j + 1 < alts.length ? alts[j + 1].pos : body.length
      let t = body.substring(alts[j].pos, aEnd).trim()
      t = t.replace(/^\(?[a-eA-E]\)?\)\s*/, '').replace(/\s+/g, ' ').trim()
      t = t.replace(/\s*[-–]\s*\d+\s*[-–]\s*$/, '').trim()
      if (t) options.push(t)
    }
    if (options.length < 2) continue

    questions.push({ number: qNum, text: qText, options, correct: gabarito[qNum] || null })
  }
  return questions
}

async function importToDB(questions: ParsedQ[], exam: ExamPDF, adminId: string, stats: { qC: number; fcC: number; dupes: number; errs: string[] }) {
  const { data: subj } = await supabase.from('subjects').select('id').eq('name', exam.subject).limit(1).single()
  let sId = subj?.id
  if (!sId) { const { data: fb } = await supabase.from('subjects').select('id').eq('name', 'Conhecimentos Militares').limit(1).single(); sId = fb?.id }
  if (!sId) { stats.errs.push(`No subject: ${exam.subject}`); return }

  const tName = `${exam.exam} - ${exam.discipline}`
  let { data: topic } = await supabase.from('topics').select('id').eq('name', tName).eq('subject_id', sId).limit(1).single()
  if (!topic) { const { data: t } = await supabase.from('topics').insert({ name: tName, subject_id: sId, description: `${exam.exam} ${exam.discipline} (${exam.banca})`, created_by_user_id: adminId }).select('id').single(); topic = t }
  if (!topic) { stats.errs.push(`No topic: ${tName}`); return }

  const qTitle = `${exam.exam} ${exam.year} - ${exam.discipline}`
  let { data: quiz } = await supabase.from('quizzes').select('id').eq('title', qTitle).limit(1).single()
  if (!quiz) { const { data: q } = await supabase.from('quizzes').insert({ title: qTitle, description: `Prova ${exam.exam} ${exam.year} - Banca ${exam.banca}`, topic_id: topic.id, type: 'simulation', status: 'published', duration_minutes: 240, show_results_immediately: true, allow_review: true, instructions: `Simulado oficial ${exam.exam} ${exam.year} (${exam.banca}).`, created_by_user_id: adminId }).select('id').single(); quiz = q }
  if (!quiz) { stats.errs.push(`No quiz: ${qTitle}`); return }

  for (const q of questions) {
    const { error: qE } = await supabase.from('quiz_questions').insert({ quiz_id: quiz.id, topic_id: topic.id, question_text: q.text, question_format: 'multiple_choice', question_type: 'multiple_choice', options: JSON.stringify(q.options), correct_answer: q.correct || 'A', difficulty: 'medium', points: 1, display_order: q.number, question_number: String(q.number), tags: [exam.exam, `${exam.exam} ${exam.year}`, exam.banca], source_exam: exam.exam, source_banca: exam.banca, source_year: exam.year, source_question_number: q.number, created_by_user_id: adminId })
    if (qE) { qE.code === '23505' ? stats.dupes++ : stats.errs.push(`Q${q.number}: ${qE.message}`) } else { stats.qC++ }

    const ci = q.correct ? 'ABCDE'.indexOf(q.correct) : -1
    const ct = ci >= 0 && ci < q.options.length ? q.options[ci] : ''
    const { error: fE } = await supabase.from('flashcards').insert({ topic_id: topic.id, question: q.text, answer: `${q.correct || '?'}) ${ct}`, difficulty: 3, source_exam: exam.exam, source_banca: exam.banca, source_year: exam.year, source_type: 'extracted_pdf', created_by_user_id: adminId })
    if (fE) { fE.code === '23505' ? stats.dupes++ : stats.errs.push(`FC: ${fE.message}`) } else { stats.fcC++ }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║  Military PDF Import (Regex) - Everest        ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  const avail = MANIFEST.filter(e => fs.existsSync(path.join(PROVAS_DIR, e.file)))
  console.log(`✓ ${avail.length} PDFs found\n`)

  const { data: admin } = await supabase.from('users').select('id').eq('role', 'administrator').limit(1).single()
  if (!admin) { console.error('No admin'); process.exit(1) }

  const { data: job } = await supabase.from('import_jobs').insert({ job_type: 'military_pdf', source_name: `Military Regex (${avail.length} PDFs)`, status: 'processing', started_at: new Date().toISOString(), created_by: admin.id }).select('id').single()

  const stats = { qC: 0, fcC: 0, dupes: 0, errs: [] as string[], pdfs: 0 }

  for (const exam of avail) {
    const fp = path.join(PROVAS_DIR, exam.file)
    console.log(`📄 ${exam.exam} ${exam.year} (${exam.banca}) - ${path.basename(fp)}`)
    try {
      const text = extractPdfText(fp)
      if (text.length < 500) { console.log(`   ⚠ Too short, skipping`); stats.errs.push(`${exam.exam} ${exam.year}: too short`); continue }

      const gab = findGabarito(fp)
      const questions = parseQuestions(text, gab)
      console.log(`   ✓ ${questions.length} questions, ${Object.keys(gab).length} gabarito answers`)

      if (questions.length === 0) { stats.errs.push(`${exam.exam} ${exam.year}: 0 questions`); continue }

      await importToDB(questions, exam, admin.id, stats)
      stats.pdfs++
      console.log(`   ✓ Running: ${stats.qC}Q, ${stats.fcC}FC`)

      if (job?.id) await supabase.from('import_jobs').update({ total_items: stats.pdfs, imported_items: stats.qC + stats.fcC, questions_created: stats.qC, flashcards_created: stats.fcC, duplicate_items: stats.dupes, failed_items: stats.errs.length }).eq('id', job.id)
    } catch (err: any) { console.log(`   ✗ ${err.message}`); stats.errs.push(`${exam.exam} ${exam.year}: ${err.message}`) }
    console.log()
  }

  if (job?.id) await supabase.from('import_jobs').update({ status: 'completed', completed_at: new Date().toISOString(), total_items: stats.pdfs, imported_items: stats.qC + stats.fcC, questions_created: stats.qC, flashcards_created: stats.fcC, duplicate_items: stats.dupes, failed_items: stats.errs.length, error_log: JSON.stringify(stats.errs.slice(0, 50)) }).eq('id', job.id)

  console.log('╔══════════════════════════════════════════════╗')
  console.log('║              IMPORT COMPLETE                  ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`  PDFs:       ${stats.pdfs}/${avail.length}`)
  console.log(`  Questions:  ${stats.qC}`)
  console.log(`  Flashcards: ${stats.fcC}`)
  console.log(`  Duplicates: ${stats.dupes}`)
  console.log(`  Errors:     ${stats.errs.length}`)
  if (stats.errs.length > 0) { console.log('\n  Errors:'); stats.errs.slice(0, 15).forEach(e => console.log(`    - ${e}`)) }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
