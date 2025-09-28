import { Link } from 'react-router-dom'
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
import {
  MoreHorizontal,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Settings,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const mockEssayPrompts = [
  {
    id: 1,
    theme: 'Inteligência Artificial e o Futuro do Trabalho',
    submissions: 3,
    status: 'Aberto',
  },
  {
    id: 2,
    theme: 'A Persistência da Violência Contra a Mulher na Sociedade',
    submissions: 15,
    status: 'Aberto',
  },
  {
    id: 3,
    theme: 'Desafios da Educação a Distância no Brasil',
    submissions: 22,
    status: 'Fechado',
  },
]

export default function AdminEssaysPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Temas de Redação</CardTitle>
          <CardDescription>
            Crie e gerencie os temas de redação disponíveis para os alunos.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/essays/settings">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/essays/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Tema
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tema</TableHead>
              <TableHead>Envios</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEssayPrompts.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell className="font-medium">{prompt.theme}</TableCell>
                <TableCell>{prompt.submissions}</TableCell>
                <TableCell>
                  <Badge
                    variant={prompt.status === 'Aberto' ? 'default' : 'outline'}
                  >
                    {prompt.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/essays/${prompt.id}/submissions`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Envios
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/essays/${prompt.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar Tema
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar Tema
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
