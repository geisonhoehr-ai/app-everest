# Acervo Digital — Biblioteca do Aluno

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Acervo Digital page as a file repository where students browse and read study materials (books + past exams) with inline PDF viewer, backed by Supabase Storage.

**Architecture:** Upload 76 PDFs to Supabase Storage bucket `acervo-digital`. Create `acervo_items` table for metadata. Page has two sections: books grid (MagicCards) and exams accordion (by concurso > banca/period > year). Clicking any file opens a fullscreen Dialog with iframe PDF viewer.

**Tech Stack:** React 19, Supabase Storage + Postgres, Shadcn Dialog + Accordion, MagicLayout/MagicCard, Lucide icons

---

## Task 1: Create Supabase Storage Bucket + Database Table

**Files:**
- SQL script (run in Supabase dashboard)

**Step 1: Create the storage bucket**

Run in Supabase SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'acervo-digital',
  'acervo-digital',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
);

-- Public read policy
CREATE POLICY "Public read acervo" ON storage.objects
  FOR SELECT USING (bucket_id = 'acervo-digital');

-- Admin upload policy
CREATE POLICY "Admin upload acervo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'acervo-digital'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator'
  );
```

**Step 2: Create the metadata table**

```sql
CREATE TABLE public.acervo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('livro', 'prova')),
  concurso text, -- EAOF, EAOP, CAMAR, CADAR, CAFAR, CFOE (only for provas)
  subcategory text, -- "Banca Consulplan (2014-2015)", etc (grouping for provas)
  year int, -- exam year (only for provas)
  file_path text NOT NULL, -- path in storage bucket
  file_size bigint DEFAULT 0,
  file_type text DEFAULT 'pdf',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.acervo_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Public read acervo_items" ON public.acervo_items
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admin manage acervo_items" ON public.acervo_items
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator'
  );

-- Index for fast queries
CREATE INDEX idx_acervo_items_category ON public.acervo_items(category);
CREATE INDEX idx_acervo_items_concurso ON public.acervo_items(concurso);
```

**Step 3: Verify in Supabase dashboard**

- Check bucket `acervo-digital` exists in Storage
- Check table `acervo_items` exists in Table Editor
- Confirm RLS policies are active

---

## Task 2: Upload Script — PDFs to Supabase Storage + Populate Table

**Files:**
- Create: `scripts/upload-acervo.ts`

**Step 1: Write the upload script**

```typescript
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabase = createClient(
  'https://hnhzindsfuqnaxosujay.supabase.co',
  process.env.SUPABASE_SERVICE_KEY! // Use service role key for admin operations
)

const BUCKET = 'acervo-digital'

// Sanitize filename for storage path
function sanitizePath(name: string): string {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9._-]/g, '-') // replace special chars
    .replace(/-+/g, '-') // collapse dashes
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

async function uploadFile(localPath: string, storagePath: string): Promise<number> {
  const fileBuffer = fs.readFileSync(localPath)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true
    })
  if (error) throw new Error(`Upload failed ${storagePath}: ${error.message}`)
  return fileBuffer.length
}

async function uploadLivros(baseDir: string): Promise<AcervoItem[]> {
  const items: AcervoItem[] = []
  const livrosDir = path.join(baseDir, 'LIVROS PARA CONSULTA-20260309T144250Z-3-001', 'LIVROS PARA CONSULTA')
  const files = fs.readdirSync(livrosDir).filter(f => f.endsWith('.pdf'))

  for (const file of files) {
    const localPath = path.join(livrosDir, file)
    const storagePath = `livros/${sanitizePath(file)}`
    const title = file.replace('.pdf', '').replace(/-1$/, '').trim()

    console.log(`Uploading livro: ${title}`)
    const size = await uploadFile(localPath, storagePath)

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
  return items
}

async function uploadProvas(baseDir: string): Promise<AcervoItem[]> {
  const items: AcervoItem[] = []
  const provasDir = path.join(baseDir, 'PROVAS ANTERIORES-20260309T144233Z-3-001', 'PROVAS ANTERIORES')

  // Map folder structure to concurso + subcategory
  const mappings: Array<{ dir: string; concurso: string; subcategory: string | null; yearOverride?: number }> = [
    // EAOF organized by banca
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA CONSULPLAN (2014 e 2015)/EAOF 2014', concurso: 'EAOF', subcategory: 'Banca Consulplan (2014-2015)', yearOverride: 2014 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA CONSULPLAN (2014 e 2015)/EAOF 2015', concurso: 'EAOF', subcategory: 'Banca Consulplan (2014-2015)', yearOverride: 2015 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA CKM (2016)/EAOF 2016', concurso: 'EAOF', subcategory: 'Banca CKM (2016)', yearOverride: 2016 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2017', concurso: 'EAOF', subcategory: 'Banca Fadecit (2017-2021)', yearOverride: 2017 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2018', concurso: 'EAOF', subcategory: 'Banca Fadecit (2017-2021)', yearOverride: 2018 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2019', concurso: 'EAOF', subcategory: 'Banca Fadecit (2017-2021)', yearOverride: 2019 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2020', concurso: 'EAOF', subcategory: 'Banca Fadecit (2017-2021)', yearOverride: 2020 },
    { dir: 'PROVAS EAOF (ANTIGAS)/BANCA FADECIT (2017 a 2021)/EAOF 2021_', concurso: 'EAOF', subcategory: 'Banca Fadecit (2017-2021)', yearOverride: 2021 },
    { dir: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2022', concurso: 'EAOF', subcategory: 'Banca FGR - Atual (2022+)', yearOverride: 2022 },
    { dir: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2023', concurso: 'EAOF', subcategory: 'Banca FGR - Atual (2022+)', yearOverride: 2023 },
    { dir: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2024', concurso: 'EAOF', subcategory: 'Banca FGR - Atual (2022+)', yearOverride: 2024 },
    { dir: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2025', concurso: 'EAOF', subcategory: 'Banca FGR - Atual (2022+)', yearOverride: 2025 },
    { dir: 'PROVAS EAOF BANCA FGR (ATUAL)/Prova EAOF 2026', concurso: 'EAOF', subcategory: 'Banca FGR - Atual (2022+)', yearOverride: 2026 },
    // EAOP
    { dir: 'PROVAS EAOP, EAOEAR (ANTIGAS)', concurso: 'EAOP', subcategory: 'EAOP/EAOEAR Antigas', yearOverride: 2021 },
    { dir: 'Prova EAOP 2024', concurso: 'EAOP', subcategory: null, yearOverride: 2024 },
    { dir: 'EAOP 2025', concurso: 'EAOP', subcategory: null, yearOverride: 2025 },
    // CAMAR
    { dir: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2019', concurso: 'CAMAR', subcategory: 'Provas Antigas', yearOverride: 2019 },
    { dir: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2020', concurso: 'CAMAR', subcategory: 'Provas Antigas', yearOverride: 2020 },
    { dir: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2022', concurso: 'CAMAR', subcategory: 'Provas Antigas', yearOverride: 2022 },
    { dir: 'PROVAS CAMAR, CADAR, CAFAR (ANTIGAS)/2023', concurso: 'CAMAR', subcategory: 'Provas Antigas', yearOverride: 2023 },
    { dir: 'PROVA CAMAR 2025', concurso: 'CAMAR', subcategory: null, yearOverride: 2025 },
    // CADAR
    { dir: 'PROVA CADAR 2026', concurso: 'CADAR', subcategory: null, yearOverride: 2026 },
    // CAFAR
    { dir: 'PROVA CAFAR 2025', concurso: 'CAFAR', subcategory: null, yearOverride: 2025 },
    // CFOE
    { dir: 'PROVA CFOE 2025', concurso: 'CFOE', subcategory: null, yearOverride: 2025 },
  ]

  for (const mapping of mappings) {
    const dirPath = path.join(provasDir, mapping.dir)
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found: ${dirPath}`)
      continue
    }

    const files = fs.readdirSync(dirPath).filter(f =>
      f.endsWith('.pdf') || f.endsWith('.jpg') || f.endsWith('.png')
    )

    for (const file of files) {
      const localPath = path.join(dirPath, file)
      // Skip directories
      if (fs.statSync(localPath).isDirectory()) continue

      const storagePath = `provas/${sanitizePath(mapping.concurso)}/${mapping.yearOverride}/${sanitizePath(file)}`
      const title = file.replace(/\.(pdf|jpg|png)$/, '').trim()
      const ext = path.extname(file).slice(1)

      console.log(`Uploading prova: ${mapping.concurso} ${mapping.yearOverride} - ${title}`)
      const size = await uploadFile(localPath, storagePath)

      items.push({
        title,
        category: 'prova',
        concurso: mapping.concurso,
        subcategory: mapping.subcategory,
        year: mapping.yearOverride!,
        file_path: storagePath,
        file_size: size,
        file_type: ext === 'jpg' || ext === 'png' ? ext : 'pdf'
      })
    }
  }

  // Handle nested subdirectories (TEMA DA REDACAO etc)
  const temaDir = path.join(provasDir, 'Prova EAOP 2024', 'TEMA DA REDAÇÃO')
  if (fs.existsSync(temaDir)) {
    const files = fs.readdirSync(temaDir).filter(f => f.endsWith('.pdf'))
    for (const file of files) {
      const localPath = path.join(temaDir, file)
      const storagePath = `provas/eaop/2024/${sanitizePath(file)}`
      const title = file.replace('.pdf', '').trim()
      console.log(`Uploading prova: EAOP 2024 - ${title}`)
      const size = await uploadFile(localPath, storagePath)
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

  return items
}

async function main() {
  const baseDir = path.resolve(__dirname, '..')

  console.log('=== Uploading Livros ===')
  const livros = await uploadLivros(baseDir)
  console.log(`Uploaded ${livros.length} livros`)

  console.log('\n=== Uploading Provas ===')
  const provas = await uploadProvas(baseDir)
  console.log(`Uploaded ${provas.length} provas`)

  console.log('\n=== Inserting metadata ===')
  const allItems = [...livros, ...provas]

  // Clear existing items
  await supabase.from('acervo_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Insert in batches of 20
  for (let i = 0; i < allItems.length; i += 20) {
    const batch = allItems.slice(i, i + 20)
    const { error } = await supabase.from('acervo_items').insert(batch)
    if (error) {
      console.error(`Batch insert error at ${i}:`, error.message)
    } else {
      console.log(`Inserted batch ${i / 20 + 1} (${batch.length} items)`)
    }
  }

  console.log(`\nDone! Total: ${allItems.length} items uploaded`)
}

main().catch(console.error)
```

**Step 2: Run the upload script**

```bash
cd app-everest-main
SUPABASE_SERVICE_KEY="<service-role-key>" npx tsx scripts/upload-acervo.ts
```

**Step 3: Verify uploads**

- Check Supabase Storage → `acervo-digital` bucket has `livros/` and `provas/` folders
- Check `acervo_items` table has ~76 rows
- Test a public URL opens in browser

---

## Task 3: Create Acervo Service

**Files:**
- Create: `src/services/acervoService.ts`

**Step 1: Write the service**

```typescript
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

export const acervoService = {
  async getAll(): Promise<AcervoItem[]> {
    const { data, error } = await supabase
      .from('acervo_items')
      .select('*')
      .order('title')

    if (error) throw error
    return data || []
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

    // Sort order for concursos
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
```

**Step 2: Verify service compiles**

```bash
cd app-everest-main && npx tsc --noEmit src/services/acervoService.ts
```

---

## Task 4: Rebuild AcervoDigital.tsx Page

**Files:**
- Modify: `src/pages/AcervoDigital.tsx` (full rewrite)

**Step 1: Rewrite the page**

Replace the entire file with:

```tsx
import { useEffect, useState, useMemo } from 'react'
import { MagicCard } from '@/components/ui/magic-card'
import { MagicLayout } from '@/components/ui/magic-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  FileText,
  Library,
  Archive,
  BookOpen,
  Star,
  Search,
  Download,
  Eye,
  ChevronRight,
  X,
  ClipboardList,
  Loader2,
} from 'lucide-react'
import { acervoService, type AcervoItem, type ProvaGroup } from '@/services/acervoService'

// Color cycle for book cards
const BOOK_COLORS = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan'] as const
type LedColor = typeof BOOK_COLORS[number]

// Concurso badge colors
const CONCURSO_COLORS: Record<string, string> = {
  EAOF: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  EAOP: 'bg-green-500/10 text-green-600 border-green-500/20',
  CAMAR: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  CADAR: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  CAFAR: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  CFOE: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—'
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

export default function AcervoDigitalPage() {
  const [livros, setLivros] = useState<AcervoItem[]>([])
  const [provas, setProvas] = useState<AcervoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewingFile, setViewingFile] = useState<AcervoItem | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        const [l, p] = await Promise.all([
          acervoService.getLivros(),
          acervoService.getProvas(),
        ])
        setLivros(l)
        setProvas(p)
      } catch (err) {
        console.error('Error loading acervo:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const provaGroups = useMemo(() => acervoService.groupProvasByConcurso(provas), [provas])

  // Search filter
  const filteredLivros = useMemo(() => {
    if (!search) return livros
    const q = search.toLowerCase()
    return livros.filter(l => l.title.toLowerCase().includes(q))
  }, [livros, search])

  const filteredProvaGroups = useMemo((): ProvaGroup[] => {
    if (!search) return provaGroups
    const q = search.toLowerCase()
    return provaGroups
      .map(group => ({
        ...group,
        subcategories: group.subcategories
          .map(sub => ({
            ...sub,
            years: sub.years
              .map(y => ({
                ...y,
                items: y.items.filter(i => i.title.toLowerCase().includes(q) || group.concurso.toLowerCase().includes(q))
              }))
              .filter(y => y.items.length > 0)
          }))
          .filter(s => s.years.length > 0)
      }))
      .filter(g => g.subcategories.length > 0)
  }, [provaGroups, search])

  const totalItems = livros.length + provas.length

  function openViewer(item: AcervoItem) {
    setViewingFile(item)
  }

  function getFileUrl(item: AcervoItem): string {
    return acervoService.getPublicUrl(item.file_path)
  }

  if (isLoading) {
    return (
      <MagicLayout title="Acervo Digital" description="Carregando sua biblioteca...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title="Acervo Digital"
      description="Sua biblioteca virtual com materiais de estudo, livros e provas anteriores"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Library className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Acervo Digital
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                    Livros, apostilas e provas anteriores para seu estudo
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Star className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium">Biblioteca Virtual</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Archive className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">{totalItems}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">{livros.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Livros</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <ClipboardList className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">{provas.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Provas</div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar material por nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </MagicCard>

        {/* Section: Livros */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <BookOpen className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">Livros para Consulta</h2>
              <p className="text-sm text-muted-foreground">Gramáticas, apostilas e materiais de referência</p>
            </div>
          </div>

          {filteredLivros.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'Nenhum livro encontrado para essa busca.' : 'Nenhum livro disponível.'}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredLivros.map((livro, index) => (
                <MagicCard
                  key={livro.id}
                  className="group flex flex-col justify-between overflow-hidden"
                  led={true}
                  ledColor={BOOK_COLORS[index % BOOK_COLORS.length]}
                >
                  <div className="p-5 space-y-3">
                    <div className={`
                      w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110
                      bg-gradient-to-br from-green-500/10 to-green-600/5 text-green-500
                    `}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {livro.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(livro.file_size)} &middot; PDF
                      </p>
                    </div>
                  </div>
                  <div className="p-5 pt-0 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => openViewer(livro)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ler
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={getFileUrl(livro)} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </MagicCard>
              ))}
            </div>
          )}
        </div>

        {/* Section: Provas */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <ClipboardList className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">Provas Anteriores</h2>
              <p className="text-sm text-muted-foreground">Provas e gabaritos organizados por concurso e ano</p>
            </div>
          </div>

          {filteredProvaGroups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'Nenhuma prova encontrada para essa busca.' : 'Nenhuma prova disponível.'}
            </p>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              {filteredProvaGroups.map(group => (
                <AccordionItem
                  key={group.concurso}
                  value={group.concurso}
                  className="border rounded-xl overflow-hidden bg-card"
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-3 text-left">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${CONCURSO_COLORS[group.concurso] || 'bg-muted text-foreground'}`}>
                        {group.concurso}
                      </span>
                      <div>
                        <span className="font-semibold text-sm">{group.totalFiles} arquivos</span>
                        <span className="text-xs text-muted-foreground ml-2">{group.yearRange}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    {group.subcategories.map((sub, subIdx) => (
                      <div key={subIdx} className="mb-4 last:mb-0">
                        {sub.name && (
                          <div className="flex items-center gap-2 mb-3">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">{sub.name}</span>
                          </div>
                        )}
                        {sub.years.map(yearGroup => (
                          <div key={yearGroup.year} className="ml-4 mb-3 last:mb-0">
                            <div className="text-xs font-bold text-primary mb-2">{yearGroup.year}</div>
                            <div className="space-y-1.5">
                              {yearGroup.items.map(item => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group/item"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm truncate">{item.title}</span>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      {formatFileSize(item.file_size)}
                                    </span>
                                  </div>
                                  <div className="flex gap-1.5 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs gap-1 opacity-70 group-hover/item:opacity-100"
                                      onClick={() => openViewer(item)}
                                    >
                                      <Eye className="h-3 w-3" />
                                      Ler
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 opacity-70 group-hover/item:opacity-100"
                                      asChild
                                    >
                                      <a href={getFileUrl(item)} download target="_blank" rel="noopener noreferrer">
                                        <Download className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={open => !open && setViewingFile(null)}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] max-h-[92vh] p-0 gap-0 overflow-hidden">
          {viewingFile && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-semibold text-sm truncate">{viewingFile.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1.5" asChild>
                    <a href={getFileUrl(viewingFile)} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setViewingFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <iframe
                src={getFileUrl(viewingFile)}
                className="w-full flex-1"
                style={{ height: 'calc(92vh - 56px)' }}
                title={viewingFile.title}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </MagicLayout>
  )
}
```

**Step 2: Verify the page compiles**

```bash
cd app-everest-main && npx tsc --noEmit
```

**Step 3: Run dev server and test**

```bash
cd app-everest-main && npm run dev
```

- Navigate to `/acervo`
- Verify header stats show correct counts
- Verify books grid renders
- Verify provas accordion expands
- Test search filters both sections
- Click "Ler" and verify PDF viewer opens
- Click "Baixar" and verify download works
- Test on mobile viewport

---

## Task 5: Commit

**Step 1: Commit the changes**

```bash
git add src/services/acervoService.ts src/pages/AcervoDigital.tsx
git commit -m "feat: rebuild acervo digital with supabase storage + inline PDF viewer

- Books grid with MagicCards, provas accordion by concurso/year
- Inline PDF viewer dialog, search filter, download buttons
- acervoService for fetching from acervo_items table"
```
