import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { 
  ArrowLeft, 
  FileDown, 
  FileText, 
  Calendar, 
  Clock, 
  Award,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Star,
  Target,
  BookOpen
} from 'lucide-react'
import {
  getStudentEssayDetails,
  type StudentEssayDetails,
} from '@/services/essayService'
import { SectionLoader } from '@/components/SectionLoader'
import { FeedbackReport } from '@/components/essays/FeedbackReport'
import { ProgressChart } from '@/components/essays/ProgressChart'
import { cn } from '@/lib/utils'

const mockProgressData = [
  { date: 'Ago/25', grade: 880 },
  { date: 'Set/25', grade: 900 },
  { date: 'Out/25', grade: 920 },
]

export default function EssayDetailsPage() {
  const { essayId } = useParams<{ essayId: string }>()
  const [essay, setEssay] = useState<StudentEssayDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (essayId) {
      getStudentEssayDetails(essayId)
        .then(setEssay)
        .finally(() => setIsLoading(false))
    }
  }, [essayId])

  if (isLoading) {
    return <SectionLoader />
  }

  if (!essay) {
    return (
      <MagicLayout title="Redação não encontrada">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-2">Redação não encontrada</h2>
          <p className="text-muted-foreground mb-6">
            A redação que você está procurando não existe ou foi removida.
          </p>
          <Button asChild>
            <Link to="/redacoes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar às Redações
            </Link>
          </Button>
        </div>
      </MagicLayout>
    )
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 900) return 'text-green-600'
    if (grade >= 800) return 'text-blue-600'
    if (grade >= 700) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeLevel = (grade: number) => {
    if (grade >= 900) return { level: 'Excelente', color: 'green' }
    if (grade >= 800) return { level: 'Bom', color: 'blue' }
    if (grade >= 700) return { level: 'Regular', color: 'yellow' }
    return { level: 'Precisa melhorar', color: 'red' }
  }

  const gradeLevel = getGradeLevel(essay.final_grade)

  return (
    <MagicLayout 
      title="Detalhes da Redação"
      description={`Nota: ${essay.final_grade} • ${essay.status === 'corrected' ? 'Corrigida' : 'Em Correção'}`}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            asChild
            className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
          >
            <Link to="/redacoes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar às Redações
            </Link>
          </Button>
          <Button 
            variant="outline" 
            asChild
            className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
          >
            <Link to={`/redacoes/${essayId}/report`} target="_blank">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Essay Header */}
            <MagicCard variant="premium" size="lg">
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                          Redação #{essayId}
                        </h1>
                        <p className="text-muted-foreground text-lg">
                          Análise detalhada e feedback
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold",
                    gradeLevel.color === 'green' && "bg-green-500/10 border-green-500/30 text-green-600",
                    gradeLevel.color === 'blue' && "bg-blue-500/10 border-blue-500/30 text-blue-600",
                    gradeLevel.color === 'yellow' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-600",
                    gradeLevel.color === 'red' && "bg-red-500/10 border-red-500/30 text-red-600"
                  )}>
                    {essay.status === 'corrected' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {essay.status === 'corrected' ? 'Corrigida' : 'Em Correção'}
                    </span>
                  </div>
                </div>

                {/* Essay Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">{essay.final_grade}</div>
                    <div className="text-sm text-muted-foreground">Nota Final</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                    <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">25/10</div>
                    <div className="text-sm text-muted-foreground">Data</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                    <Clock className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">45min</div>
                    <div className="text-sm text-muted-foreground">Tempo</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                    <BookOpen className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">850</div>
                    <div className="text-sm text-muted-foreground">Palavras</div>
                  </div>
                </div>
              </div>
            </MagicCard>

            {/* Feedback Report */}
            <MagicCard variant="glass" size="lg">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Relatório de Feedback</h2>
                </div>
                <FeedbackReport essay={essay} />
              </div>
            </MagicCard>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Grade Card */}
            <MagicCard variant="premium" className="sticky top-24 text-center">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Nota Final</h3>
                  <div className="relative">
                    <div className={cn(
                      "text-8xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                      getGradeColor(essay.final_grade)
                    )}>
                      {essay.final_grade}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      de 1000 pontos
                    </div>
                  </div>
                  
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold",
                    gradeLevel.color === 'green' && "bg-green-500/10 border-green-500/30 text-green-600",
                    gradeLevel.color === 'blue' && "bg-blue-500/10 border-blue-500/30 text-blue-600",
                    gradeLevel.color === 'yellow' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-600",
                    gradeLevel.color === 'red' && "bg-red-500/10 border-red-500/30 text-red-600"
                  )}>
                    <Star className="h-4 w-4" />
                    {gradeLevel.level}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">85%</div>
                      <div className="text-xs text-muted-foreground">Acima da média</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-muted-foreground">+40</div>
                      <div className="text-xs text-muted-foreground">vs. anterior</div>
                    </div>
                  </div>
                </div>
              </div>
            </MagicCard>

            {/* Progress Chart */}
            <MagicCard variant="glass" size="lg">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold">Evolução</h3>
                </div>
                <ProgressChart data={mockProgressData} />
              </div>
            </MagicCard>
          </div>
        </div>
      </div>
    </MagicLayout>
  )
}
