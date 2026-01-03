import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PlusCircle, Users, Play, Edit, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Assuming currentUser.id is 'user-self' for demonstration purposes
const currentUserId = 'user-self'

const mockSets = [
  {
    id: 'set1',
    name: 'Revolução Industrial - Collab',
    description: 'Set de flashcards para a prova de História.',
    owner: {
      name: 'João Pedro',
      id: 'user-self',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=10',
    },
    permission: 'owner',
    collaboratorsCount: 3,
    cardCount: 42,
  },
  {
    id: 'set2',
    name: 'Fórmulas de Física II',
    description: 'Apenas minhas fórmulas.',
    owner: {
      name: 'João Pedro',
      id: 'user-self',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=10',
    },
    permission: 'owner',
    collaboratorsCount: 0,
    cardCount: 89,
  },
  {
    id: 'set3',
    name: 'Conceitos de Biologia Celular',
    description: 'Compartilhado por Ana Clara.',
    owner: {
      name: 'Ana Clara',
      id: 'user-other',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=5',
    },
    permission: 'editor',
    collaboratorsCount: 2,
    cardCount: 67,
  },
  {
    id: 'set4',
    name: 'História da Arte',
    description: 'Compartilhado por Lucas Mendes.',
    owner: {
      name: 'Lucas Mendes',
      id: 'user-other-2',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=6',
    },
    permission: 'viewer',
    collaboratorsCount: 5,
    cardCount: 120,
  },
]

export default function MyFlashcardSetsPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Meus Conjuntos de Flashcards</CardTitle>
          <CardDescription>
            Crie, estude e colabore em conjuntos de flashcards.
          </CardDescription>
        </div>
        <Button asChild>
          <Link to="/conjuntos/novo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Conjunto
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockSets.map((set) => {
          const isOwner = set.owner.id === currentUserId
          const canEdit = isOwner || set.permission === 'editor'

          return (
            <Card key={set.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{set.name}</CardTitle>
                  {isOwner ? (
                    <Badge>Meu</Badge>
                  ) : (
                    <Badge variant="secondary">Compartilhado</Badge>
                  )}
                </div>
                <CardDescription>{set.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>{set.cardCount} cards</p>
                  {!isOwner && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={set.owner.avatar} />
                        <AvatarFallback>
                          {set.owner.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        Criado por <strong>{set.owner.name}</strong>
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{set.collaboratorsCount} Colaboradores</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 items-stretch">
                <div className="flex gap-2">
                  <Button className="flex-1" asChild>
                    <Link to={`/conjuntos/${set.id}/estudo-em-grupo`}>
                      <Play className="mr-2 h-4 w-4" /> Estudar
                    </Link>
                  </Button>
                  {canEdit && (
                    <Button variant="outline" asChild>
                      <Link to={`/conjuntos/${set.id}/editar`}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </Link>
                    </Button>
                  )}
                </div>
                {isOwner && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/conjuntos/${set.id}/colaboradores`}>
                      <Share2 className="mr-2 h-4 w-4" /> Gerenciar
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
