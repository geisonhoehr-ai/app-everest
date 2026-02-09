import { useState, useEffect } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { logger } from '@/lib/logger'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Trophy,
  Award,
  Star,
  Zap,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  PlusCircle,
  Edit,
  Trash2,
  Medal,
  Crown,
  Shield,
  Flame,
  Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/hooks/use-toast'
import {
  getAchievements,
  createAchievement,
  getRanking,
  getGamificationStats,
  type Achievement,
  type RankingEntry
} from '@/services/gamificationService'

export default function AdminGamificationPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAchievement, setNewAchievement] = useState({
    name: '',
    description: '',
    icon_url: '🏆',
    xp_reward: 100,
    category: 'general'
  })
  const [stats, setStats] = useState({
    totalAchievements: 0,
    totalUnlocked: 0,
    totalXP: 0,
    activeUsers: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [achievementsData, rankingData, statsData] = await Promise.all([
        getAchievements(),
        getRanking(50),
        getGamificationStats()
      ])

      setAchievements(achievementsData)
      setRanking(rankingData)
      setStats(statsData)
    } catch (error) {
      logger.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de gamificação',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAchievement = async () => {
    if (!newAchievement.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o nome da conquista',
        variant: 'destructive'
      })
      return
    }

    try {
      await createAchievement(newAchievement)

      toast({
        title: 'Sucesso',
        description: 'Conquista criada com sucesso'
      })

      setIsCreateDialogOpen(false)
      setNewAchievement({
        name: '',
        description: '',
        icon_url: '🏆',
        xp_reward: 100,
        category: 'general'
      })
      loadData()
    } catch (error) {
      logger.error('Erro ao criar conquista:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a conquista',
        variant: 'destructive'
      })
    }
  }

  const getCategoryBadge = (category: string) => {
    const categories: Record<string, { label: string; className: string }> = {
      general: { label: 'Geral', className: 'bg-gray-500/10 border-gray-500/20 text-gray-600' },
      study: { label: 'Estudos', className: 'bg-blue-500/10 border-blue-500/20 text-blue-600' },
      quiz: { label: 'Quiz', className: 'bg-purple-500/10 border-purple-500/20 text-purple-600' },
      essay: { label: 'Redação', className: 'bg-green-500/10 border-green-500/20 text-green-600' },
      social: { label: 'Social', className: 'bg-orange-500/10 border-orange-500/20 text-orange-600' }
    }

    const cat = categories[category] || categories.general
    return <Badge className={cat.className}>{cat.label}</Badge>
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{position}</span>
    }
  }

  if (loading) {
    return <SectionLoader />
  }

  const totalAchievements = stats.totalAchievements
  const totalUnlocked = stats.totalUnlocked
  const totalXP = stats.totalXP

  return (
    <MagicLayout
      title="Gamificação"
      description="Gerencie conquistas, ranking, XP e sistema de recompensas"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <MagicCard variant="glass" className="p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10">
                <Trophy className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{totalAchievements}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Conquistas</div>
              </div>
            </div>
          </MagicCard>

          <MagicCard variant="glass" className="p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10">
                <Award className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{totalUnlocked}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Desbloqueadas</div>
              </div>
            </div>
          </MagicCard>

          <MagicCard variant="glass" className="p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{totalXP.toLocaleString()}</div>
                <div className="text-xs md:text-sm text-muted-foreground">XP Total</div>
              </div>
            </div>
          </MagicCard>

          <MagicCard variant="glass" className="p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">{ranking.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Participantes</div>
              </div>
            </div>
          </MagicCard>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-1 md:gap-2 bg-card/50 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-border/50">
            <TabsTrigger value="overview" className="rounded-lg md:rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-xs md:text-sm">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Visão</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-lg md:rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-xs md:text-sm">
              <Trophy className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Conquistas</span>
              <span className="sm:hidden">Conquistas</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="rounded-lg md:rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-xs md:text-sm">
              <Medal className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Ranking</span>
              <span className="sm:hidden">Ranking</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <MagicCard variant="premium" size="lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Flame className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-bold">Sistema de XP</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure como os pontos são distribuídos
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-card/50 border border-border/50">
                      <span className="text-sm font-medium">Completar Quiz</span>
                      <Badge>+50 XP</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-card/50 border border-border/50">
                      <span className="text-sm font-medium">Estudar Flashcards</span>
                      <Badge>+30 XP</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-card/50 border border-border/50">
                      <span className="text-sm font-medium">Enviar Redação</span>
                      <Badge>+100 XP</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-card/50 border border-border/50">
                      <span className="text-sm font-medium">Completar Simulado</span>
                      <Badge>+200 XP</Badge>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Configurar Pontos
                  </Button>
                </div>
              </MagicCard>

              <MagicCard variant="premium" size="lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-bold">Níveis</h3>
                      <p className="text-sm text-muted-foreground">
                        Sistema de progressão por níveis
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-card/50 border border-border/50">
                      <span className="text-sm font-medium">Nível 1 → 2</span>
                      <Badge>100 XP</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-card/50 border border-border/50">
                      <span className="text-sm font-medium">Nível 2 → 3</span>
                      <Badge>250 XP</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-card/50 border border-border/50">
                      <span className="text-sm font-medium">Nível 3 → 4</span>
                      <Badge>500 XP</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-card/50 border border-border/50">
                      <span className="text-sm font-medium">Nível 4 → 5</span>
                      <Badge>1000 XP</Badge>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Configurar Níveis
                  </Button>
                </div>
              </MagicCard>
            </div>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements" className="space-y-6">
            <MagicCard variant="glass" size="lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Conquistas Disponíveis</h3>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-primary/80">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Nova Conquista
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Conquista</DialogTitle>
                      <DialogDescription>
                        Adicione uma nova conquista ao sistema de gamificação
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da Conquista</Label>
                        <Input
                          id="name"
                          placeholder="Ex: Primeira Vitória"
                          value={newAchievement.name}
                          onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                          id="description"
                          placeholder="Como desbloquear esta conquista..."
                          value={newAchievement.description}
                          onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="icon">Ícone (Emoji)</Label>
                        <Input
                          id="icon"
                          placeholder="🏆"
                          value={newAchievement.icon_url}
                          onChange={(e) => setNewAchievement({ ...newAchievement, icon_url: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="points">Pontos XP</Label>
                        <Input
                          id="points"
                          type="number"
                          value={newAchievement.xp_reward}
                          onChange={(e) => setNewAchievement({ ...newAchievement, xp_reward: parseInt(e.target.value) || 100 })}
                        />
                      </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateAchievement}>
                        Criar Conquista
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conquista</TableHead>
                      <TableHead className="hidden md:table-cell">Categoria</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead className="hidden sm:table-cell">Desbloqueios</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {achievements.map((achievement) => (
                      <TableRow key={achievement.id} className="group hover:bg-primary/5">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{achievement.icon_url}</div>
                            <div>
                              <div className="font-medium group-hover:text-primary transition-colors">
                                {achievement.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {achievement.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {getCategoryBadge(achievement.category)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-primary/10 border-primary/20 text-primary text-xs">
                            +{achievement.xp_reward}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{achievement.unlocked_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </MagicCard>
          </TabsContent>

          {/* Ranking */}
          <TabsContent value="ranking" className="space-y-6">
            <MagicCard variant="glass" size="lg">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Top 50 Estudantes</h3>
                <p className="text-sm text-muted-foreground">
                  Ranking global baseado em XP acumulado
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead className="w-12 md:w-16">Pos</TableHead>
                      <TableHead>Estudante</TableHead>
                      <TableHead className="hidden sm:table-cell">Nível</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead className="hidden md:table-cell">Conquistas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((entry) => (
                      <TableRow
                        key={entry.user_id}
                        className={cn(
                          'group hover:bg-primary/5',
                          entry.position <= 3 && 'bg-primary/5'
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getRankIcon(entry.position)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium group-hover:text-primary transition-colors text-sm md:text-base">
                            <span className="hidden sm:inline">{entry.first_name} {entry.last_name}</span>
                            <span className="sm:hidden">{entry.first_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className="bg-primary/10 border-primary/20 text-primary text-xs">
                            Nv. {entry.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 md:gap-2">
                            <Zap className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
                            <span className="font-bold text-sm md:text-base">{entry.total_xp.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <span>{entry.achievements_count}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </MagicCard>
          </TabsContent>
        </Tabs>
      </div>
    </MagicLayout>
  )
}

