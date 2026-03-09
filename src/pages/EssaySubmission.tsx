import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Upload, Send, Loader2, Download, FileText } from 'lucide-react'
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
      toast({ title: 'Erro', description: 'Você precisa estar logado.', variant: 'destructive' })
      return
    }

    const formData = new FormData(e.currentTarget)
    const theme = formData.get('theme') as string
    const text = formData.get('essay-text') as string

    if (!text && !file) {
      toast({ title: 'Erro', description: 'Digite o texto ou envie um arquivo.', variant: 'destructive' })
      return
    }

    try {
      setLoading(true)
      await submitEssay(user.id, theme, text, file || undefined)
      toast({ title: 'Redação enviada!', description: 'Você será notificado quando a correção estiver pronta.' })
      navigate('/redacoes')
    } catch {
      toast({ title: 'Erro ao enviar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: 'Máximo 5MB.', variant: 'destructive' })
        e.target.value = ''
        return
      }
      setFile(selectedFile)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/redacoes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Enviar Nova Redação</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Digite o tema, cole seu texto ou faça upload do arquivo
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Tema da Redação *</Label>
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
                className="resize-y"
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            {/* Model download */}
            <div className="rounded-lg border border-border p-4 bg-muted/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Folha de Redação Modelo</p>
                  <p className="text-xs text-muted-foreground">
                    Baixe a folha oficial para escrever à mão
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
                <a href="/modelo-redacao.pdf" download="Folha_Redacao_Everest.pdf" target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Baixar
                </a>
              </Button>
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload de arquivo (Foto ou PDF)</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="cursor-pointer file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, Imagens. Máximo: 5MB.
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="gap-2 transition-all duration-200 hover:shadow-md hover:bg-green-600">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar para Correção
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
