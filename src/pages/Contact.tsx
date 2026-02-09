import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

export default function ContactPage() {
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    toast({
      title: 'Mensagem Enviada!',
      description: 'Agradecemos seu contato. Nossa equipe responderá em breve.',
    })
    e.currentTarget.reset()
  }

  return (
    <div className="bg-background">
      <div className="container py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Entre em Contato
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tem alguma dúvida ou sugestão? Preencha o formulário abaixo e nossa
            equipe responderá o mais breve possível.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto space-y-6 p-8 border rounded-lg shadow-sm bg-card"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Seu nome completo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input id="subject" placeholder="Sobre o que você quer falar?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem aqui..."
              rows={6}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Enviar Mensagem
          </Button>
        </form>
      </div>
    </div>
  )
}
