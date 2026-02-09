import { useState, useEffect } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { 
  Trophy, 
  Crown, 
  Star, 
  Target, 
  TrendingUp, 
  Award, 
  Users, 
  Zap,
  Medal,
  Flame,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Minus
, Lock } from 'lucide-react'
import { 
  rankingService, 
  type UserRanking, 
  type UserPosition, 
  type XPStatistics,
  type UserAchievement 
} from '@/services/rankingService'
import { SectionLoader } from '@/components/SectionLoader'
import { logger } from '@/lib/logger'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'

export default function RankingPage() {
  const { user, isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [activeTab, setActiveTab] = useState('global')
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para dados
  const [globalRanking, setGlobalRanking] = useState<UserRanking[]>([])
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null)
  const [xpStats, setXpStats] = useState<XPStatistics | null>(null)
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [flashcardRanking, setFlashcardRanking] = useState<UserRanking[]>([])
  const [quizRanking, setQuizRanking] = useState<UserRanking[]>([])

  useEffect(() => {
    const fetchRankingData = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        
        const [
          globalData,
          positionData,
          statsData,
          achievementsData,
          flashcardData,
          quizData
        ] = await Promise.all([
          rankingService.getUserRanking(50),
          rankingService.getUserPosition(user.id),
          rankingService.getXPStatistics(),
          rankingService.getUserAchievements(user.id),
          rankingService.getRankingByActivity('flashcard', 20),
          rankingService.getRankingByActivity('quiz', 20)
        ])

        setGlobalRanking(globalData)
        setUserPosition(positionData)
        setXpStats(statsData)
        setUserAchievements(achievementsData)
        setFlashcardRanking(flashcardData)
        setQuizRanking(quizData)
      } catch (error) {
        logger.error('Erro ao carregar dados do ranking:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankingData()
  }, [user?.id])

  if (permissionsLoading || isLoading) {
    return <SectionLoader />
  }

  // Se for aluno e não tiver permissão, mostra página bloqueada
  if (isStudent && !hasFeature(FEATURE_KEYS.RANKING)) {
    return (
      <MagicLayout
        title="Ranking"
        description="Recurso bloqueado"
      >
        <MagicCard variant="glass" size="lg" className="text-center py-24">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Recurso Bloqueado
            </h3>
            <p className="text-muted-foreground mb-8">
              Este recurso não está disponível para sua turma. Entre em contato com seu professor ou administrador para mais informações.
            </p>
          </div>
        </MagicCard>
      </MagicLayout>
    )
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />
      case 2: return <Medal className="h-6 w-6 text-gray-400" />
      case 3: return <Award className="h-6 w-6 text-amber-600" />
      default: return <span className="text-lg font-bold text-muted-foreground">#{position}</span>
    }
  }

  const getRankColor = (position: number) => {
    switch (position) {
      case 1: return 'from-yellow-400 to-yellow-600'
      case 2: return 'from-gray-300 to-gray-500'
      case 3: return 'from-amber-500 to-amber-700'
      default: return 'from-primary/20 to-primary/10'
    }
  }

  const getLevelInfo = (xp: number) => {
    return rankingService.calculateLevelInfo(xp)
  }

  const getProgressInfo = (xp: number) => {
    return rankingService.calculateProgressToNext(xp)
  }

  const getPositionChange = (currentPosition: number, previousPosition?: number) => {
    if (!previousPosition) return null
    const change = previousPosition - currentPosition
    if (change > 0) return { type: 'up', value: change }
    if (change < 0) return { type: 'down', value: Math.abs(change) }
    return { type: 'same', value: 0 }
  }

  const RankingCard = ({ user, position, showChange = false }: { 
    user: UserRanking, 
    position: number,
    showChange?: boolean 
  }) => {
    const levelInfo = getLevelInfo(user.total_xp)
    const progressInfo = getProgressInfo(user.total_xp)
    const positionChange = showChange ? getPositionChange(position, user.rank_position) : null

    return (
      <MagicCard 
        variant={position <= 3 ? "premium" : "glass"} 
        className={cn(
          "transition-all duration-300 hover:scale-105",
          position <= 3 && "ring-2 ring-primary/20"
        )}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Posição */}
          <div className="flex-shrink-0">
            {getRankIcon(position)}
          </div>

          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
              {user.first_name[0]}{user.last_name[0]}
            </AvatarFallback>
          </Avatar>

          {/* Informações do usuário */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {user.first_name} {user.last_name}
              </h3>
              {position <= 3 && (
                <Badge className={cn("text-xs", `bg-gradient-to-r ${getRankColor(position)} text-white`)}>
                  {levelInfo.title}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{user.total_xp} XP</span>
              </div>
              
              {positionChange && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  positionChange.type === 'up' && "text-green-500",
                  positionChange.type === 'down' && "text-red-500",
                  positionChange.type === 'same' && "text-muted-foreground"
                )}>
                  {positionChange.type === 'up' && <ChevronUp className="h-3 w-3" />}
                  {positionChange.type === 'down' && <ChevronDown className="h-3 w-3" />}
                  {positionChange.type === 'same' && <Minus className="h-3 w-3" />}
                  {positionChange.value}
                </div>
              )}
            </div>

            {/* Barra de progresso para próximo nível */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Nível {levelInfo.level}</span>
                <span>{progressInfo.xpToNext} XP para próximo</span>
              </div>
              <Progress 
                value={progressInfo.progress} 
                className="h-2"
              />
            </div>
          </div>

          {/* Badge de nível */}
          <div className="flex-shrink-0">
            <div className={cn(
              "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl",
              getRankColor(position)
            )}>
              {levelInfo.icon}
            </div>
          </div>
        </div>
      </MagicCard>
    )
  }

  return (
    <MagicLayout 
      title="Ranking"
      description="Veja sua posição e compare seu desempenho com outros estudantes"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header com estatísticas */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Sistema de Ranking
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                    Compete e evolua com outros estudantes
                  </p>
                </div>
              </div>
              
              {userPosition && (
                <div className="text-left md:text-right">
                  <div className="text-xl md:text-2xl font-bold text-primary">#{userPosition.rank_position}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Sua posição</div>
                </div>
              )}
            </div>

            {/* Estatísticas gerais */}
            {xpStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-xl md:text-2xl font-bold text-blue-600">{xpStats.total_users}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Estudantes</div>
                </div>
                <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                  <Star className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                  <div className="text-xl md:text-2xl font-bold text-green-600">{xpStats.total_xp_distributed.toLocaleString()}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">XP Total</div>
                </div>
                <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-xl md:text-2xl font-bold text-purple-600">{Math.round(xpStats.average_xp)}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">XP Médio</div>
                </div>
                <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                  <Crown className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                  <div className="text-xl md:text-2xl font-bold text-orange-600">{xpStats.max_xp.toLocaleString()}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">XP Máximo</div>
                </div>
              </div>
            )}
          </div>
        </MagicCard>

        {/* Tabs de ranking */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="global" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Global
            </TabsTrigger>
            <TabsTrigger 
              value="flashcards" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
            >
              <Target className="h-4 w-4 mr-2" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger 
              value="quizzes" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              Quizzes
            </TabsTrigger>
          </TabsList>

          {/* Ranking Global */}
          <TabsContent value="global" className="space-y-4">
            <MagicCard variant="glass" size="lg">
              <div className="flex items-center gap-4 p-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Ranking Global</h2>
                  <p className="text-muted-foreground">
                    Top {globalRanking.length} estudantes da plataforma
                  </p>
                </div>
              </div>
            </MagicCard>

            <div className="space-y-3">
              {globalRanking.map((user, index) => (
                <RankingCard 
                  key={user.user_id} 
                  user={user} 
                  position={index + 1}
                  showChange={true}
                />
              ))}
            </div>
          </TabsContent>

          {/* Ranking de Flashcards */}
          <TabsContent value="flashcards" className="space-y-4">
            <MagicCard variant="glass" size="lg">
              <div className="flex items-center gap-4 p-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Ranking de Flashcards</h2>
                  <p className="text-muted-foreground">
                    Top estudantes em flashcards
                  </p>
                </div>
              </div>
            </MagicCard>

            <div className="space-y-3">
              {flashcardRanking.map((user, index) => (
                <RankingCard 
                  key={user.user_id} 
                  user={user} 
                  position={index + 1}
                />
              ))}
            </div>
          </TabsContent>

          {/* Ranking de Quizzes */}
          <TabsContent value="quizzes" className="space-y-4">
            <MagicCard variant="glass" size="lg">
              <div className="flex items-center gap-4 p-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Ranking de Quizzes</h2>
                  <p className="text-muted-foreground">
                    Top estudantes em quizzes
                  </p>
                </div>
              </div>
            </MagicCard>

            <div className="space-y-3">
              {quizRanking.map((user, index) => (
                <RankingCard 
                  key={user.user_id} 
                  user={user} 
                  position={index + 1}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Seção de Conquistas */}
        {userAchievements.length > 0 && (
          <MagicCard variant="glass" size="lg">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/10">
                  <Award className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Suas Conquistas</h2>
                  <p className="text-muted-foreground">
                    {userAchievements.length} conquistas desbloqueadas
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userAchievements.slice(0, 6).map((achievement) => (
                  <div 
                    key={achievement.id}
                    className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:scale-105 transition-transform duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xl">
                        🏆
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {achievement.achievement.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {achievement.achievement.description}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs font-medium text-yellow-600">
                            +{achievement.achievement.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {userAchievements.length > 6 && (
                <div className="text-center">
                  <Button variant="outline" className="rounded-xl">
                    Ver Todas as Conquistas
                  </Button>
                </div>
              )}
            </div>
          </MagicCard>
        )}
      </div>
    </MagicLayout>
  )
}
