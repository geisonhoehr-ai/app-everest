import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useStaggeredAnimation } from '@/hooks/useAnimations'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FilePlus2, Eye, FileDown, FileText, Calendar, Clock, TrendingUp } from 'lucide-react'

const essays = [
  {
    id: 1,
    theme: 'Inteligência Artificial e o Futuro do Trabalho',
    date: '20/10/2025',
    status: 'Corrigida',
    grade: 920,
  },
  {
    id: 2,
    theme: 'A Persistência da Violência Contra a Mulher na Sociedade',
    date: '05/10/2025',
    status: 'Corrigida',
    grade: 880,
  },
  {
    id: 3,
    theme: 'Desafios da Educação a Distância no Brasil',
    date: '28/09/2025',
    status: 'Enviada',
    grade: null,
  },
]

export default function EssaysPage() {
  const rowDelays = useStaggeredAnimation(essays.length, 100)

  return (
    <MagicLayout
      title="Minhas Redações"
      description="Envie suas redações e acompanhe suas correções e notas."
    >
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MagicCard className="p-4 md:p-6 text-center" glow>
            <div className="space-y-1 md:space-y-2">
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto" />
              <div className="text-xl md:text-2xl font-bold">{essays.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Redações Enviadas</div>
            </div>
          </MagicCard>
          <MagicCard className="p-4 md:p-6 text-center" glow>
            <div className="space-y-1 md:space-y-2">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto" />
              <div className="text-xl md:text-2xl font-bold">900</div>
              <div className="text-xs md:text-sm text-muted-foreground">Nota Média</div>
            </div>
          </MagicCard>
          <MagicCard className="p-4 md:p-6 text-center" glow>
            <div className="space-y-1 md:space-y-2">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mx-auto" />
              <div className="text-xl md:text-2xl font-bold">3</div>
              <div className="text-xs md:text-sm text-muted-foreground">Dias Médio</div>
            </div>
          </MagicCard>
          <MagicCard className="p-4 md:p-6 text-center" glow>
            <div className="space-y-1 md:space-y-2">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-orange-500 mx-auto" />
              <div className="text-xl md:text-2xl font-bold">1</div>
              <div className="text-xs md:text-sm text-muted-foreground">Pendentes</div>
            </div>
          </MagicCard>
        </div>

        {/* Actions Bar */}
        <MagicCard className="p-6" glow>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <h2 className="text-lg md:text-xl font-semibold">Histórico de Redações</h2>
              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary w-fit">
                {essays.filter(e => e.status === 'Corrigida').length} corrigidas
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                asChild
                className="group transition-all duration-300 hover:bg-primary/5 w-full sm:w-auto"
              >
                <Link to="/redacoes/evolucao" target="_blank">
                  <FileDown className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span className="transition-colors duration-300 group-hover:text-primary">
                    Exportar Evolução
                  </span>
                </Link>
              </Button>
              <Button 
                asChild
                className="group transition-all duration-300 hover:bg-primary/90 w-full sm:w-auto"
              >
                <Link to="/redacoes/nova">
                  <FilePlus2 className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  Enviar Nova Redação
                </Link>
              </Button>
            </div>
          </div>
        </MagicCard>

        {/* Essays Table */}
        <MagicCard className="overflow-hidden" glow>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow className="animate-fade-in-up animation-delay-400">
                <TableHead>Tema</TableHead>
                <TableHead className="hidden md:table-cell">Data de Envio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Nota</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {essays.map((essay, index) => (
                <TableRow 
                  key={essay.theme}
                  className={cn(
                    "animate-fade-in-up group transition-all duration-300",
                    "hover:bg-primary/5"
                  )}
                  style={{ animationDelay: `${rowDelays[index].delay + 500}ms` }}
                >
                  <TableCell className="font-medium group-hover:text-primary transition-colors duration-200">
                    {essay.theme}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {essay.date}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={essay.status === 'Corrigida' ? 'default' : 'secondary'}
                      className={cn(
                        "transition-all duration-300",
                        essay.status === 'Corrigida'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-900'
                          : 'group-hover:bg-primary/20'
                      )}
                    >
                      {essay.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={cn(
                      "transition-all duration-300",
                      essay.grade ? "bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent opacity-0 group-hover:opacity-100" : ""
                    )}>
                      {essay.grade ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {essay.status === 'Corrigida' && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        asChild
                        className="group/btn transition-all duration-300 hover:bg-primary/5"
                      >
                        <Link to={`/redacoes/${essay.id}`}>
                          <Eye className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110 group-hover/btn:text-primary" />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
