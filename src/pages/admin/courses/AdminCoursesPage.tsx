import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  PlusCircle,
  Pencil,
  Trash2,
  ListVideo,
  BookOpen,
  Users,
  Play,
  Settings,
  Award
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const mockCourses = [
  {
    id: 'course1',
    title: 'Matemática para Concursos',
    modules: 8,
    lessons: 45,
    status: 'Published',
  },
  {
    id: 'course2',
    title: 'Redação Nota Mil',
    modules: 12,
    lessons: 60,
    status: 'Published',
  },
  {
    id: 'course3',
    title: 'História do Brasil',
    modules: 10,
    lessons: 38,
    status: 'Draft',
  },
]

export default function AdminCoursesPage() {
  return (
    <MagicLayout 
      title="Gerenciar Cursos"
      description="Adicione, edite ou remova cursos da plataforma"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Gerenciar Cursos
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Adicione, edite ou remova cursos da plataforma
                  </p>
                </div>
              </div>
              <Button 
                asChild
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Link to="/admin/courses/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Curso
                </Link>
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <BookOpen className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{mockCourses.length}</div>
                <div className="text-sm text-muted-foreground">Total de Cursos</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Play className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {mockCourses.filter(c => c.status === 'Published').length}
                </div>
                <div className="text-sm text-muted-foreground">Publicados</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">1,247</div>
                <div className="text-sm text-muted-foreground">Estudantes</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Award className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">4.8</div>
                <div className="text-sm text-muted-foreground">Avaliação Média</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Courses Table */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Lista de Cursos</h2>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Título</TableHead>
                    <TableHead className="font-semibold">Módulos</TableHead>
                    <TableHead className="font-semibold">Aulas</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCourses.map((course, index) => (
                    <TableRow 
                      key={course.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{course.title}</div>
                            <div className="text-sm text-muted-foreground">ID: {course.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ListVideo className="h-4 w-4 text-muted-foreground" />
                          {course.modules}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-muted-foreground" />
                          {course.lessons}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={course.status === 'Published' ? 'default' : 'outline'}
                          className={cn(
                            "font-semibold",
                            course.status === 'Published' 
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white" 
                              : "bg-gradient-to-r from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-600"
                          )}
                        >
                          {course.status === 'Published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              aria-haspopup="true" 
                              size="icon" 
                              variant="ghost"
                              className="hover:bg-muted/50"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="bg-card/95 backdrop-blur-sm border-border/50"
                          >
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/courses/${course.id}/content`} className="hover:bg-muted/50">
                                <ListVideo className="mr-2 h-4 w-4" />
                                Gerenciar Conteúdo
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/courses/${course.id}/edit`} className="hover:bg-muted/50">
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
