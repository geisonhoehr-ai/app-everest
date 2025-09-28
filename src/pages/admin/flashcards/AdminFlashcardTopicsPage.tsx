import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, PlusCircle, ArrowLeft } from 'lucide-react'
import { flashcardData } from '@/lib/flashcard-data'

export default function AdminFlashcardTopicsPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const subject = flashcardData.find((s) => s.id === subjectId)

  if (!subject) {
    return <div>Matéria não encontrada.</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/admin/flashcards')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Tópicos de {subject.name}</CardTitle>
              <CardDescription>
                Gerencie os tópicos e seus flashcards.
              </CardDescription>
            </div>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Tópico
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título do Tópico</TableHead>
              <TableHead>Nº de Cards</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subject.topics.map((topic) => (
              <TableRow key={topic.id}>
                <TableCell className="font-medium">{topic.title}</TableCell>
                <TableCell>{topic.cardCount}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/flashcards/${subjectId}/${topic.id}`}>
                          Gerenciar Cards
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Editar Tópico</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Deletar Tópico
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
