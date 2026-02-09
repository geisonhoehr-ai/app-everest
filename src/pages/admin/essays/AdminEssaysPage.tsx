import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { logger } from '@/lib/logger'
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
import { getAllEssayPrompts, deleteEssayPrompt, type AdminEssayPrompt } from '@/services/adminEssayService'
import { useToast } from '@/components/ui/use-toast'
import { SectionLoader } from '@/components/SectionLoader'

export default function AdminEssaysPage() {
  const [prompts, setPrompts] = useState<AdminEssayPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadPrompts = async () => {
    try {
      setLoading(true)
      const data = await getAllEssayPrompts()
      setPrompts(data)
    } catch (error) {
      logger.error('Erro ao carregar temas:', error)
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os temas de redação.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  const handleDelete = async (promptId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja deletar o tema "${title}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      await deleteEssayPrompt(promptId)
      toast({
        title: 'Tema deletado',
        description: 'O tema foi deletado com sucesso.',
      })
      loadPrompts()
    } catch (error) {
      logger.error('Error deleting prompt:', error)
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar o tema. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <SectionLoader />
  }

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
            {prompts.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell className="font-medium">{prompt.title}</TableCell>
                <TableCell>{prompt.submissions_count || 0}</TableCell>
                <TableCell>
                  <Badge
                    variant={prompt.is_active ? 'default' : 'outline'}
                  >
                    {prompt.is_active ? 'Ativo' : 'Inativo'}
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
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(prompt.id, prompt.title)}
                      >
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
