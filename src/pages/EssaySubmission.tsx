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
import { useToast } from '@/components/ui/use-toast'
import { useNavigate } from 'react-router-dom'
import { Upload, Send } from 'lucide-react'

export default function EssaySubmissionPage() {
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    toast({
      title: 'Redação Enviada com Sucesso!',
      description: 'Você será notificado quando a correção estiver pronta.',
    })
    navigate('/redacoes')
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
              placeholder="Ex: Inteligência Artificial e o Futuro do Trabalho"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="essay-text">Sua Redação</Label>
            <Textarea
              id="essay-text"
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
          <div className="space-y-2">
            <Label htmlFor="file-upload">Fazer upload de arquivo</Label>
            <Input id="file-upload" type="file" />
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PDF, DOCX. Tamanho máximo: 5MB.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              Enviar para Correção
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
