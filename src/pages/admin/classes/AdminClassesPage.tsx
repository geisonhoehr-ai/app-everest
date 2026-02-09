import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logger } from '@/lib/logger'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  GraduationCap,
  Users,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Lock,
  Settings,
  TrendingUp,
  BookOpen,
  Calendar,
  UserCheck,
  Shield,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/hooks/use-toast'
import { 
  getClasses, 
  createClass, 
  type Class 
} from '@/services/classService'

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      const data = await getClasses()
      setClasses(data)
    } catch (error) {
      logger.error('Erro ao carregar turmas:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as turmas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }


  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/10 border-green-500/20 text-green-600">
            Ativa
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-orange-500/10 border-orange-500/20 text-orange-600">
            Inativa
          </Badge>
        )
      case 'archived':
        return (
          <Badge className="bg-gray-500/10 border-gray-500/20 text-gray-600">
            Arquivada
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return <SectionLoader />
  }

  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0)
  const activeClasses = classes.filter(c => c.status === 'active').length

  return (
    <MagicLayout
      title="Gestão de Turmas"
      description="Gerencie turmas, matricule alunos e configure permissões de acesso"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <MagicCard variant="glass" className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{classes.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Total de Turmas</div>
              </div>
            </div>
          </MagicCard>

          <MagicCard variant="glass" className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{activeClasses}</div>
                <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Turmas Ativas</div>
              </div>
            </div>
          </MagicCard>

          <MagicCard variant="glass" className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{totalStudents}</div>
                <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Alunos Matriculados</div>
              </div>
            </div>
          </MagicCard>

          <MagicCard variant="glass" className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{Math.round(totalStudents / (classes.length || 1))}</div>
                <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Média por Turma</div>
              </div>
            </div>
          </MagicCard>
        </div>

        {/* Actions */}
        <MagicCard variant="glass" size="lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar turmas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-gradient-to-r from-primary to-primary/80 w-full md:w-auto" asChild>
              <Link to="/admin/classes/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Nova Turma
              </Link>
            </Button>
          </div>
        </MagicCard>

        {/* Table */}
        <MagicCard variant="glass" size="lg">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead className="hidden lg:table-cell">Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
                        <div>
                          <p className="font-medium text-muted-foreground">Nenhuma turma encontrada</p>
                          <p className="text-sm text-muted-foreground/60">
                            {searchTerm ? 'Tente outra busca' : 'Comece criando uma nova turma'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClasses.map((classItem) => (
                    <TableRow key={classItem.id} className="group hover:bg-primary/5">
                      <TableCell>
                        <div>
                          <div className="font-medium group-hover:text-primary transition-colors">
                            {classItem.name}
                          </div>
                          {classItem.description && (
                            <div className="text-sm text-muted-foreground">
                              {classItem.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getStatusBadge(classItem.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{classItem.student_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(classItem.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 group/btn"
                            asChild
                          >
                            <Link to={`/admin/classes/${classItem.id}/students`}>
                              <UserCheck className="h-4 w-4 group-hover/btn:text-primary transition-colors" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 group/btn"
                            asChild
                          >
                            <Link to={`/admin/permissions?classId=${classItem.id}`}>
                              <Lock className="h-4 w-4 group-hover/btn:text-primary transition-colors" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 group/btn"
                            asChild
                          >
                            <Link to={`/admin/classes/${classItem.id}/edit`}>
                              <Edit className="h-4 w-4 group-hover/btn:text-primary transition-colors" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </MagicCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <MagicCard variant="glass" className="p-6 hover:scale-105 transition-transform cursor-pointer">
            <Link to="/admin/management" className="block">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-semibold mb-1">Gerenciar Alunos</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Adicionar e remover alunos das turmas
                  </p>
                </div>
              </div>
            </Link>
          </MagicCard>

          <MagicCard variant="glass" className="p-6 hover:scale-105 transition-transform cursor-pointer">
            <Link to="/admin/permissions" className="block">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                  <Lock className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-semibold mb-1">Permissões</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Configurar acesso aos recursos
                  </p>
                </div>
              </div>
            </Link>
          </MagicCard>

          <MagicCard variant="glass" className="p-6 hover:scale-105 transition-transform cursor-pointer">
            <Link to="/admin/reports" className="block">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-semibold mb-1">Relatórios</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Ver desempenho das turmas
                  </p>
                </div>
              </div>
            </Link>
          </MagicCard>
        </div>
      </div>
    </MagicLayout>
  )
}

