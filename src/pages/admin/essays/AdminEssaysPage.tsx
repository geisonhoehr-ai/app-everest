import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  FileText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  getAllEssayPrompts,
  deleteEssayPrompt,
  type AdminEssayPrompt,
} from '@/services/adminEssayService'
import { useToast } from '@/hooks/use-toast'
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
      toast({ title: 'Erro ao carregar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  const handleDelete = async (promptId: string) => {
    try {
      await deleteEssayPrompt(promptId)
      toast({ title: 'Tema deletado com sucesso' })
      loadPrompts()
    } catch (error) {
      logger.error('Error deleting prompt:', error)
      toast({ title: 'Erro ao deletar', variant: 'destructive' })
    }
  }

  if (loading) return <SectionLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Temas de Redação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie os temas disponíveis para os alunos
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/essays/settings">
              <Settings className="h-4 w-4" />
              Configurações
            </Link>
          </Button>
          <Button asChild className="gap-2 transition-all duration-200 hover:shadow-md hover:bg-green-600">
            <Link to="/admin/essays/new">
              <PlusCircle className="h-4 w-4" />
              Novo Tema
            </Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {prompts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Nenhum tema criado</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Crie o primeiro tema de redação para seus alunos.
              </p>
              <Button asChild className="gap-2">
                <Link to="/admin/essays/new">
                  <PlusCircle className="h-4 w-4" />
                  Criar Primeiro Tema
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tema</TableHead>
                    <TableHead>Envios</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prompts.map((prompt) => (
                    <TableRow key={prompt.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {prompt.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{prompt.submissions_count || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={prompt.is_active ? 'default' : 'outline'}>
                          {prompt.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
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
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deletar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deletar tema?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{prompt.title}" será deletado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(prompt.id)}>
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
