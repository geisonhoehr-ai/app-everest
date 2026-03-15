/**
 * ENEM Question Import Script
 *
 * Imports ~2,600 ENEM questions (2009-2023) from extract-enem-data CSV files
 * into the Everest quiz system.
 *
 * Usage:
 *   npx tsx scripts/import-enem.ts
 *
 * What it does:
 *   1. Reads CSV files from temp-question-banks/extract-enem-data/
 *   2. Maps disciplines to existing subjects/topics
 *   3. Creates one quiz per (year × discipline) = ~60 quizzes
 *   4. Inserts questions with source tracking (source_exam, source_year, source_banca)
 *   5. Creates reading_texts for questions with context passages
 *   6. Generates flashcards from each question (front=question, back=correct answer + explanation)
 *   7. Tracks import progress in import_jobs table
 *   8. Skips duplicates via ON CONFLICT
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (or hardcoded below)
 *   - temp-question-banks/extract-enem-data/ folder with CSV data
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

// ============================================================
// Configuration
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hnhzindsfuqnaxosujay.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY environment variable')
  console.error('Find it in: Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DATA_DIR = path.join(__dirname, '..', 'temp-question-banks', 'extract-enem-data', 'enem-data')
const BATCH_SIZE = 50
const SOURCE_BANCA = 'INEP'
const SOURCE_EXAM = 'ENEM'

// Map CSV filename → subject name in our database
const DISCIPLINE_MAP: Record<string, string> = {
  'linguagens': 'Linguagens e Códigos',
  'ciencias-humanas': 'Ciências Humanas',
  'ciencias-natureza': 'Ciências da Natureza',
  'matematica': 'Matemática',
}

// ============================================================
// Types
// ============================================================

interface CSVQuestion {
  '': string        // row index
  number: string     // question number in exam
  context: string    // reading passage
  question: string   // actual question
  A: string
  B: string
  C: string
  D: string
  E: string
  answer: string     // correct answer letter
  'context-images': string
}

interface ImportStats {
  totalProcessed: number
  questionsCreated: number
  flashcardsCreated: number
  quizzesCreated: number
  readingTextsCreated: number
  duplicatesSkipped: number
  errors: string[]
}

// ============================================================
// Main Import Logic
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   ENEM Question Import - Everest         ║')
  console.log('║   2,600+ questions from 2009-2023         ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log()

  // 1. Get admin user ID
  const adminUserId = await getAdminUserId()
  console.log(`✓ Admin user: ${adminUserId}`)

  // 2. Get/create subject and topic mappings
  const subjectMap = await getSubjectMap()
  console.log(`✓ Subjects loaded: ${Object.keys(subjectMap).length}`)

  // 3. Create import job
  const importJobId = await createImportJob(adminUserId)
  console.log(`✓ Import job: ${importJobId}`)

  // 4. Scan year directories
  const yearDirs = fs.readdirSync(DATA_DIR)
    .filter(d => d.startsWith('enem-'))
    .sort()

  console.log(`✓ Found ${yearDirs.length} years: ${yearDirs[0]} to ${yearDirs[yearDirs.length - 1]}`)
  console.log()

  const stats: ImportStats = {
    totalProcessed: 0,
    questionsCreated: 0,
    flashcardsCreated: 0,
    quizzesCreated: 0,
    readingTextsCreated: 0,
    duplicatesSkipped: 0,
    errors: [],
  }

  // 5. Process each year
  for (const yearDir of yearDirs) {
    const year = parseInt(yearDir.replace('enem-', ''))
    const yearPath = path.join(DATA_DIR, yearDir)

    const csvFiles = fs.readdirSync(yearPath).filter(f => f.endsWith('.csv'))

    for (const csvFile of csvFiles) {
      const discipline = csvFile.replace('.csv', '')
      const subjectName = DISCIPLINE_MAP[discipline]

      if (!subjectName) {
        console.log(`  ⚠ Unknown discipline: ${discipline}, skipping`)
        continue
      }

      const subjectId = subjectMap[subjectName]
      if (!subjectId) {
        console.log(`  ⚠ Subject not found: ${subjectName}, skipping`)
        continue
      }

      await processCSV({
        csvPath: path.join(yearPath, csvFile),
        year,
        discipline,
        subjectName,
        subjectId,
        adminUserId,
        stats,
        yearPath,
      })
    }

    // Progress update
    await updateImportJob(importJobId, stats)
    console.log(`  📊 Running total: ${stats.questionsCreated} questions, ${stats.flashcardsCreated} flashcards`)
    console.log()
  }

  // 6. Finalize import job
  await finalizeImportJob(importJobId, stats)

  // 7. Print summary
  console.log()
  console.log('╔══════════════════════════════════════════╗')
  console.log('║              IMPORT COMPLETE              ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`  Questions created:     ${stats.questionsCreated}`)
  console.log(`  Flashcards created:    ${stats.flashcardsCreated}`)
  console.log(`  Quizzes created:       ${stats.quizzesCreated}`)
  console.log(`  Reading texts created: ${stats.readingTextsCreated}`)
  console.log(`  Duplicates skipped:    ${stats.duplicatesSkipped}`)
  console.log(`  Errors:                ${stats.errors.length}`)

  if (stats.errors.length > 0) {
    console.log()
    console.log('  Errors:')
    stats.errors.slice(0, 20).forEach(e => console.log(`    - ${e}`))
    if (stats.errors.length > 20) {
      console.log(`    ... and ${stats.errors.length - 20} more`)
    }
  }
}

// ============================================================
// Process a single CSV file (one discipline for one year)
// ============================================================

async function processCSV(opts: {
  csvPath: string
  year: number
  discipline: string
  subjectName: string
  subjectId: string
  adminUserId: string
  stats: ImportStats
  yearPath: string
}) {
  const { csvPath, year, discipline, subjectName, subjectId, adminUserId, stats, yearPath } = opts

  // Read and parse CSV
  const raw = fs.readFileSync(csvPath, 'utf-8')
  const rows: CSVQuestion[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  })

  if (rows.length === 0) return

  const disciplineLabel = DISCIPLINE_MAP[discipline] || discipline
  console.log(`  📝 ENEM ${year} - ${disciplineLabel}: ${rows.length} questions`)

  // 1. Get or create topic for this discipline
  const topicId = await getOrCreateTopic(subjectId, disciplineLabel, adminUserId)

  // 2. Create quiz for this year + discipline
  const quizTitle = `ENEM ${year} - ${disciplineLabel}`
  const quizId = await getOrCreateQuiz(topicId, quizTitle, year, adminUserId)
  if (quizId) stats.quizzesCreated++

  // 3. Process questions in batches
  const questionBatch: any[] = []
  const flashcardBatch: any[] = []
  const readingTextCache = new Map<string, string>()

  for (const row of rows) {
    stats.totalProcessed++

    const questionNum = parseInt(row.number) || 0
    const context = cleanText(row.context)
    const questionText = cleanText(row.question)
    const correctAnswer = (row.answer || '').trim().toUpperCase()

    if (!questionText || !correctAnswer) {
      stats.errors.push(`ENEM ${year} Q${questionNum}: empty question or answer`)
      continue
    }

    // Clean alternatives
    const options = ['A', 'B', 'C', 'D', 'E']
      .map(letter => cleanText(row[letter as keyof CSVQuestion] as string))
      .filter(Boolean)

    if (options.length < 2) {
      stats.errors.push(`ENEM ${year} Q${questionNum}: less than 2 options`)
      continue
    }

    // Handle reading text (context passage)
    let readingTextId: string | null = null
    if (context && context.length > 50) {
      const contextKey = context.substring(0, 100)
      if (readingTextCache.has(contextKey)) {
        readingTextId = readingTextCache.get(contextKey)!
      } else {
        readingTextId = await createReadingText(quizId, context, year, questionNum)
        if (readingTextId) {
          readingTextCache.set(contextKey, readingTextId)
          stats.readingTextsCreated++
        }
      }
    }

    // Build question record
    questionBatch.push({
      quiz_id: quizId,
      topic_id: topicId,
      question_text: questionText,
      question_format: 'multiple_choice',
      question_type: 'multiple_choice',
      options: JSON.stringify(options),
      correct_answer: correctAnswer,
      explanation: context ? `Contexto: ${context.substring(0, 500)}...` : null,
      difficulty: 'medium',
      points: 1,
      display_order: questionNum,
      question_number: String(questionNum),
      tags: [`ENEM`, `ENEM ${year}`, disciplineLabel],
      reading_text_id: readingTextId,
      source_exam: SOURCE_EXAM,
      source_banca: SOURCE_BANCA,
      source_year: year,
      source_question_number: questionNum,
      created_by_user_id: adminUserId,
    })

    // Build flashcard from question
    const correctIndex = 'ABCDE'.indexOf(correctAnswer)
    const correctText = correctIndex >= 0 && correctIndex < options.length
      ? options[correctIndex]
      : correctAnswer

    flashcardBatch.push({
      topic_id: topicId,
      question: questionText,
      answer: `${correctAnswer}) ${correctText}`,
      explanation: context ? context.substring(0, 500) : null,
      difficulty: 3,
      source_exam: SOURCE_EXAM,
      source_banca: SOURCE_BANCA,
      source_year: year,
      source_type: 'imported_csv',
      created_by_user_id: adminUserId,
    })

    // Insert in batches
    if (questionBatch.length >= BATCH_SIZE) {
      await insertQuestionBatch(questionBatch, stats)
      questionBatch.length = 0
    }

    if (flashcardBatch.length >= BATCH_SIZE) {
      await insertFlashcardBatch(flashcardBatch, stats)
      flashcardBatch.length = 0
    }
  }

  // Insert remaining
  if (questionBatch.length > 0) await insertQuestionBatch(questionBatch, stats)
  if (flashcardBatch.length > 0) await insertFlashcardBatch(flashcardBatch, stats)
}

// ============================================================
// Batch insert helpers
// ============================================================

async function insertQuestionBatch(batch: any[], stats: ImportStats) {
  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .upsert(batch, {
        onConflict: 'source_exam,source_year,source_question_number',
        ignoreDuplicates: true,
      })
      .select('id')

    if (error) {
      // If upsert fails, try individual inserts
      for (const q of batch) {
        const { error: singleError } = await supabase
          .from('quiz_questions')
          .insert(q)

        if (singleError) {
          if (singleError.code === '23505') {
            stats.duplicatesSkipped++
          } else {
            stats.errors.push(`Q insert: ${singleError.message}`)
          }
        } else {
          stats.questionsCreated++
        }
      }
    } else {
      stats.questionsCreated += data?.length || batch.length
    }
  } catch (err: any) {
    stats.errors.push(`Batch insert error: ${err.message}`)
  }
}

async function insertFlashcardBatch(batch: any[], stats: ImportStats) {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .insert(batch)
      .select('id')

    if (error) {
      // Try individual inserts
      for (const fc of batch) {
        const { error: singleError } = await supabase
          .from('flashcards')
          .insert(fc)

        if (singleError) {
          if (singleError.code === '23505') {
            stats.duplicatesSkipped++
          } else {
            stats.errors.push(`FC insert: ${singleError.message}`)
          }
        } else {
          stats.flashcardsCreated++
        }
      }
    } else {
      stats.flashcardsCreated += data?.length || batch.length
    }
  } catch (err: any) {
    stats.errors.push(`FC batch error: ${err.message}`)
  }
}

// ============================================================
// Database helpers
// ============================================================

async function getAdminUserId(): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'administrator')
    .limit(1)
    .single()

  if (error || !data) {
    console.error('No admin user found:', error)
    process.exit(1)
  }
  return data.id
}

async function getSubjectMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name')

  if (error || !data) {
    console.error('Failed to load subjects:', error)
    process.exit(1)
  }

  const map: Record<string, string> = {}
  for (const s of data) {
    map[s.name] = s.id
  }
  return map
}

async function getOrCreateTopic(subjectId: string, name: string, adminUserId: string): Promise<string> {
  // Check if topic exists
  const { data: existing } = await supabase
    .from('topics')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('name', name)
    .limit(1)
    .single()

  if (existing) return existing.id

  // Create topic
  const { data: created, error } = await supabase
    .from('topics')
    .insert({
      name,
      subject_id: subjectId,
      description: `Questões ENEM - ${name}`,
      created_by_user_id: adminUserId,
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error(`Failed to create topic ${name}:`, error)
    process.exit(1)
  }
  return created.id
}

async function getOrCreateQuiz(
  topicId: string,
  title: string,
  year: number,
  adminUserId: string
): Promise<string> {
  // Check if quiz exists
  const { data: existing } = await supabase
    .from('quizzes')
    .select('id')
    .eq('title', title)
    .limit(1)
    .single()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('quizzes')
    .insert({
      title,
      description: `Prova ENEM ${year} - Questões oficiais do INEP`,
      topic_id: topicId,
      type: 'simulation',
      status: 'published',
      duration_minutes: 300,
      show_results_immediately: true,
      shuffle_questions: false,
      shuffle_options: false,
      allow_review: true,
      instructions: `Esta prova contém questões oficiais do ENEM ${year}, aplicadas pelo INEP. Use como simulado para praticar.`,
      created_by_user_id: adminUserId,
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error(`Failed to create quiz ${title}:`, error)
    process.exit(1)
  }
  return created.id
}

async function createReadingText(
  quizId: string,
  content: string,
  year: number,
  questionNum: number
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('quiz_reading_texts')
      .insert({
        quiz_id: quizId,
        title: `Texto de apoio - Questão ${questionNum}`,
        content: content,
        display_order: questionNum,
      })
      .select('id')
      .single()

    if (error) return null
    return data.id
  } catch {
    return null
  }
}

async function createImportJob(adminUserId: string): Promise<string> {
  const { data, error } = await supabase
    .from('import_jobs')
    .insert({
      job_type: 'enem_csv',
      source_name: 'ENEM 2009-2023 (extract-enem-data)',
      status: 'processing',
      started_at: new Date().toISOString(),
      created_by: adminUserId,
      metadata: {
        source_repo: 'github.com/gabriel-antonelli/extract-enem-data',
        years: '2009-2023',
        disciplines: Object.keys(DISCIPLINE_MAP),
      },
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Failed to create import job:', error)
    process.exit(1)
  }
  return data.id
}

async function updateImportJob(jobId: string, stats: ImportStats) {
  await supabase
    .from('import_jobs')
    .update({
      total_items: stats.totalProcessed,
      imported_items: stats.questionsCreated + stats.flashcardsCreated,
      questions_created: stats.questionsCreated,
      flashcards_created: stats.flashcardsCreated,
      duplicate_items: stats.duplicatesSkipped,
      failed_items: stats.errors.length,
    })
    .eq('id', jobId)
}

async function finalizeImportJob(jobId: string, stats: ImportStats) {
  await supabase
    .from('import_jobs')
    .update({
      status: stats.errors.length > stats.totalProcessed / 2 ? 'failed' : 'completed',
      total_items: stats.totalProcessed,
      imported_items: stats.questionsCreated + stats.flashcardsCreated,
      questions_created: stats.questionsCreated,
      flashcards_created: stats.flashcardsCreated,
      duplicate_items: stats.duplicatesSkipped,
      failed_items: stats.errors.length,
      error_log: JSON.stringify(stats.errors.slice(0, 100)),
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

// ============================================================
// Text cleaning utilities
// ============================================================

function cleanText(text: string | undefined | null): string {
  if (!text) return ''
  return text
    .replace(/\n{3,}/g, '\n\n')  // collapse triple+ newlines
    .replace(/^\s+|\s+$/g, '')    // trim
    .replace(/\s{2,}/g, ' ')     // collapse spaces (but keep single newlines)
    .trim()
}

// ============================================================
// Run
// ============================================================

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
