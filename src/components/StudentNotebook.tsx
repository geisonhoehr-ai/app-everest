import { useState, useCallback, useRef, lazy, Suspense, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import DOMPurify from 'dompurify'
import {
  PenLine,
  Type,
  Download,
  Maximize2,
  Minimize2,
  BookOpen,
  Loader2,
} from 'lucide-react'
import { NotebookCanvas } from '@/components/NotebookCanvas'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'

const RichTextEditor = lazy(() =>
  import('@/components/RichTextEditor').then(m => ({ default: m.RichTextEditor }))
)

type NotebookMode = 'text' | 'draw' | 'split'

interface StudentNotebookProps {
  noteContent: string
  onNoteChange: (content: string) => void
  drawingData: string | null
  onDrawingChange: (data: string) => void
  lessonTitle?: string
  saveStatus?: string | null
  className?: string
  expanded?: boolean
  onToggleExpand?: () => void
}

export const StudentNotebook = memo(function StudentNotebook({
  noteContent,
  onNoteChange,
  drawingData,
  onDrawingChange,
  lessonTitle = 'Anotações',
  saveStatus,
  className,
  expanded = false,
  onToggleExpand,
}: StudentNotebookProps) {
  const [mode, setMode] = useState<NotebookMode>('text')
  const [exporting, setExporting] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { toast } = useToast()

  // Export notebook as PDF
  const handleExportPDF = useCallback(async () => {
    setExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      let yPos = 15

      // Title
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(lessonTitle, 14, yPos)
      yPos += 8

      // Date
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(120, 120, 120)
      pdf.text(`Exportado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, yPos)
      yPos += 10
      pdf.setTextColor(0, 0, 0)

      // Drawing (if exists)
      if (drawingData) {
        try {
          const tempCanvas = document.querySelector('canvas[class*="touch-none"]') as HTMLCanvasElement
          if (tempCanvas) {
            const imgData = tempCanvas.toDataURL('image/png')
            const imgWidth = pageWidth - 28
            const imgHeight = (tempCanvas.height / tempCanvas.width) * imgWidth
            const maxHeight = 120

            if (yPos + Math.min(imgHeight, maxHeight) > 280) {
              pdf.addPage()
              yPos = 15
            }

            pdf.setDrawColor(200)
            pdf.setLineWidth(0.3)
            pdf.rect(14, yPos, imgWidth, Math.min(imgHeight, maxHeight))
            pdf.addImage(imgData, 'PNG', 14, yPos, imgWidth, Math.min(imgHeight, maxHeight))
            yPos += Math.min(imgHeight, maxHeight) + 8
          }
        } catch (err) {
          logger.error('Erro ao exportar desenho:', err)
        }
      }

      // Text notes (if exists)
      if (noteContent && noteContent !== '<p></p>') {
        if (yPos > 250) {
          pdf.addPage()
          yPos = 15
        }

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Anotações de Texto', 14, yPos)
        yPos += 7

        // Safely extract text content using DOMPurify
        const sanitized = DOMPurify.sanitize(noteContent, { ALLOWED_TAGS: [] })
        const plainText = sanitized.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        const lines = pdf.splitTextToSize(plainText, pageWidth - 28)

        for (const line of lines) {
          if (yPos > 280) {
            pdf.addPage()
            yPos = 15
          }
          pdf.text(line, 14, yPos)
          yPos += 5
        }
      }

      // Footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(150, 150, 150)
        pdf.text(
          `Everest Preparatórios — ${lessonTitle} — Página ${i}/${totalPages}`,
          pageWidth / 2, 290,
          { align: 'center' }
        )
      }

      pdf.save(`anotacoes-${lessonTitle.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.pdf`)
      toast({ title: 'PDF exportado com sucesso!' })
    } catch (error) {
      logger.error('Erro ao exportar PDF:', error)
      toast({ title: 'Erro ao exportar PDF', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }, [noteContent, drawingData, lessonTitle, toast])

  return (
    <div className={cn('flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Caderno Digital</span>
          {saveStatus && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {saveStatus}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Mode toggles */}
          <div className="flex items-center bg-muted rounded-md p-0.5">
            <button
              onClick={() => setMode('text')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
                mode === 'text' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Type className="h-3 w-3" />
              Texto
            </button>
            <button
              onClick={() => setMode('draw')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
                mode === 'draw' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <PenLine className="h-3 w-3" />
              Desenhar
            </button>
            <button
              onClick={() => setMode('split')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
                mode === 'split' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BookOpen className="h-3 w-3" />
              Ambos
            </button>
          </div>

          {/* Export */}
          <Button variant="ghost" size="sm" onClick={handleExportPDF} disabled={exporting}
            className="h-7 px-2 text-xs" title="Exportar como PDF">
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          </Button>

          {/* Expand */}
          {onToggleExpand && (
            <Button variant="ghost" size="sm" onClick={onToggleExpand}
              className="h-7 px-2 text-xs" title={expanded ? 'Reduzir' : 'Expandir'}>
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'text' && (
          <div className="h-full overflow-y-auto p-3">
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando editor...</div>}>
              <RichTextEditor
                content={noteContent}
                onChange={onNoteChange}
                placeholder="Escreva suas anotações aqui..."
                minHeight="400px"
              />
            </Suspense>
          </div>
        )}

        {mode === 'draw' && (
          <NotebookCanvas
            onDrawingChange={onDrawingChange}
            initialDrawing={drawingData}
            className="h-full"
          />
        )}

        {mode === 'split' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 border-b border-border">
              <NotebookCanvas
                onDrawingChange={onDrawingChange}
                initialDrawing={drawingData}
                className="h-full"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando editor...</div>}>
                <RichTextEditor
                  content={noteContent}
                  onChange={onNoteChange}
                  placeholder="Escreva suas anotações aqui..."
                  minHeight="200px"
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
