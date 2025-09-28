import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MagicCard } from '@/components/ui/magic-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Play, BarChart2 } from 'lucide-react'

const simulations = [
  {
    id: 1,
    name: 'Simulado Nacional - Humanas',
    date: '25/10/2025',
    status: 'Disponível',
    lastScore: null,
  },
  {
    id: 2,
    name: 'Simulado ENEM - 1º Dia',
    date: '15/10/2025',
    status: 'Realizado',
    lastScore: '78/90',
  },
  {
    id: 3,
    name: 'Simulado FUVEST - 1ª Fase',
    date: '01/10/2025',
    status: 'Realizado',
    lastScore: '72/90',
  },
  {
    id: 4,
    name: 'Simulado Nacional - Linguagens',
    date: '15/09/2025',
    status: 'Encerrado',
    lastScore: '81/90',
  },
]

export default function SimulationsPage() {
  return (
    <MagicCard>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sistema de Simulados</h1>
          <p className="text-muted-foreground">
            Teste seus conhecimentos e prepare-se para as provas.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Simulado</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Última Pontuação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {simulations.map((sim) => (
              <TableRow key={sim.name}>
                <TableCell className="font-medium">{sim.name}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {sim.date}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sim.status === 'Disponível' ? 'default' : 'outline'
                    }
                  >
                    {sim.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {sim.lastScore ?? '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {sim.status === 'Disponível' && (
                      <Button size="sm" asChild>
                        <Link to={`/simulados/${sim.id}`}>
                          <Play className="mr-2 h-4 w-4" /> Iniciar
                        </Link>
                      </Button>
                    )}
                    {sim.status === 'Realizado' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/simulados/${sim.id}/resultado`}>
                          <BarChart2 className="mr-2 h-4 w-4" /> Ver Relatório
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </MagicCard>
  )
}
