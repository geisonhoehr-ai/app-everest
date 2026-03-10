import { useState, useEffect } from 'react'
import { Bold, Italic, List, Code, Link2, FunctionSquare, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { communityService, type CommunitySpace } from '@/services/communityService'
import { logger } from '@/lib/logger'
import { AttachmentUploader } from './AttachmentUploader'
import { PollCreator } from './PollCreator'

interface PostEditorProps {
  spaces: CommunitySpace[]
  defaultSpaceId?: string
  onSuccess: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PostType = 'text' | 'question' | 'poll'

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'question', label: 'Pergunta' },
  { value: 'poll', label: 'Enquete' },
]

export function PostEditor({ spaces, defaultSpaceId, onSuccess, open, onOpenChange }: PostEditorProps) {
  const { getUserId } = useAuth()
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [spaceId, setSpaceId] = useState(defaultSpaceId || '')
  const [type, setType] = useState<PostType>('text')
  const [attachments, setAttachments] = useState<File[]>([])
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [submitting, setSubmitting] = useState(false)
  const [wordFilter, setWordFilter] = useState<{ word: string }[]>([])

  // Load word filter on mount
  useEffect(() => {
    communityService.getWordFilter()
      .then(setWordFilter)
      .catch(() => {})
  }, [])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle('')
      setContent('')
      setSpaceId(defaultSpaceId || '')
      setType('text')
      setAttachments([])
      setPollOptions(['', ''])
    }
  }, [open, defaultSpaceId])

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('post-content') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const before = content.substring(0, start)
    const after = content.substring(end)

    const newContent = `${before}${prefix}${selectedText}${suffix}${after}`
    setContent(newContent)

    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      textarea.focus()
      const cursorPos = start + prefix.length + selectedText.length + suffix.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    })
  }

  const handleSubmit = async () => {
    const userId = getUserId()
    if (!userId) return

    // Validation
    if (!title.trim()) {
      toast({ title: 'Titulo obrigatorio', description: 'Insira um titulo para o post.', variant: 'destructive' })
      return
    }
    if (!content.trim()) {
      toast({ title: 'Conteudo obrigatorio', description: 'Insira o conteudo do post.', variant: 'destructive' })
      return
    }
    if (!spaceId) {
      toast({ title: 'Espaco obrigatorio', description: 'Selecione um espaco.', variant: 'destructive' })
      return
    }
    if (type === 'poll') {
      const validOptions = pollOptions.filter((o) => o.trim())
      if (validOptions.length < 2) {
        toast({ title: 'Enquete invalida', description: 'Adicione pelo menos 2 opcoes.', variant: 'destructive' })
        return
      }
    }

    // Word filter check
    const flaggedInTitle = communityService.checkWordFilter(title, wordFilter)
    const flaggedInContent = communityService.checkWordFilter(content, wordFilter)
    const allFlagged = [...flaggedInTitle, ...flaggedInContent]

    if (allFlagged.length > 0) {
      toast({
        title: 'Conteudo inadequado',
        description: `Palavras nao permitidas detectadas: ${allFlagged.join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const post = await communityService.createPost({
        title: title.trim(),
        content: content.trim(),
        space_id: spaceId,
        user_id: userId,
        type,
      })

      // Create poll options if applicable
      if (type === 'poll') {
        const validOptions = pollOptions.filter((o) => o.trim())
        if (validOptions.length >= 2) {
          await communityService.createPoll(post.id, validOptions)
        }
      }

      // Upload attachments
      if (attachments.length > 0) {
        for (const file of attachments) {
          await communityService.uploadAttachment(file, spaceId, post.id)
        }
      }

      toast({ title: 'Post criado!', description: 'Seu post foi publicado com sucesso.' })
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      logger.error('Failed to create post', error)
      toast({ title: 'Erro ao criar post', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Novo Post</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Compartilhe algo com a comunidade
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <Input
            placeholder="Titulo do post"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base"
          />

          {/* Space + Type */}
          <div className="flex gap-3">
            <Select value={spaceId} onValueChange={setSpaceId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um espaco" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 border border-border rounded-md px-1">
              {POST_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setType(pt.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded transition-colors',
                    type === pt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Markdown toolbar */}
          <div className="flex items-center gap-1 border border-border rounded-md p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => insertMarkdown('**', '**')}
              title="Negrito"
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => insertMarkdown('*', '*')}
              title="Italico"
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => insertMarkdown('\n- ')}
              title="Lista"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => insertMarkdown('```\n', '\n```')}
              title="Codigo"
            >
              <Code className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => insertMarkdown('[', '](url)')}
              title="Link"
            >
              <Link2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => insertMarkdown('$', '$')}
              title="Matematica"
            >
              <FunctionSquare className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Content textarea */}
          <Textarea
            id="post-content"
            placeholder="Escreva o conteudo do seu post..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[160px] resize-y"
          />

          {/* Poll creator */}
          {type === 'poll' && (
            <PollCreator options={pollOptions} onOptionsChange={setPollOptions} />
          )}

          {/* Attachment uploader */}
          <AttachmentUploader
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Publicando...
              </>
            ) : (
              'Publicar'
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
