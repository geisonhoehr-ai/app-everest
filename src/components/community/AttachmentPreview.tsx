import { FileText, Download, Film, Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CommunityAttachment } from '@/services/communityService'

interface AttachmentPreviewProps {
  attachments: CommunityAttachment[]
  compact?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentPreview({ attachments, compact = false }: AttachmentPreviewProps) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className={cn('flex gap-2 flex-wrap', compact ? 'flex-row' : 'flex-col')}>
      {attachments.map((attachment) => {
        const fileType = attachment.file_type || 'document'

        if (fileType === 'image') {
          return (
            <a
              key={attachment.id}
              href={attachment.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={attachment.file_url}
                alt={attachment.file_name}
                className={cn(
                  'rounded-lg object-cover border border-border hover:opacity-90 transition-opacity',
                  compact ? 'max-h-24 max-w-24' : 'max-h-48 max-w-full'
                )}
              />
            </a>
          )
        }

        if (fileType === 'video') {
          if (compact) {
            return (
              <div
                key={attachment.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border"
              >
                <Film className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {attachment.file_name}
                </span>
              </div>
            )
          }
          return (
            <video
              key={attachment.id}
              src={attachment.file_url}
              controls
              className="max-h-64 rounded-lg border border-border w-full"
            >
              Seu navegador nao suporta video.
            </video>
          )
        }

        if (fileType === 'audio') {
          if (compact) {
            return (
              <div
                key={attachment.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border"
              >
                <Music className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {attachment.file_name}
                </span>
              </div>
            )
          }
          return (
            <div key={attachment.id} className="w-full">
              <audio src={attachment.file_url} controls className="w-full">
                Seu navegador nao suporta audio.
              </audio>
              <p className="text-xs text-muted-foreground mt-1">{attachment.file_name}</p>
            </div>
          )
        }

        // Document
        return (
          <a
            key={attachment.id}
            href={attachment.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
          >
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground truncate">{attachment.file_name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground shrink-0" />
          </a>
        )
      })}
    </div>
  )
}
