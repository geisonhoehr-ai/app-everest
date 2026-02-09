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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  getCriteriaTemplates,
  createCriteriaTemplate,
  updateCriteriaTemplate,
  deleteCriteriaTemplate,
  type CriteriaTemplate,
} from '@/services/essaySettingsService'
import { CriteriaTemplateForm } from './CriteriaTemplateForm'

export const CriteriaTemplateManagement = () => {
  const [templates, setTemplates] = useState<CriteriaTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] =
    useState<CriteriaTemplate | null>(null)
  const { toast } = useToast()

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const data = await getCriteriaTemplates()
      setTemplates(data)
    } catch (error) {
      toast({ title: 'Erro ao buscar templates', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleOpenDialog = (template: CriteriaTemplate | null = null) => {
    setSelectedTemplate(template)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCriteriaTemplate(id)
      toast({ title: 'Template deletado com sucesso' })
      fetchTemplates()
    } catch (error) {
      toast({ title: 'Erro ao deletar template', variant: 'destructive' })
    }
  }

  const handleSubmit = async (values: any) => {
    const criteriaJson = { competencies: values.competencies }
    try {
      if (selectedTemplate) {
        await updateCriteriaTemplate(selectedTemplate.id, {
          ...values,
          criteria: criteriaJson,
        })
        toast({ title: 'Template atualizado com sucesso' })
      } else {
        await createCriteriaTemplate({ ...values, criteria: criteriaJson })
        toast({ title: 'Template criado com sucesso' })
      }
      fetchTemplates()
      setIsDialogOpen(false)
    } catch (error) {
      toast({ title: 'Erro ao salvar template', variant: 'destructive' })
    }
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar' : 'Novo'} Template de Critérios
            </DialogTitle>
          </DialogHeader>
          <CriteriaTemplateForm
            template={selectedTemplate}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Templates de Critérios</CardTitle>
            <CardDescription>Gerencie os modelos de avaliação.</CardDescription>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Template
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
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(template.id)}
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
