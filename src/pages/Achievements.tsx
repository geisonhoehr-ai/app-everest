import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-provider'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AchievementsTutorial } from '@/components/achievements/AchievementsTutorial'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  Award,
  Trophy,
  Star,
  Target,
  Zap,
  Crown,
  Lock,
  CheckCircle,
  Sparkles,
  Flame,
  Brain,
  BookOpen,
  Users,
  TrendingUp,
  HelpCircle
} from 'lucide-react'
import { 
  rankingService, 
  type Achievement, 
  type UserAchievement,
  type UserPosition 
} from '@/services/rankingService'
import { SectionLoader } from '@/components/SectionLoader'

export default function AchievementsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('unlocked')
  const [isLoading, setIsLoading] = useState(true)

  // Tutorial states
  const [showTutorial, setShowTutorial] = useState(false)

  // Estados para dados
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null)

  // Check if user has seen tutorial before
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenAchievementsTutorial')
    if (!hasSeenTutorial && user) {
      // Delay showing tutorial slightly to let page load
      setTimeout(() => {
        setShowTutorial(true)
      }, 500)
    }
  }, [user])

  const handleTutorialComplete = () => {
    localStorage.setItem('hasSeenAchievementsTutorial', 'true')
    toast({
      title: 'Tutorial concluído!',
      description: 'Você pode rever este tutorial a qualquer momento clicando no ícone de ajuda.'
    })
  }

  useEffect(() => {
    const fetchAchievementsData = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        
        const [
          achievementsData,
          userAchievementsData,
          positionData
        ] = await Promise.all([
          rankingService.getAchievements(),
          rankingService.getUserAchievements(user.id),
          rankingService.getUserPosition(user.id)
        ])

        setAllAchievements(achievementsData)
        setUserAchievements(userAchievementsData)
        setUserPosition(positionData)
      } catch (error) {
        console.error('Erro ao carregar dados das conquistas:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAchievementsData()
  }, [user?.id])

  if (isLoading) {
    return <SectionLoader />
  }

  const unlockedAchievementIds = userAchievements.map(ua => ua.achievement_id)
  const unlockedAchievements = allAchievements.filter(a => unlockedAchievementIds.includes(a.id))
  const lockedAchievements = allAchievements.filter(a => !unlockedAchievementIds.includes(a.id))

  const getAchievementIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    const iconMap: Record<string, string> = {
      'primeiro login': '🎉',
      'estudante dedicado': '📚',
      'top 10': '🏆',
      'maratonista': '🏃',
      'especialista': '💎',
      'mestre': '👑',
      'lenda': '🌟',
      'flashcard master': '🎯',
      'quiz champion': '⚡',
      'streak master': '🔥',
      'perfeccionista': '✨',
      'colaborador': '🤝',
      'explorador': '🗺️',
      'inovador': '💡'
    }
    return iconMap[lowerName] || '🏆'
  }

  const getAchievementColor = (name: string, isUnlocked: boolean) => {
    if (!isUnlocked) return 'from-gray-400 to-gray-600'
    
    const lowerName = name.toLowerCase()
    const colorMap: Record<string, string> = {
      'primeiro login': 'from-blue-400 to-blue-600',
      'estudante dedicado': 'from-green-400 to-green-600',
      'top 10': 'from-yellow-400 to-yellow-600',
      'maratonista': 'from-orange-400 to-orange-600',
      'especialista': 'from-purple-400 to-purple-600',
      'mestre': 'from-red-400 to-red-600',
      'lenda': 'from-pink-400 to-pink-600',
      'flashcard master': 'from-emerald-400 to-emerald-600',
      'quiz champion': 'from-cyan-400 to-cyan-600',
      'streak master': 'from-rose-400 to-rose-600'
    }
    return colorMap[lowerName] || 'from-primary to-primary/80'
  }

  const getAchievementRarity = (xpReward: number) => {
    if (xpReward >= 100) return { name: 'Lendário', color: 'from-purple-500 to-pink-500' }
    if (xpReward >= 50) return { name: 'Épico', color: 'from-blue-500 to-purple-500' }
    if (xpReward >= 25) return { name: 'Raro', color: 'from-green-500 to-blue-500' }
    if (xpReward >= 10) return { name: 'Incomum', color: 'from-yellow-500 to-orange-500' }
    return { name: 'Comum', color: 'from-gray-500 to-gray-600' }
  }

  const AchievementCard = ({ achievement, isUnlocked, userAchievement }: {
    achievement: Achievement
    isUnlocked: boolean
    userAchievement?: UserAchievement
  }) => {
    const rarity = getAchievementRarity(achievement.xp_reward)
    
    return (
      <MagicCard 
        variant={isUnlocked ? "premium" : "glass"}
        className={cn(
          "transition-all duration-300 hover:scale-105",
          isUnlocked && "ring-2 ring-primary/20",
          !isUnlocked && "opacity-60"
        )}
      >
        <div className="p-6 space-y-4">
          {/* Header da conquista */}
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl relative",
              getAchievementColor(achievement.name, isUnlocked)
            )}>
              {isUnlocked ? (
                getAchievementIcon(achievement.name)
              ) : (
                <Lock className="h-8 w-8 text-white" />
              )}
              
              {isUnlocked && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className={cn(
                  "font-bold text-lg",
                  isUnlocked ? "text-foreground" : "text-muted-foreground"
                )}>
                  {achievement.name}
                </h3>
                <Badge className={cn(
                  "text-xs",
                  `bg-gradient-to-r ${rarity.color} text-white`
                )}>
                  {rarity.name}
                </Badge>
              </div>
              
              <p className={cn(
                "text-sm leading-relaxed",
                isUnlocked ? "text-muted-foreground" : "text-muted-foreground/60"
              )}>
                {achievement.description}
              </p>
            </div>
          </div>

          {/* Informações da conquista */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">
                {achievement.xp_reward} XP
              </span>
            </div>
            
            {isUnlocked && userAchievement && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Desbloqueada em</span>
                <span className="font-medium">
                  {new Date(userAchievement.achieved_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          {/* Progresso (se aplicável) */}
          {!isUnlocked && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progresso</span>
                <span>0%</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          )}
        </div>
      </MagicCard>
    )
  }

  const totalXP = userAchievements.reduce((sum, ua) => sum + ua.achievement.xp_reward, 0)
  const completionPercentage = (unlockedAchievements.length / allAchievements.length) * 100

  return (
    <MagicLayout 
      title="Conquistas"
      description="Desbloqueie conquistas e ganhe XP para subir no ranking"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header com estatísticas */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Sistema de Conquistas
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Complete desafios e desbloqueie recompensas exclusivas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowTutorial(true)}
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  aria-label="Ver tutorial de conquistas"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>

                {userPosition && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{totalXP} XP</div>
                    <div className="text-sm text-muted-foreground">Total ganho</div>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas das conquistas */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Trophy className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{unlockedAchievements.length}</div>
                <div className="text-sm text-muted-foreground">Desbloqueadas</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{lockedAchievements.length}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <TrendingUp className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{Math.round(completionPercentage)}%</div>
                <div className="text-sm text-muted-foreground">Completado</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Star className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{totalXP}</div>
                <div className="text-sm text-muted-foreground">XP Total</div>
              </div>
            </div>

            {/* Barra de progresso geral */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso Geral</span>
                <span className="text-muted-foreground">
                  {unlockedAchievements.length} de {allAchievements.length} conquistas
                </span>
              </div>
              <Progress value={completionPercentage} className="h-3" />
            </div>
          </div>
        </MagicCard>

        {/* Tabs de conquistas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="unlocked" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Desbloqueadas ({unlockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger 
              value="locked" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
            >
              <Lock className="h-4 w-4 mr-2" />
              Pendentes ({lockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
            >
              <Award className="h-4 w-4 mr-2" />
              Todas ({allAchievements.length})
            </TabsTrigger>
          </TabsList>

          {/* Conquistas desbloqueadas */}
          <TabsContent value="unlocked" className="space-y-4">
            {unlockedAchievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unlockedAchievements.map((userAchievement) => (
                  <AchievementCard
                    key={userAchievement.achievement.id}
                    achievement={userAchievement.achievement}
                    isUnlocked={true}
                    userAchievement={userAchievement}
                  />
                ))}
              </div>
            ) : (
              <MagicCard variant="glass" size="lg" className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Nenhuma conquista desbloqueada ainda
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Continue estudando e completando atividades para desbloquear suas primeiras conquistas!
                  </p>
                  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 rounded-2xl font-medium transition-transform duration-300 hover:scale-105 hover:shadow-lg inline-flex items-center justify-center">
                    Começar a Estudar
                  </Button>
                </div>
              </MagicCard>
            )}
          </TabsContent>

          {/* Conquistas pendentes */}
          <TabsContent value="locked" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lockedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={false}
                />
              ))}
            </div>
          </TabsContent>

          {/* Todas as conquistas */}
          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allAchievements.map((achievement) => {
                const isUnlocked = unlockedAchievementIds.includes(achievement.id)
                const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
                
                return (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={isUnlocked}
                    userAchievement={userAchievement}
                  />
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tutorial Modal */}
      <AchievementsTutorial
        open={showTutorial}
        onOpenChange={setShowTutorial}
        onComplete={handleTutorialComplete}
      />
    </MagicLayout>
  )
}
