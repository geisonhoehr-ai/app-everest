import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import {
  CheckCircle,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Star,
  Brain,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Loader2,
  BarChart3
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { getSimulationResult, getLastAttempt } from '@/services/simulationService'

export default function SimulationResultsPage() {
  const { simulationId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [performanceByArea, setPerformanceByArea] = useState<any[]>([])

  useEffect(() => {
    if (simulationId && user) {
      loadResults()
    }
  }, [simulationId, user])

  const loadResults = async () => {
    try {
      setLoading(true)
      // 1. Get the attempt ID
      const lastAttempt = await getLastAttempt(simulationId!, user!.id)

      if (!lastAttempt || lastAttempt.status !== 'submitted') {
        // Redirect to exam if no submitted attempt found
        navigate(`/simulados/${simulationId}`)
        return
      }

      // 2. Get full details
      const fullResult = await getSimulationResult(lastAttempt.id)
      setResult(fullResult)

      // 3. Calculate performance by area
      if (fullResult.answers) {
        const areaStats: Record<string, { total: number; correct: number }> = {}

        fullResult.answers.forEach((ans: any) => {
          const subject = ans.question?.subject || 'Geral'
          if (!areaStats[subject]) {
            areaStats[subject] = { total: 0, correct: 0 }
          }
          areaStats[subject].total++
          if (ans.is_correct) {
            areaStats[subject].correct++
          }
        })

        const chartData = Object.entries(areaStats).map(([name, stats]) => ({
          name,
          acertos: stats.correct,
          total: stats.total,
          percentage: Math.round((stats.correct / stats.total) * 100)
        }))

        setPerformanceByArea(chartData)
      }

    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MagicLayout title="Carregando Resultados..." description="Calculando sua nota...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MagicLayout>
    )
  }

  if (!result) return null

  const percentage = Math.round(result.percentage || 0)
  const totalQuestions = result.answers?.length || 0
  const correctAnswers = result.answers?.filter((a: any) => a.is_correct).length || 0

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excelente', color: 'green', icon: Trophy }
    if (percentage >= 80) return { level: 'Muito Bom', color: 'blue', icon: Star }
    if (percentage >= 70) return { level: 'Bom', color: 'yellow', icon: Target }
    if (percentage >= 60) return { level: 'Regular', color: 'orange', icon: TrendingUp }
    return { level: 'Precisa melhorar', color: 'red', icon: Brain }
  }

  const performance = getPerformanceLevel(percentage)
  const PerformanceIcon = performance.icon

  const formatTime = (seconds?: number) => {
    if (!seconds) return '--:--'
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  return (
    <MagicLayout
      title="Relatório de Desempenho"
      description={`${result.quiz?.title || 'Simulado'} • ${percentage}% de aproveitamento`}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Results Header */}
        <MagicCard variant="premium" size="lg" className="text-center">
          <div className="space-y-8">
            <div className="flex items-center justify-center gap-4">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10">
                <PerformanceIcon className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Simulado Concluído!
                </h1>
                <p className="text-muted-foreground text-lg">{result.quiz?.title}</p>
              </div>
            </div>

            {/* Score Display */}
            <div className="space-y-6">
              <div className="relative">
                <div className="text-8xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  {percentage}%
                </div>
                <div className="text-2xl font-semibold text-muted-foreground">
                  {correctAnswers} de {totalQuestions} questões corretas
                </div>
              </div>

              {/* Performance Badge */}
              <div className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 font-semibold",
                performance.color === 'green' && "bg-green-500/10 border-green-500/30 text-green-600",
                performance.color === 'blue' && "bg-blue-500/10 border-blue-500/30 text-blue-600",
                performance.color === 'yellow' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-600",
                performance.color === 'orange' && "bg-orange-500/10 border-orange-500/30 text-orange-600",
                performance.color === 'red' && "bg-red-500/10 border-red-500/30 text-red-600"
              )}>
                <PerformanceIcon className="h-5 w-5" />
                {performance.level}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Acertos</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
                <Target className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-600">{formatTime(result.time_spent_seconds)}</div>
                <div className="text-sm text-muted-foreground">Tempo</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Performance by Area */}
        {performanceByArea.length > 0 && (
          <MagicCard variant="glass" size="lg">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Desempenho por Área</h2>
              </div>

              <div className="space-y-4">
                {performanceByArea.map((area) => (
                  <div key={area.name} className="p-4 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{area.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {area.acertos} de {area.total} questões
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{area.percentage}%</div>
                        <div className="text-sm text-muted-foreground">Aproveitamento</div>
                      </div>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${area.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <ChartContainer config={{}} className="h-64 w-full">
                  <BarChart data={performanceByArea} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="acertos" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </MagicCard>
        )}

        {/* Action Buttons */}
        <MagicCard variant="premium" size="lg">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Link to="/simulados">
                <ArrowRight className="mr-2 h-5 w-5" />
                Ver Outros Simulados
              </Link>
            </Button>
            {/* 
            <Button 
              variant="outline" 
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300 py-3 px-8 rounded-xl"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Revisar Gabarito
            </Button>
            */}
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
