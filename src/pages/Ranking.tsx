import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
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
  ChevronUp,
  ChevronDown,
  Minus,
  Lock,
} from 'lucide-react'
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
  const navigate = useNavigate()
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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Ranking</h1>
        <Card className="border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
          <CardContent className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Recurso Bloqueado
              </h3>
              <p className="text-muted-foreground mb-8">
                Este recurso não está disponível para sua turma. Entre em contato com seu professor ou administrador para mais informações.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />
      case 2: return <Medal className="h-6 w-6 text-muted-foreground/70" />
      case 3: return <Award className="h-6 w-6 text-amber-600" />
      default: return <span className="text-lg font-bold text-muted-foreground">#{position}</span>
    }
  }

  const getRankColor = (position: number) => {
    switch (position) {
      case 1: return 'bg-yellow-500'
      case 2: return 'bg-gray-400'
      case 3: return 'bg-amber-600'
      default: return 'bg-primary/15'
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
      <Card
        className={cn(
          "border-border shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30",
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
            <AvatarFallback className="bg-primary/10">
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
                <Badge className={cn("text-xs", `${getRankColor(position)} text-white`)}>
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
              "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
              getRankColor(position)
            )}>
              {levelInfo.icon}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ranking</h1>
          <p className="text-sm text-muted-foreground mt-1">Compete e evolua com outros estudantes</p>
        </div>
        {userPosition && (
          <div className="text-left md:text-right">
            <div className="text-xl font-bold text-primary">#{userPosition.rank_position}</div>
            <div className="text-xs text-muted-foreground">Sua posição</div>
          </div>
        )}
      </div>

      {/* Stats */}
      {xpStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-500/30">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
              <div className="text-xl font-bold text-foreground">{xpStats.total_users}</div>
              <div className="text-xs text-muted-foreground">Estudantes</div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-green-500/30">
            <CardContent className="p-4 text-center">
              <Star className="h-5 w-5 text-green-500 mx-auto mb-1.5" />
              <div className="text-xl font-bold text-foreground">{xpStats.total_xp_distributed.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">XP Total</div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-500/30">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 text-purple-500 mx-auto mb-1.5" />
              <div className="text-xl font-bold text-foreground">{Math.round(xpStats.average_xp)}</div>
              <div className="text-xs text-muted-foreground">XP Médio</div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-orange-500/30">
            <CardContent className="p-4 text-center">
              <Crown className="h-5 w-5 text-orange-500 mx-auto mb-1.5" />
              <div className="text-xl font-bold text-foreground">{xpStats.max_xp.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">XP Máximo</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de ranking */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="global" className="rounded-lg">
            <Trophy className="h-4 w-4 mr-2" />
            Global
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="rounded-lg">
            <Target className="h-4 w-4 mr-2" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="rounded-lg">
            <Zap className="h-4 w-4 mr-2" />
            Quizzes
          </TabsTrigger>
        </TabsList>

        {/* Ranking Global */}
        <TabsContent value="global" className="space-y-4">
          <Card className="border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold mb-4">Ranking Global</h2>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking de Flashcards */}
        <TabsContent value="flashcards" className="space-y-4">
          <Card className="border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold mb-4">Ranking de Flashcards</h2>
              <div className="space-y-3">
                {flashcardRanking.map((user, index) => (
                  <RankingCard
                    key={user.user_id}
                    user={user}
                    position={index + 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking de Quizzes */}
        <TabsContent value="quizzes" className="space-y-4">
          <Card className="border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold mb-4">Ranking de Quizzes</h2>
              <div className="space-y-3">
                {quizRanking.map((user, index) => (
                  <RankingCard
                    key={user.user_id}
                    user={user}
                    position={index + 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Seção de Conquistas */}
      {userAchievements.length > 0 && (
        <Card className="border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold mb-4">Suas Conquistas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userAchievements.slice(0, 6).map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-xl">
                      <Award className="h-5 w-5 text-white" />
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
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => navigate('/achievements')}
                >
                  Ver Todas as Conquistas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
