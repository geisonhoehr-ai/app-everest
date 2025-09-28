import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Share2, Twitter, MessageSquare } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ShareResultsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  topicTitle: string
  correct: number
  total: number
}

export const ShareResultsDialog = ({
  isOpen,
  onOpenChange,
  topicTitle,
  correct,
  total,
}: ShareResultsDialogProps) => {
  const { toast } = useToast()
  const shareText = `Concluí uma sessão de flashcards sobre "${topicTitle}" e acertei ${correct} de ${total} cards! Rumo à aprovação com a Everest Preparatórios! #EverestPreparatorios #Flashcards #Estudos`
  const shareUrl = window.location.href

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Resultados da minha sessão de estudos!',
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.error('Erro ao compartilhar:', error)
        toast({
          title: 'Erro ao compartilhar',
          description:
            'Não foi possível abrir a caixa de diálogo de compartilhamento.',
          variant: 'destructive',
        })
      }
    } else {
      toast({
        title: 'Compartilhamento nativo não suportado',
        description: 'Use uma das opções abaixo.',
      })
    }
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhe seu Progresso!</DialogTitle>
          <DialogDescription>
            Mostre aos seus amigos sua dedicação e seus resultados.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {navigator.share && (
            <Button onClick={handleNativeShare} size="lg">
              <Share2 className="mr-2 h-5 w-5" />
              Compartilhar...
            </Button>
          )}
          <Button asChild variant="outline" size="lg">
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
              <Twitter className="mr-2 h-5 w-5 text-[#1DA1F2]" />
              Compartilhar no Twitter
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="mr-2 h-5 w-5 text-[#25D366]" />
              Compartilhar no WhatsApp
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
