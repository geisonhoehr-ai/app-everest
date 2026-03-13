import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Users, Construction } from 'lucide-react'

export default function FlashcardSetCollaboratorsPage() {
  const { setId } = useParams()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/meus-conjuntos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Colaboradores</h1>
          <p className="text-sm text-muted-foreground mt-1">Convide e gerencie quem pode ver e editar este conjunto</p>
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
              O sistema de colaboradores esta sendo desenvolvido.
              Em breve voce podera convidar amigos para editar e estudar em conjunto.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/meus-conjuntos">
                <Users className="h-4 w-4" />
                Voltar aos Conjuntos
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
