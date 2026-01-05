import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { Upload, Send, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { submitEssay } from '@/services/essayService'

export default function EssaySubmissionPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para enviar uma redação.',
        variant: 'destructive',
      })
      return
    }

    const formData = new FormData(e.currentTarget)
    const theme = formData.get('theme') as string
    const text = formData.get('essay-text') as string

    if (!text && !file) {
      toast({
        title: 'Erro de validação',
        description: 'Digite o texto ou envie um arquivo.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      await submitEssay(user.id, theme, text, file || undefined)

      toast({
        title: 'Redação Enviada com Sucesso!',
        description: 'Você será notificado quando a correção estiver pronta.',
      })
      navigate('/redacoes')
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar sua redação. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho máximo é 5MB.',
          variant: 'destructive'
        })
        e.target.value = ''
        return
      }
      setFile(selectedFile)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar Nova Redação</CardTitle>
        <CardDescription>
          Digite o tema, cole seu texto ou faça o upload do arquivo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema da Redação</Label>
            <Input
              id="theme"
              name="theme"
              placeholder="Ex: Inteligência Artificial e o Futuro do Trabalho"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="essay-text">Sua Redação</Label>
            <Textarea
              id="essay-text"
              name="essay-text"
              placeholder="Digite ou cole sua redação aqui..."
              rows={15}
            />
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou</span>
            </div>
          </div>
          <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Folha de Redação Modelo</Label>
                <p className="text-sm text-muted-foreground">
                  Baixe a folha oficial para imprimir e escrever sua redação à mão.
                </p>
              </div>
              <Button asChild variant="outline" className="gap-2">
                <a href="/modelo-redacao.pdf" download="Folha_Redacao_Everest.pdf" target="_blank" rel="noopener noreferrer">
                  <Upload className="h-4 w-4 rotate-180" /> {/* Using Upload rotated as Download since Download icon is not imported yet, or we can import Download */}
                  Baixar Modelo
                </a>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Fazer upload de arquivo (Foto ou PDF)</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="cursor-pointer file:cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PDF, DOCX, Imagens. Tamanho máximo: 5MB.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para Correção
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
