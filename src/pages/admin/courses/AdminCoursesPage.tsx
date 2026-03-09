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
  Award
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getAllCourses, deleteCourse, type AdminCourse } from '@/services/adminCourseService'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { SectionLoader } from '@/components/SectionLoader'

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [totalStudents, setTotalStudents] = useState(0)
  const { toast } = useToast()

  const loadCourses = async () => {
    try {
      setLoading(true)
      const [data, studentsResult] = await Promise.all([
        getAllCourses(),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student')
      ])
      setCourses(data)
      setTotalStudents(studentsResult.count || 0)
    } catch (error) {
      logger.error('Erro ao carregar cursos:', error)
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os cursos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const handleDelete = async (courseId: string, courseName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o curso "${courseName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      await deleteCourse(courseId)
      toast({
        title: 'Curso deletado',
        description: 'O curso foi deletado com sucesso.',
      })
      loadCourses()
    } catch (error) {
      logger.error('Error deleting course:', error)
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar o curso. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <SectionLoader />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Cursos</h1>
        <p className="text-muted-foreground mt-1">Adicione, edite ou remova cursos da plataforma</p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-muted/50">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Gerenciar Cursos
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      Adicione, edite ou remova cursos da plataforma
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="px-6 py-3 rounded-xl font-semibold"
                >
                  <Link to="/admin/courses/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Curso
                  </Link>
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <BookOpen className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Cursos</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Play className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {courses.filter(c => c.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Publicados</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {totalStudents.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-muted-foreground">Estudantes</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Award className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">&mdash;</div>
                  <div className="text-sm text-muted-foreground">Avaliacao Media</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">Lista de Cursos</h2>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Titulo</TableHead>
                      <TableHead className="font-semibold">Modulos</TableHead>
                      <TableHead className="font-semibold">Aulas</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">
                        <span className="sr-only">Acoes</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum curso encontrado. Crie seu primeiro curso!
                        </TableCell>
                      </TableRow>
                    ) : (
                      courses.map((course) => (
                        <TableRow
                          key={course.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{course.name}</div>
                                <div className="text-sm text-muted-foreground">ID: {course.id.substring(0, 8)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ListVideo className="h-4 w-4 text-muted-foreground" />
                              {course.modules_count || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Play className="h-4 w-4 text-muted-foreground" />
                              {course.lessons_count || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={course.is_active ? 'default' : 'outline'}
                              className={cn(
                                "font-semibold",
                                course.is_active
                                  ? "bg-green-500/100 text-white"
                                  : "border-orange-300 text-orange-600 bg-orange-500/10"
                              )}
                            >
                              {course.is_active ? 'Publicado' : 'Rascunho'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                  className="hover:bg-muted"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/courses/${course.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar Curso
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/courses/${course.id}/classes`}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Gerenciar Turmas
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(course.id, course.name)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deletar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
