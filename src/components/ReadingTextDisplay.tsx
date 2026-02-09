import { MagicCard } from '@/components/ui/magic-card'
import { BookOpen, User, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface ReadingText {
  id: string
  title?: string
  content: string
  content_html?: string
  author?: string
  source?: string
  word_count?: number
}

interface ReadingTextDisplayProps {
  text: ReadingText
  showStats?: boolean
}

export function ReadingTextDisplay({ text, showStats = true }: ReadingTextDisplayProps) {
  return (
    <MagicCard variant="glass" size="lg" className="mb-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10">
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {text.title || 'Texto para Interpretação'}
              </h3>
              {text.author && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <User className="h-3 w-3" />
                  <span>{text.author}</span>
                </div>
              )}
            </div>
          </div>

          {showStats && (
            <div className="flex items-center gap-2">
              {text.word_count && (
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {text.word_count} palavras
                </Badge>
              )}
              {text.source && (
                <Badge variant="outline">
                  {text.source}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {text.content_html ? (
            <div
              dangerouslySetInnerHTML={{ __html: text.content_html }}
              className="text-foreground/90 leading-relaxed"
            />
          ) : (
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {text.content}
            </p>
          )}
        </div>
      </div>
    </MagicCard>
  )
}
