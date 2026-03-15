import { useCallback, useEffect, useRef, useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Pen, Highlighter, Eraser, Undo2, Trash2, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tool = 'pen' | 'highlighter' | 'eraser'

interface Point {
  x: number
  y: number
  pressure?: number
}

interface Stroke {
  tool: Tool
  color: string
  width: number
  alpha: number
  points: Point[]
}

interface NotebookCanvasProps {
  width?: number
  height?: number
  className?: string
  onDrawingChange?: (dataUrl: string) => void
  initialDrawing?: string | null
  lineSpacing?: number
}

const COLORS = [
  { value: '#1e40af', label: 'Azul' },
  { value: '#dc2626', label: 'Vermelho' },
  { value: '#16a34a', label: 'Verde' },
  { value: '#1f2937', label: 'Preto' },
]

const STROKE_WIDTHS = [
  { value: 2, label: 'Fino' },
  { value: 4, label: 'Médio' },
  { value: 8, label: 'Grosso' },
]

export const NotebookCanvas = memo(function NotebookCanvas({
  className,
  onDrawingChange,
  initialDrawing,
  lineSpacing = 28,
}: NotebookCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTool, setActiveTool] = useState<Tool>('pen')
  const [activeColor, setActiveColor] = useState('#1e40af')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadedRef = useRef(false)

  // Resize canvas to fill container
  const syncCanvasSize = useCallback(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const rect = container.getBoundingClientRect()
    const w = Math.floor(rect.width)
    const h = Math.max(600, Math.floor(rect.height))

    if (w !== canvasSize.width || h !== canvasSize.height) {
      canvas.width = w
      canvas.height = h
      setCanvasSize({ width: w, height: h })
    }
  }, [canvasSize])

  useEffect(() => {
    syncCanvasSize()
    const handleResize = () => syncCanvasSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [syncCanvasSize])

  // Draw lined paper background
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Paper background
    ctx.fillStyle = 'var(--notebook-bg, #fefce8)'
    ctx.fillRect(0, 0, w, h)

    // Red margin line
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(60, 0)
    ctx.lineTo(60, h)
    ctx.stroke()

    // Blue horizontal lines
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)'
    ctx.lineWidth = 0.5
    for (let y = lineSpacing; y < h; y += lineSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }, [lineSpacing])

  // Redraw everything
  const redraw = useCallback((strokeList: Stroke[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawBackground(ctx, canvas.width, canvas.height)

    for (const stroke of strokeList) {
      ctx.save()

      if (stroke.tool === 'eraser') {
        // Eraser paints background color over strokes
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = '#fefce8'
        ctx.globalAlpha = 1
      } else if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 0.3
        ctx.strokeStyle = stroke.color
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
        ctx.strokeStyle = stroke.color
      }

      const baseWidth = stroke.tool === 'highlighter' ? stroke.width * 4 : stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (stroke.points.length > 0) {
        const hasPressure = stroke.points.some(p => p.pressure !== undefined && p.pressure !== 0.5)

        if (hasPressure && stroke.tool === 'pen') {
          for (let i = 1; i < stroke.points.length; i++) {
            const prev = stroke.points[i - 1]
            const curr = stroke.points[i]
            const pressure = curr.pressure ?? 0.5
            ctx.lineWidth = baseWidth * (0.3 + pressure * 1.4)
            ctx.beginPath()
            ctx.moveTo(prev.x, prev.y)
            if (i < stroke.points.length - 1) {
              const next = stroke.points[i + 1]
              ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2)
            } else {
              ctx.lineTo(curr.x, curr.y)
            }
            ctx.stroke()
          }
        } else {
          ctx.lineWidth = baseWidth
          ctx.beginPath()
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
          for (let i = 1; i < stroke.points.length - 1; i++) {
            const curr = stroke.points[i]
            const next = stroke.points[i + 1]
            ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2)
          }
          if (stroke.points.length > 1) {
            const last = stroke.points[stroke.points.length - 1]
            ctx.lineTo(last.x, last.y)
          }
          ctx.stroke()
        }
      }
      ctx.restore()
    }
  }, [drawBackground])

  // Redraw on stroke/size changes
  useEffect(() => {
    redraw(strokes)
  }, [strokes, canvasSize, redraw])

  // Load initial drawing
  useEffect(() => {
    if (initialDrawing && !initialLoadedRef.current && canvasSize.width > 0) {
      try {
        const parsed = JSON.parse(initialDrawing)
        if (Array.isArray(parsed)) {
          setStrokes(parsed)
          initialLoadedRef.current = true
        }
      } catch {
        initialLoadedRef.current = true
      }
    }
  }, [initialDrawing, canvasSize])

  // Auto-save drawing data
  const triggerSave = useCallback((strokeList: Stroke[]) => {
    if (!onDrawingChange) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      onDrawingChange(JSON.stringify(strokeList))
    }, 1500)
  }, [onDrawingChange])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // Pointer handlers
  const getPos = useCallback((e: React.PointerEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const pos = getPos(e)
    setIsDrawing(true)
    const newStroke: Stroke = {
      tool: activeTool,
      color: activeColor,
      width: strokeWidth,
      alpha: activeTool === 'highlighter' ? 0.3 : 1,
      points: [pos],
    }
    setCurrentStroke(newStroke)
  }, [activeTool, activeColor, strokeWidth, getPos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || !currentStroke) return
    e.preventDefault()
    const pos = getPos(e)
    const updated = { ...currentStroke, points: [...currentStroke.points, pos] }
    setCurrentStroke(updated)
    redraw([...strokes, updated])
  }, [isDrawing, currentStroke, getPos, redraw, strokes])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !currentStroke) return
    const newStrokes = [...strokes, currentStroke]
    setStrokes(newStrokes)
    setCurrentStroke(null)
    setIsDrawing(false)
    triggerSave(newStrokes)
  }, [isDrawing, currentStroke, strokes, triggerSave])

  const handleUndo = useCallback(() => {
    const newStrokes = strokes.slice(0, -1)
    setStrokes(newStrokes)
    triggerSave(newStrokes)
  }, [strokes, triggerSave])

  const handleClear = useCallback(() => {
    setStrokes([])
    triggerSave([])
  }, [triggerSave])

  // Export canvas as image data URL
  const getCanvasDataUrl = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }, [])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-card rounded-t-lg">
        <Button variant="ghost" size="sm" onClick={() => setActiveTool('pen')}
          className={cn(activeTool === 'pen' && 'ring-2 ring-primary bg-accent')} title="Caneta">
          <Pen className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setActiveTool('highlighter')}
          className={cn(activeTool === 'highlighter' && 'ring-2 ring-primary bg-accent')} title="Marcador">
          <Highlighter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setActiveTool('eraser')}
          className={cn(activeTool === 'eraser' && 'ring-2 ring-primary bg-accent')} title="Borracha">
          <Eraser className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {COLORS.map(c => (
          <button key={c.value} onClick={() => setActiveColor(c.value)}
            className={cn('w-5 h-5 rounded-full border-2 transition-all',
              activeColor === c.value ? 'border-foreground scale-125' : 'border-transparent'
            )}
            style={{ backgroundColor: c.value }} title={c.label} />
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        {STROKE_WIDTHS.map(sw => (
          <Button key={sw.value} variant="ghost" size="sm"
            onClick={() => setStrokeWidth(sw.value)}
            className={cn(strokeWidth === sw.value && 'ring-2 ring-primary bg-accent')} title={sw.label}>
            <Minus className="h-4 w-4" style={{ strokeWidth: sw.value }} />
          </Button>
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        <Button variant="ghost" size="sm" onClick={handleUndo} disabled={strokes.length === 0} title="Desfazer">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={strokes.length === 0} title="Limpar tudo">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 relative overflow-auto rounded-b-lg border border-t-0 border-border"
        style={{ '--notebook-bg': '#fefce8' } as React.CSSProperties}>
        <canvas
          ref={canvasRef}
          className="touch-none cursor-crosshair"
          style={{ background: '#fefce8' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  )
})

// Re-export for external use (PDF export)
export type { Stroke, Point }
