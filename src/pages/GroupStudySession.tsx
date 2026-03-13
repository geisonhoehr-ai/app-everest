import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Users, Construction } from 'lucide-react'

export default function GroupStudySessionPage() {
  const { sessionId } = useParams()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/flashcards"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessao de Estudo em Grupo</h1>
          <p className="text-sm text-muted-foreground mt-1">Estude com seus colegas em tempo real</p>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Construction className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Em Breve</h3>
            <p className="text-muted-foreground mb-6">
              As sessoes de estudo em grupo estao sendo desenvolvidas.
              Em breve voce podera estudar flashcards com seus colegas em tempo real.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/flashcards">
                <Users className="h-4 w-4" />
                Ir para Flashcards
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
