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
import { FilePlus2, Eye, FileDown, FileText, Calendar, Clock, TrendingUp, Lock, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getUserEssaysList, getUserEssayStats, type EssayListItem, type EssayStatsData } from '@/services/essayService'
import { useAuth } from '@/hooks/use-auth'
import { SectionLoader } from '@/components/SectionLoader'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'

export default function EssaysPage() {
  const { user, isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [essays, setEssays] = useState<EssayListItem[]>([])
  const [stats, setStats] = useState<EssayStatsData>({
    totalEssays: 0,
    averageGrade: 0,
    averageDays: 0,
    pending: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEssays = async () => {
      try {
        if (!user?.id) return

        const [essaysData, statsData] = await Promise.all([
          getUserEssaysList(user.id),
          getUserEssayStats(user.id)
        ])

        setEssays(essaysData)
        setStats(statsData)
      } catch (error) {
        console.error('Error fetching essays:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEssays()
  }, [user?.id])

  const rowDelays = useStaggeredAnimation(essays.length, 100)

  // Verificação de permissões para alunos
  if (permissionsLoading || isLoading) {
    return <SectionLoader />
  }

  // Se for aluno e não tiver permissão, mostra página bloqueada
  if (isStudent && !hasFeature(FEATURE_KEYS.ESSAYS)) {
    return (
      <MagicLayout
        title="Redações"
        description="Sistema de redações bloqueado"
      >
        <MagicCard variant="glass" size="lg" className="text-center py-24">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Recurso Bloqueado
            </h3>
            <p className="text-muted-foreground mb-8">
              O sistema de redações não está disponível para sua turma. Entre em contato com seu professor ou administrador para mais informações.
            </p>
          </div>
        </MagicCard>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title="Minhas Redações"
      description="Envie suas redações e acompanhe suas correções e notas."
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Minhas Redações
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                    Envie suas redações e acompanhe correções e notas
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Star className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium">Correção Detalhada</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">{stats.totalEssays}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Redações Enviadas</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">{stats.averageGrade}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Nota Média</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">{stats.averageDays}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Dias Médio</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Pendentes</div>
              </div>
            </div>
          </div>
        </MagicCard>

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
                    key={essay.id}
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
