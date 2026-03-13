import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Pen,
  Highlighter,
  Type,
  Eraser,
  Undo2,
  Trash2,
  Save,
  Maximize2,
  Minus,
  Circle,
} from 'lucide-react'

type Tool = 'pen' | 'highlighter' | 'text' | 'eraser'
type StrokeWidth = 2 | 4 | 8

interface Point {
  x: number
  y: number
}

interface Stroke {
  tool: Tool
  color: string
  width: number
  alpha: number
  points: Point[]
  text?: string
  position?: Point
}

interface PdfAnnotationCanvasProps {
  fileUrl: string
  isImage: boolean
  annotationDataUrl: string | null
  onSave: (dataUrl: string) => void
}

const COLORS = [
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#000000', label: 'Preto' },
]

const STROKE_WIDTHS: { value: StrokeWidth; label: string }[] = [
  { value: 2, label: 'Fino' },
  { value: 4, label: 'Médio' },
  { value: 8, label: 'Grosso' },
]

export const PdfAnnotationCanvas = ({
  fileUrl,
  isImage,
  annotationDataUrl,
  onSave,
}: PdfAnnotationCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [activeTool, setActiveTool] = useState<Tool>('pen')
  const [activeColor, setActiveColor] = useState('#ef4444')
  const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>(4)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Fullscreen refs (mirror for the dialog canvas)
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null)
  const fullscreenImageRef = useRef<HTMLImageElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)

  const getActiveCanvas = useCallback(() => {
    return isFullscreen ? fullscreenCanvasRef.current : canvasRef.current
  }, [isFullscreen])

  const getActiveImage = useCallback(() => {
    return isFullscreen ? fullscreenImageRef.current : imageRef.current
  }, [isFullscreen])

  // Sync canvas size to image dimensions
  const syncCanvasSize = useCallback(() => {
    const img = getActiveImage()
    const canvas = getActiveCanvas()
    if (!img || !canvas) return

    const rect = img.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    canvas.width = rect.width
    canvas.height = rect.height
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    setCanvasSize({ width: rect.width, height: rect.height })
  }, [getActiveCanvas, getActiveImage])

  // Redraw all strokes onto a canvas
  const redrawStrokes = useCallback(
    (canvas: HTMLCanvasElement, strokeList: Stroke[]) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const stroke of strokeList) {
        ctx.save()

        if (stroke.tool === 'text' && stroke.text && stroke.position) {
          ctx.globalAlpha = 1
          ctx.fillStyle = stroke.color
          ctx.font = `${stroke.width * 4}px sans-serif`
          ctx.fillText(stroke.text, stroke.position.x, stroke.position.y)
          ctx.restore()
          continue
        }

        if (stroke.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out'
          ctx.strokeStyle = 'rgba(0,0,0,1)'
        } else if (stroke.tool === 'highlighter') {
          ctx.globalCompositeOperation = 'source-over'
          ctx.globalAlpha = 0.3
          ctx.strokeStyle = stroke.color
        } else {
          ctx.globalCompositeOperation = 'source-over'
          ctx.globalAlpha = 1
          ctx.strokeStyle = stroke.color
        }

        ctx.lineWidth = stroke.tool === 'highlighter' ? stroke.width * 4 : stroke.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        if (stroke.points.length > 0) {
          ctx.beginPath()
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
          }
          ctx.stroke()
        }

        ctx.restore()
      }
    },
    []
  )

  // Redraw whenever strokes change
  useEffect(() => {
    const canvas = getActiveCanvas()
    if (!canvas) return
    redrawStrokes(canvas, strokes)
  }, [strokes, getActiveCanvas, redrawStrokes, canvasSize])

  // Load existing annotations
  useEffect(() => {
    if (!annotationDataUrl || !isImage) return

    const canvas = getActiveCanvas()
    if (!canvas || canvas.width === 0) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
    }
    img.src = annotationDataUrl
  }, [annotationDataUrl, isImage, getActiveCanvas, canvasSize])

  // Sync canvas on image load and resize
  useEffect(() => {
    if (!isImage || !imageLoaded) return

    syncCanvasSize()

    const handleResize = () => syncCanvasSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isImage, imageLoaded, syncCanvasSize, isFullscreen])

  // Get position relative to canvas
  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = getActiveCanvas()
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      }
    },
    [getActiveCanvas]
  )

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isImage) return
      e.preventDefault()

      const pos = getPos(e)

      if (activeTool === 'text') {
        const text = prompt('Digite o texto da anotação:')
        if (text) {
          const textStroke: Stroke = {
            tool: 'text',
            color: activeColor,
            width: strokeWidth,
            alpha: 1,
            points: [],
            text,
            position: pos,
          }
          setStrokes((prev) => [...prev, textStroke])
        }
        return
      }

      setIsDrawing(true)
      const newStroke: Stroke = {
        tool: activeTool,
        color: activeColor,
        width: strokeWidth,
        alpha: activeTool === 'highlighter' ? 0.3 : 1,
        points: [pos],
      }
      setCurrentStroke(newStroke)
    },
    [isImage, activeTool, activeColor, strokeWidth, getPos]
  )

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !currentStroke) return
      e.preventDefault()

      const pos = getPos(e)
      const updatedStroke = {
        ...currentStroke,
        points: [...currentStroke.points, pos],
      }
      setCurrentStroke(updatedStroke)

      // Draw current stroke in real-time
      const canvas = getActiveCanvas()
      if (!canvas) return

      redrawStrokes(canvas, [...strokes, updatedStroke])
    },
    [isDrawing, currentStroke, getPos, getActiveCanvas, redrawStrokes, strokes]
  )

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !currentStroke) return

    setStrokes((prev) => [...prev, currentStroke])
    setCurrentStroke(null)
    setIsDrawing(false)
  }, [isDrawing, currentStroke])

  const handleUndo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1))
  }, [])

  const handleClearAll = useCallback(() => {
    setStrokes([])
    const canvas = getActiveCanvas()
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [getActiveCanvas])

  const handleSave = useCallback(() => {
    const img = getActiveImage()
    const annotationCanvas = getActiveCanvas()
    if (!img || !annotationCanvas) return

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = annotationCanvas.width
    tempCanvas.height = annotationCanvas.height
    const ctx = tempCanvas.getContext('2d')
    if (!ctx) return

    // Draw original image
    ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)
    // Draw annotations on top
    ctx.drawImage(annotationCanvas, 0, 0)

    const dataUrl = tempCanvas.toDataURL('image/png')
    onSave(dataUrl)
  }, [getActiveImage, getActiveCanvas, onSave])

  const getCursorClass = () => {
    switch (activeTool) {
      case 'pen':
        return 'cursor-crosshair'
      case 'highlighter':
        return 'cursor-crosshair'
      case 'text':
        return 'cursor-text'
      case 'eraser':
        return 'cursor-cell'
      default:
        return 'cursor-crosshair'
    }
  }

  const toolbarButton = (
    tool: Tool,
    icon: React.ReactNode,
    label: string
  ) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setActiveTool(tool)}
      className={
        activeTool === tool
          ? 'ring-2 ring-primary bg-accent'
          : ''
      }
      title={label}
    >
      {icon}
    </Button>
  )

  const renderToolbar = () => (
    <div className="flex flex-wrap items-center gap-1">
      {/* Drawing tools */}
      {toolbarButton('pen', <Pen className="h-4 w-4" />, 'Caneta')}
      {toolbarButton('highlighter', <Highlighter className="h-4 w-4" />, 'Marcador')}
      {toolbarButton('text', <Type className="h-4 w-4" />, 'Texto')}
      {toolbarButton('eraser', <Eraser className="h-4 w-4" />, 'Borracha')}

      <div className="w-px h-6 bg-border mx-1" />

      {/* Colors */}
      {COLORS.map((c) => (
        <button
          key={c.value}
          onClick={() => setActiveColor(c.value)}
          className={`w-5 h-5 rounded-full border-2 transition-all ${
            activeColor === c.value
              ? 'border-foreground scale-125'
              : 'border-transparent'
          }`}
          style={{ backgroundColor: c.value }}
          title={c.label}
        />
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      {/* Stroke width */}
      {STROKE_WIDTHS.map((sw) => (
        <Button
          key={sw.value}
          variant="ghost"
          size="sm"
          onClick={() => setStrokeWidth(sw.value)}
          className={
            strokeWidth === sw.value
              ? 'ring-2 ring-primary bg-accent'
              : ''
          }
          title={sw.label}
        >
          {sw.value === 2 && <Minus className="h-3 w-3" />}
          {sw.value === 4 && <Circle className="h-3 w-3" />}
          {sw.value === 8 && <Circle className="h-4 w-4" />}
        </Button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      {/* Actions */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUndo}
        disabled={strokes.length === 0}
        title="Desfazer"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearAll}
        disabled={strokes.length === 0}
        title="Limpar tudo"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsFullscreen(true)}
        title="Expandir"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      {isImage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={strokes.length === 0}
          title="Salvar anotações"
          className="text-green-600 hover:text-green-700"
        >
          <Save className="h-4 w-4" />
        </Button>
      )}
    </div>
  )

  const renderImageWithCanvas = (
    imgRef: React.RefObject<HTMLImageElement | null>,
    cvRef: React.RefObject<HTMLCanvasElement | null>,
    ctnRef: React.RefObject<HTMLDivElement | null>
  ) => (
    <div ref={ctnRef} className="relative inline-block w-full">
      <img
        ref={imgRef}
        src={fileUrl}
        alt="Documento"
        crossOrigin="anonymous"
        className="block w-full h-auto select-none"
        onLoad={() => {
          setImageLoaded(true)
          // Defer sync to next frame so layout is settled
          requestAnimationFrame(() => syncCanvasSize())
        }}
        draggable={false}
      />
      <canvas
        ref={cvRef}
        className={`absolute top-0 left-0 touch-none ${getCursorClass()}`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
    </div>
  )

  const renderPdfViewer = () => (
    <div className="w-full">
      <iframe
        src={fileUrl}
        className="w-full h-[600px] border-0 rounded-md"
        title="PDF do documento"
      />
      <p className="text-sm text-muted-foreground mt-2 text-center">
        Para anotar diretamente, converta o PDF para imagem.
      </p>
    </div>
  )

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Arquivo Enviado</CardTitle>
          </div>
          {isImage && <div className="mt-2">{renderToolbar()}</div>}
          {!isImage && (
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                title="Expandir"
              >
                <Maximize2 className="h-4 w-4 mr-1" />
                Expandir
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isImage
            ? renderImageWithCanvas(imageRef, canvasRef, containerRef)
            : renderPdfViewer()}
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] flex flex-col p-4">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Arquivo Enviado</DialogTitle>
            {isImage && <div className="mt-2">{renderToolbar()}</div>}
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {isImage
              ? renderImageWithCanvas(
                  fullscreenImageRef,
                  fullscreenCanvasRef,
                  fullscreenContainerRef
                )
              : (
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0 rounded-md min-h-[70vh]"
                  title="PDF do documento"
                />
              )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
