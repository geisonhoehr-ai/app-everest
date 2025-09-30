import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Trophy, 
  Target, 
  TrendingUp,
  Award,
  BarChart3,
  ArrowRight,
  RotateCcw,
  Star,
  Brain,
  BookOpen
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'

const resultsData = {
  totalQuestions: 90,
  correctAnswers: 78,
  timeTaken: '02:45:30',
  performanceByArea: [
    { name: 'História', acertos: 20, total: 25 },
    { name: 'Geografia', acertos: 18, total: 25 },
    { name: 'Filosofia', acertos: 22, total: 25 },
    { name: 'Sociologia', acertos: 18, total: 15 },
  ],
}

export default function SimulationResultsPage() {
  const { simulationId } = useParams()
  const percentage = Math.round(
    (resultsData.correctAnswers / resultsData.totalQuestions) * 100,
  )

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excelente', color: 'green', icon: Trophy }
    if (percentage >= 80) return { level: 'Muito Bom', color: 'blue', icon: Star }
    if (percentage >= 70) return { level: 'Bom', color: 'yellow', icon: Target }
    if (percentage >= 60) return { level: 'Regular', color: 'orange', icon: TrendingUp }
    return { level: 'Precisa melhorar', color: 'red', icon: Brain }
  }

  const performance = getPerformanceLevel(percentage)
  const PerformanceIcon = performance.icon

  return (
    <MagicLayout 
      title="Relatório de Desempenho"
      description={`Simulado Nacional - Humanas • ${percentage}% de aproveitamento`}
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
                <p className="text-muted-foreground text-lg">Simulado Nacional - Humanas</p>
              </div>
            </div>

            {/* Score Display */}
            <div className="space-y-6">
              <div className="relative">
                <div className="text-8xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  {percentage}%
                </div>
                <div className="text-2xl font-semibold text-muted-foreground">
                  {resultsData.correctAnswers} de {resultsData.totalQuestions} questões corretas
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
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-green-600">{resultsData.correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Acertos</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
                <Target className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-red-600">{resultsData.totalQuestions - resultsData.correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-600">{resultsData.timeTaken}</div>
                <div className="text-sm text-muted-foreground">Tempo</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Performance by Area */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Desempenho por Área</h2>
            </div>

            <div className="space-y-4">
              {resultsData.performanceByArea.map((area, index) => {
                const areaPercentage = Math.round((area.acertos / area.total) * 100)
                return (
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
                        <div className="text-2xl font-bold text-primary">{areaPercentage}%</div>
                        <div className="text-sm text-muted-foreground">Aproveitamento</div>
                      </div>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${areaPercentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <ChartContainer config={{}} className="h-64 w-full">
                <BarChart data={resultsData.performanceByArea} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="acertos" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </MagicCard>

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
            <Button 
              variant="outline" 
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300 py-3 px-8 rounded-xl"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Revisar Gabarito
            </Button>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
