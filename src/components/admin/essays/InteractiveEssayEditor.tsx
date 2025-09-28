import { Card, CardContent } from '@/components/ui/card'
import type { EssayAnnotation } from '@/services/essayService'
import { useRef } from 'react'

interface InteractiveEssayEditorProps {
  text: string
  annotations: EssayAnnotation[]
  onTextSelect: (start: number, end: number, text: string) => void
  onAnnotationClick: (annotation: EssayAnnotation) => void
}

export const InteractiveEssayEditor = ({
  text,
  annotations,
  onTextSelect,
  onAnnotationClick,
}: InteractiveEssayEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null)

  const handleMouseUp = () => {
    const selection = window.getSelection()
    if (
      selection &&
      selection.rangeCount > 0 &&
      !selection.isCollapsed &&
      editorRef.current?.contains(selection.anchorNode)
    ) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      const preSelectionRange = document.createRange()
      const editorDiv = editorRef.current
      if (editorDiv) {
        preSelectionRange.selectNodeContents(editorDiv)
        preSelectionRange.setEnd(range.startContainer, range.startOffset)
        const start = preSelectionRange.toString().length
        const end = start + selectedText.length
        onTextSelect(start, end, selectedText)
      }
    }
  }

  const renderText = () => {
    let lastIndex = 0
    const parts = []
    const sortedAnnotations = [...annotations].sort(
      (a, b) => a.start_offset - b.start_offset,
    )

    sortedAnnotations.forEach((anno) => {
      if (anno.start_offset > lastIndex) {
        parts.push(text.substring(lastIndex, anno.start_offset))
      }
      parts.push(
        <mark
          key={anno.id}
          className="bg-yellow-200 dark:bg-yellow-800/50 p-0.5 rounded-sm cursor-pointer"
          onClick={() => onAnnotationClick(anno)}
        >
          {text.substring(anno.start_offset, anno.end_offset)}
        </mark>,
      )
      lastIndex = anno.end_offset
    })

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }
    return parts
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div
          ref={editorRef}
          className="prose dark:prose-invert max-w-none whitespace-pre-wrap"
          onMouseUp={handleMouseUp}
        >
          {renderText()}
        </div>
      </CardContent>
    </Card>
  )
}
