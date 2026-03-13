import { useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Underline as UnderlineIcon,
  Strikethrough,
  RemoveFormatting,
  Type,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EssayTextAnnotatorProps {
  originalText: string
  annotatedHtml: string | null
  onChange: (html: string) => void
  readOnly?: boolean
}

function plainTextToHtml(text: string): string {
  return text
    .split('\n')
    .map((line) => `<p>${line || '<br>'}</p>`)
    .join('')
}

interface HighlightButtonProps {
  color: string
  label: string
  isActive: boolean
  onClick: () => void
}

function HighlightButton({ color, label, isActive, onClick }: HighlightButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', isActive && 'ring-2 ring-ring')}
          onClick={onClick}
        >
          <span
            className="h-4 w-4 rounded-full border border-border"
            style={{ backgroundColor: color }}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

function ToolbarButton({ icon, label, isActive, onClick }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', isActive && 'bg-accent text-accent-foreground')}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

const HIGHLIGHT_COLORS = [
  { color: '#fef08a', label: 'Destaque amarelo' },
  { color: '#fca5a5', label: 'Destaque vermelho' },
  { color: '#86efac', label: 'Destaque verde' },
  { color: '#93c5fd', label: 'Destaque azul' },
] as const

const TEXT_COLORS = [
  { color: '#ef4444', label: 'Texto vermelho (erro)' },
  { color: '#22c55e', label: 'Texto verde (correto)' },
] as const

export function EssayTextAnnotator({
  originalText,
  annotatedHtml,
  onChange,
  readOnly = false,
}: EssayTextAnnotatorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        listItem: false,
        bulletList: false,
        orderedList: false,
      }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['paragraph'] }),
    ],
    content: annotatedHtml || plainTextToHtml(originalText),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'min-h-[200px] p-4 focus:outline-none',
          '[&_p]:my-1',
          '[&_mark]:rounded [&_mark]:px-0.5',
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  // Sync readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly)
    }
  }, [editor, readOnly])

  const toggleHighlight = useCallback(
    (color: string) => {
      if (!editor) return
      if (editor.isActive('highlight', { color })) {
        editor.chain().focus().unsetHighlight().run()
      } else {
        editor.chain().focus().toggleHighlight({ color }).run()
      }
    },
    [editor],
  )

  const setTextColor = useCallback(
    (color: string) => {
      if (!editor) return
      if (editor.isActive('textStyle', { color })) {
        editor.chain().focus().unsetColor().run()
      } else {
        editor.chain().focus().setColor(color).run()
      }
    },
    [editor],
  )

  const clearFormatting = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetAllMarks().run()
  }, [editor])

  if (!editor) return null

  return (
    <TooltipProvider delayDuration={300}>
      <div className="rounded-lg border border-border bg-white dark:bg-slate-800">
        {/* Toolbar */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
            {/* Highlight colors */}
            <div className="flex items-center gap-0.5">
              <span className="mr-1 text-xs text-muted-foreground select-none">Destaque:</span>
              {HIGHLIGHT_COLORS.map(({ color, label }) => (
                <HighlightButton
                  key={color}
                  color={color}
                  label={label}
                  isActive={editor.isActive('highlight', { color })}
                  onClick={() => toggleHighlight(color)}
                />
              ))}
            </div>

            <div className="mx-1.5 h-5 w-px bg-border" />

            {/* Formatting */}
            <div className="flex items-center gap-0.5">
              <ToolbarButton
                icon={<UnderlineIcon className="h-4 w-4" />}
                label="Sublinhado"
                isActive={editor.isActive('underline')}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              />
              <ToolbarButton
                icon={<Strikethrough className="h-4 w-4" />}
                label="Tachado"
                isActive={editor.isActive('strike')}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              />
            </div>

            <div className="mx-1.5 h-5 w-px bg-border" />

            {/* Text colors */}
            <div className="flex items-center gap-0.5">
              <span className="mr-1 text-xs text-muted-foreground select-none">Cor:</span>
              {TEXT_COLORS.map(({ color, label }) => (
                <Tooltip key={color}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-8 w-8',
                        editor.isActive('textStyle', { color }) && 'ring-2 ring-ring',
                      )}
                      onClick={() => setTextColor(color)}
                    >
                      <Type className="h-4 w-4" style={{ color }} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            <div className="mx-1.5 h-5 w-px bg-border" />

            {/* Clear formatting */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearFormatting}
                >
                  <RemoveFormatting className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Limpar formatação</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
    </TooltipProvider>
  )
}
