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
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  BarChart2, 
  Calendar, 
  Clock, 
  Trophy, 
  Target,
  BookOpen,
  TrendingUp,
  Award,
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível':
        return 'bg-green-500/10 border-green-500/20 text-green-600'
      case 'Realizado':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600'
      case 'Encerrado':
        return 'bg-gray-500/10 border-gray-500/20 text-gray-600'
      default:
        return 'bg-muted/10 border-muted/20 text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Disponível':
        return <Play className="h-3 w-3" />
      case 'Realizado':
        return <CheckCircle className="h-3 w-3" />
      case 'Encerrado':
        return <AlertCircle className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  return (
    <MagicLayout 
      title="Sistema de Simulados"
      description="Teste seus conhecimentos e prepare-se para as provas"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Target className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Sistema de Simulados
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                    Teste seus conhecimentos e prepare-se para as provas
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Trophy className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium">4 Simulados</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Play className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">1</div>
                <div className="text-xs md:text-sm text-muted-foreground">Disponível</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">2</div>
                <div className="text-xs md:text-sm text-muted-foreground">Realizados</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">77</div>
                <div className="text-xs md:text-sm text-muted-foreground">Média Geral</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Award className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">81</div>
                <div className="text-xs md:text-sm text-muted-foreground">Melhor Nota</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Simulations Table */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Simulados Disponíveis</h2>
            </div>

            <div className="rounded-xl overflow-hidden border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/20 to-muted/10 border-border/50">
                    <TableHead className="font-semibold">Nome do Simulado</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Última Pontuação</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulations.map((sim, index) => (
                    <TableRow 
                      key={sim.name}
                      className={cn(
                        "group hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 transition-all duration-300",
                        "border-border/50"
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                            <span className="text-sm font-bold text-primary">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold">{sim.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Simulado oficial
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{sim.date}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full border font-medium",
                          getStatusColor(sim.status)
                        )}>
                          {getStatusIcon(sim.status)}
                          {sim.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {sim.lastScore ? (
                          <div className="flex items-center justify-end gap-2">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-primary">{sim.lastScore}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {sim.status === 'Disponível' && (
                            <Button 
                              size="sm" 
                              asChild
                              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            >
                              <Link to={`/simulados/${sim.id}`}>
                                <Play className="mr-2 h-4 w-4" /> 
                                Iniciar
                              </Link>
                            </Button>
                          )}
                          {sim.status === 'Realizado' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
                            >
                              <Link to={`/simulados/${sim.id}/resultado`}>
                                <BarChart2 className="mr-2 h-4 w-4" /> 
                                Ver Relatório
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          {sim.status === 'Encerrado' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled
                              className="opacity-50 cursor-not-allowed"
                            >
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Encerrado
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </MagicCard>

        {/* Quick Actions */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Ações Rápidas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-600">Próximo Simulado</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Simulado Nacional - Humanas disponível para realização
                </p>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar Agora
                </Button>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-600">Meu Progresso</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Acompanhe sua evolução nos simulados realizados
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
                >
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Ver Relatório
                </Button>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-purple-600">Conquistas</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Desbloqueie novas conquistas e badges
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Ver Conquistas
                </Button>
              </div>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
