import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Share2,
  Twitter,
  MessageSquare,
  Copy,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

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
  const percentage = Math.round((correct / total) * 100)

  const getPerformanceEmoji = (percentage: number) => {
    if (percentage >= 90) return '🏆'
    if (percentage >= 80) return '⭐'
    if (percentage >= 70) return '🎯'
    if (percentage >= 60) return '📚'
    return '💪'
  }

  const getPerformanceText = (percentage: number) => {
    if (percentage >= 90) return 'Desempenho Excepcional'
    if (percentage >= 80) return 'Excelente Resultado'
    if (percentage >= 70) return 'Bom Desempenho'
    if (percentage >= 60) return 'Resultado Regular'
    return 'Continue Praticando'
  }

  const emoji = getPerformanceEmoji(percentage)
  const performanceText = getPerformanceText(percentage)

  const shareText = `${emoji} Acabei de completar uma sessão de flashcards sobre "${topicTitle}"!

📊 Resultado: ${correct}/${total} cards (${percentage}%)
🎯 ${performanceText}

#EverestPreparatorios #Flashcards #Estudos #Aprovacao`

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
      toast({
        title: 'Copiado para a área de transferência!',
        description: 'Agora você pode colar em qualquer lugar.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o texto.',
        variant: 'destructive',
      })
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meus resultados de estudo!',
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.error('Erro ao compartilhar:', error)
        toast({
          title: 'Compartilhamento cancelado',
          description: 'Você pode usar as outras opções abaixo.',
        })
      }
    } else {
      toast({
        title: 'Compartilhamento nativo não disponível',
        description: 'Use uma das opções abaixo.',
      })
    }
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Compartilhe seu Progresso!
          </DialogTitle>
          <DialogDescription>
            Mostre aos seus amigos e colegas sua dedicação aos estudos e inspire outros a estudar também.
          </DialogDescription>
        </DialogHeader>

        {/* Preview Card */}
        <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-cyan-500/10 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">{emoji}</div>
              <div>
                <h3 className="text-xl font-bold">{topicTitle}</h3>
                <p className="text-muted-foreground">Sessão de Flashcards</p>
              </div>

              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold text-green-500">{correct}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Acertos</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-2xl font-bold text-red-500">{total - correct}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold text-primary">{percentage}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Precisão</p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "text-sm px-3 py-1",
                  percentage >= 90 && "bg-purple-500/10 text-purple-600 border-purple-500/20",
                  percentage >= 80 && percentage < 90 && "bg-green-500/10 text-green-600 border-green-500/20",
                  percentage >= 70 && percentage < 80 && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                  percentage >= 60 && percentage < 70 && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                  percentage < 60 && "bg-red-500/10 text-red-600 border-red-500/20"
                )}
              >
                {performanceText}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Share Options */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {typeof window !== 'undefined' && navigator.share && (
              <Button
                onClick={handleNativeShare}
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Compartilhar
              </Button>
            )}

            <Button onClick={handleCopyToClipboard} variant="outline" size="lg">
              <Copy className="mr-2 h-5 w-5" />
              Copiar Texto
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button asChild variant="outline" size="lg">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-2 h-5 w-5 text-[#25D366]" />
                WhatsApp
              </a>
            </Button>

            <Button asChild variant="outline" size="lg">
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
                <Twitter className="mr-2 h-5 w-5 text-[#1DA1F2]" />
                Twitter
              </a>
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          Compartilhar seus resultados motiva outros estudantes e mostra seu comprometimento! 🚀
        </div>
      </DialogContent>
    </Dialog>
  )
}
