import { ExternalLink } from 'lucide-react'

interface LinkPreviewProps {
  preview: {
    url: string
    title?: string
    description?: string
    image?: string
    domain?: string
  } | null
}

export function LinkPreview({ preview }: LinkPreviewProps) {
  if (!preview) return null

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-border overflow-hidden hover:shadow-md transition-all duration-200 group"
    >
      {preview.image && (
        <div className="w-full max-h-48 overflow-hidden">
          <img
            src={preview.image}
            alt={preview.title || ''}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-3 space-y-1">
        {preview.title && (
          <p className="text-sm font-semibold text-foreground line-clamp-2">{preview.title}</p>
        )}
        {preview.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>
        )}
        {preview.domain && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span>{preview.domain}</span>
          </div>
        )}
      </div>
    </a>
  )
}
