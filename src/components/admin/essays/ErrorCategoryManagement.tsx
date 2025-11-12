import { useEffect, useState } from 'react'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  getErrorCategories,
  createErrorCategory,
  updateErrorCategory,
  deleteErrorCategory,
  type ErrorCategory,
} from '@/services/essaySettingsService'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const ErrorCategoryManagement = () => {
  const [categories, setCategories] = useState<ErrorCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<
    Partial<ErrorCategory>
  >({})
  const { toast } = useToast()

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const data = await getErrorCategories()
      setCategories(data)
    } catch (error) {
      toast({ title: 'Erro ao buscar categorias', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleOpenDialog = (category: ErrorCategory | null = null) => {
    setCurrentCategory(category || { name: '', description: '' })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteErrorCategory(id)
      toast({ title: 'Categoria deletada com sucesso' })
      fetchCategories()
    } catch (error) {
      toast({ title: 'Erro ao deletar categoria', variant: 'destructive' })
    }
  }

  const handleSubmit = async () => {
    if (!currentCategory.name) return
    try {
      if (currentCategory.id) {
        await updateErrorCategory(currentCategory.id, currentCategory)
        toast({ title: 'Categoria atualizada com sucesso' })
      } else {
        await createErrorCategory({
          name: currentCategory.name,
          description: currentCategory.description,
        })
        toast({ title: 'Categoria criada com sucesso' })
      }
      fetchCategories()
      setIsDialogOpen(false)
    } catch (error) {
      toast({ title: 'Erro ao salvar categoria', variant: 'destructive' })
    }
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentCategory.id ? 'Editar' : 'Nova'} Categoria de Erro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={currentCategory.name || ''}
                onChange={(e) =>
                  setCurrentCategory({
                    ...currentCategory,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={currentCategory.description || ''}
                onChange={(e) =>
                  setCurrentCategory({
                    ...currentCategory,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Categorias de Erro</CardTitle>
            <CardDescription>
              Gerencie os tipos de erro para correção.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Categoria
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleOpenDialog(cat)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(cat.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Deletar
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
    </>
  )
}
