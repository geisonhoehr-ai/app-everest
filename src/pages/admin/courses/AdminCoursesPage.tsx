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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  PlusCircle,
  Pencil,
  Trash2,
  ListVideo,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Cursos</CardTitle>
          <CardDescription>
            Adicione, edite ou remova cursos da plataforma.
          </CardDescription>
        </div>
        <Button asChild>
          <Link to="/admin/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Curso
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Módulos</TableHead>
              <TableHead>Aulas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.modules}</TableCell>
                <TableCell>{course.lessons}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      course.status === 'Published' ? 'default' : 'outline'
                    }
                  >
                    {course.status === 'Published' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/courses/${course.id}/content`}>
                          <ListVideo className="mr-2 h-4 w-4" />
                          Gerenciar Conteúdo
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/courses/${course.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar Detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
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
      </CardContent>
    </Card>
  )
}
