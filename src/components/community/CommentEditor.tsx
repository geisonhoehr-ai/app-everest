import { useState, useEffect } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { communityService } from '@/services/communityService'
import { logger } from '@/lib/logger'
import { AttachmentUploader } from './AttachmentUploader'

interface CommentEditorProps {
  postId: string
  parentCommentId?: string
  onSuccess: () => void
  autoFocus?: boolean
}

export function CommentEditor({ postId, parentCommentId, onSuccess, autoFocus }: CommentEditorProps) {
  const { profile, getUserId, getInitials } = useAuth()
  const { toast } = useToast()

  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [wordFilter, setWordFilter] = useState<{ word: string }[]>([])

  // Load word filter
  useEffect(() => {
    communityService.getWordFilter()
      .then(setWordFilter)
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    const userId = getUserId()
    if (!userId || !content.trim()) return

    // Check mute status
    const muteStatus = await communityService.isUserMuted(userId)
    if (muteStatus.muted) {
      toast({
        title: 'Voce esta silenciado',
        description: `Voce nao pode comentar ate ${new Date(muteStatus.until!).toLocaleString('pt-BR')}.`,
        variant: 'destructive',
      })
      return
    }

    // Word filter check
    const flagged = communityService.checkWordFilter(content, wordFilter)
    if (flagged.length > 0) {
      toast({
        title: 'Conteudo inadequado',
        description: `Palavras nao permitidas: ${flagged.join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const comment = await communityService.createComment({
        post_id: postId,
        content: content.trim(),
        user_id: userId,
        parent_comment_id: parentCommentId,
      })

      // Upload attachments
      if (attachments.length > 0) {
        for (const file of attachments) {
          await communityService.uploadAttachment(file, 'comments', comment.id)
        }
      }

      setContent('')
      setAttachments([])
      onSuccess()
    } catch (error) {
      logger.error('Failed to create comment', error)
      toast({ title: 'Erro ao comentar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <Textarea
          placeholder={parentCommentId ? 'Escreva sua resposta...' : 'Escreva um comentario...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] resize-y"
          autoFocus={autoFocus}
        />

        <AttachmentUploader
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          maxFiles={3}
        />

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            size="sm"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Comentar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
