import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, Video } from 'lucide-react'
import type { LiveEventProvider } from '@/services/liveEventService'

interface LivePlayerEmbedProps {
  provider: LiveEventProvider
  streamUrl: string
  title: string
}

export function LivePlayerEmbed({ provider, streamUrl, title }: LivePlayerEmbedProps) {
  if (provider === 'meet') {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">
              Esta aula acontece no Google Meet. Clique no botão abaixo para entrar.
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => window.open(streamUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4" />
            Entrar na Aula
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-black">
      <iframe
        src={streamUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
