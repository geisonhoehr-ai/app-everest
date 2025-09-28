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
import { MoreHorizontal, PlusCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const mockSimulations = [
  {
    id: 1,
    name: 'Simulado Nacional - Humanas',
    date: '25/10/2025',
    status: 'Agendado',
  },
  {
    id: 2,
    name: 'Simulado ENEM - 1º Dia',
    date: '15/10/2025',
    status: 'Encerrado',
  },
]

export default function AdminSimulationsPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Simulados</CardTitle>
          <CardDescription>
            Crie e gerencie os simulados da plataforma.
          </CardDescription>
        </div>
        <Button asChild>
          <Link to="/admin/simulations/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Simulado
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockSimulations.map((sim) => (
              <TableRow key={sim.id}>
                <TableCell className="font-medium">{sim.name}</TableCell>
                <TableCell>{sim.date}</TableCell>
                <TableCell>
                  <Badge variant="outline">{sim.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/simulations/${sim.id}/edit`}>
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Ver Resultados</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
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
