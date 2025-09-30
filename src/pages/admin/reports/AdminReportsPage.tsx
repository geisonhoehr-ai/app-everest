import { useState } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Download,
  Calendar,
  Target,
  Award,
  Clock
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState('30d')

  const statsCards = [
    {
      title: 'Usuários Ativos',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Cursos Concluídos',
      value: '89',
      change: '+8.2%',
      trend: 'up',
      icon: BookOpen,
      color: 'from-green-500/20 to-green-600/10',
      iconColor: 'text-green-500'
    },
    {
      title: 'Redações Corrigidas',
      value: '456',
      change: '+15.3%',
      trend: 'up',
      icon: FileText,
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-500'
    },
    {
      title: 'Taxa de Aprovação',
      value: '87.5%',
      change: '+2.1%',
      trend: 'up',
      icon: Target,
      color: 'from-orange-500/20 to-orange-600/10',
      iconColor: 'text-orange-500'
    }
  ]

  return (
    <MagicLayout 
      title="Relatórios e Análises"
      description="Visualize métricas e estatísticas detalhadas da plataforma"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Tabs value={dateRange} onValueChange={setDateRange} className="w-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="7d">7 dias</TabsTrigger>
              <TabsTrigger value="30d">30 dias</TabsTrigger>
              <TabsTrigger value="90d">90 dias</TabsTrigger>
              <TabsTrigger value="1y">1 ano</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Personalizar Data
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <MagicCard key={index} variant="glass" glow>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <TrendingUp className="h-4 w-4" />
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                </div>
              </div>
            </MagicCard>
          ))}
        </div>

        {/* Main Reports */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="performance">Desempenho</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resumo Executivo
                </CardTitle>
                <CardDescription>
                  Principais indicadores e tendências da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Tempo Médio de Estudo
                    </div>
                    <p className="text-2xl font-bold">2.5h/dia</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      Conquistas Desbloqueadas
                    </div>
                    <p className="text-2xl font-bold">1,892</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Taxa de Engajamento
                    </div>
                    <p className="text-2xl font-bold">78.5%</p>
                  </div>
                </div>

                <div className="h-64 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Gráfico de tendências será exibido aqui</p>
                  </div>
                </div>
              </CardContent>
            </MagicCard>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Relatório de Usuários
                </CardTitle>
                <CardDescription>
                  Análise detalhada do comportamento e engajamento dos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl">
                  <div className="text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Relatório de usuários será exibido aqui</p>
                  </div>
                </div>
              </CardContent>
            </MagicCard>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Relatório de Conteúdo
                </CardTitle>
                <CardDescription>
                  Estatísticas de cursos, quizzes, flashcards e redações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl">
                  <div className="text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Relatório de conteúdo será exibido aqui</p>
                  </div>
                </div>
              </CardContent>
            </MagicCard>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Relatório de Desempenho
                </CardTitle>
                <CardDescription>
                  Métricas de desempenho e aproveitamento dos alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl">
                  <div className="text-center text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Relatório de desempenho será exibido aqui</p>
                  </div>
                </div>
              </CardContent>
            </MagicCard>
          </TabsContent>
        </Tabs>
      </div>
    </MagicLayout>
  )
}
