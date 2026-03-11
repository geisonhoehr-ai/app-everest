import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AchievementsTutorial } from '@/components/achievements/AchievementsTutorial'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  Award,
  Trophy,
  Star,
  Target,
  Lock,
  CheckCircle,
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
import { logger } from '@/lib/logger'

export default function AchievementsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
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
        logger.error('Erro ao carregar dados das conquistas:', error)
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
    if (!isUnlocked) return 'bg-gray-500'

    const lowerName = name.toLowerCase()
    const colorMap: Record<string, string> = {
      'primeiro login': 'bg-blue-500',
      'estudante dedicado': 'bg-green-500',
      'top 10': 'bg-yellow-500',
      'maratonista': 'bg-orange-500',
      'especialista': 'bg-purple-500',
      'mestre': 'bg-red-500',
      'lenda': 'bg-pink-500',
      'flashcard master': 'bg-emerald-500',
      'quiz champion': 'bg-cyan-500',
      'streak master': 'bg-rose-500'
    }
    return colorMap[lowerName] || 'bg-primary'
  }

  const getAchievementRarity = (xpReward: number) => {
    if (xpReward >= 100) return { name: 'Lendário', color: 'bg-purple-500' }
    if (xpReward >= 50) return { name: 'Épico', color: 'bg-blue-500' }
    if (xpReward >= 25) return { name: 'Raro', color: 'bg-green-500' }
    if (xpReward >= 10) return { name: 'Incomum', color: 'bg-yellow-500' }
    return { name: 'Comum', color: 'bg-gray-500' }
  }

  const AchievementCard = ({ achievement, isUnlocked, userAchievement }: {
    achievement: Achievement
    isUnlocked: boolean
    userAchievement?: UserAchievement
  }) => {
    const rarity = getAchievementRarity(achievement.xp_reward)

    return (
      <Card
        className={cn(
          "border-border shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30",
          isUnlocked && "ring-2 ring-primary/20",
          !isUnlocked && "opacity-60"
        )}
      >
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header da conquista */}
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl relative",
                getAchievementColor(achievement.name, isUnlocked)
              )}>
                {isUnlocked ? (
                  getAchievementIcon(achievement.name)
                ) : (
                  <Lock className="h-5 w-5 text-white" />
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
                    "font-bold text-base",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {achievement.name}
                  </h3>
                  <Badge className={cn(
                    "text-xs text-white",
                    rarity.color
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

          </div>
        </CardContent>
      </Card>
    )
  }

  const totalXP = userAchievements.reduce((sum, ua) => sum + ua.achievement.xp_reward, 0)
  const completionPercentage = (unlockedAchievements.length / allAchievements.length) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conquistas</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete desafios e desbloqueie recompensas</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTutorial(true)}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Ajuda
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-green-500/30">
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 text-green-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{unlockedAchievements.length}</div>
            <div className="text-xs text-muted-foreground">Desbloqueadas</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{lockedAchievements.length}</div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-500/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-purple-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{Math.round(completionPercentage)}%</div>
            <div className="text-xs text-muted-foreground">Completado</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-orange-500/30">
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 text-orange-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{totalXP}</div>
            <div className="text-xs text-muted-foreground">XP Total</div>
          </CardContent>
        </Card>
      </div>

        {/* Tabs de conquistas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger
              value="unlocked"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Desbloqueadas ({unlockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger
              value="locked"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <Lock className="h-4 w-4 mr-2" />
              Pendentes ({lockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
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
              <Card className="border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                <CardContent className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Nenhuma conquista desbloqueada ainda
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Continue estudando e completando atividades para desbloquear suas primeiras conquistas!
                    </p>
                    <Button
                      onClick={() => navigate('/courses')}
                    >
                      Começar a Estudar
                    </Button>
                  </div>
                </CardContent>
              </Card>
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

      {/* Tutorial Modal */}
      <AchievementsTutorial
        open={showTutorial}
        onOpenChange={setShowTutorial}
        onComplete={handleTutorialComplete}
      />
    </div>
  )
}
