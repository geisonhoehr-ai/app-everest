import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileCheck,
  Send,
  Calendar,
  Trophy,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  BarChart2,
  Target,
  PlayCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AnswerSheet {
  id: string
  title: string
  description?: string
  scheduled_start?: string
  scheduled_end?: string
  total_points: number
  passing_score?: number
  user_attempts?: Array<{
    id: string
    percentage?: number
    status: string
    submitted_at?: string
  }>
}

export default function AnswerSheetsListPage() {
  const { toast } = useToast()
  const [sheets, setSheets] = useState<AnswerSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    available: 0,
    submitted: 0,
    average: 0,
    best: 0
  })

  useEffect(() => {
    loadAnswerSheets()
  }, [])

  const loadAnswerSheets = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Buscar cartões resposta
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('type', 'answer_sheet')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (quizzesError) throw quizzesError

      // Buscar tentativas do usuário
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .in('quiz_id', quizzes?.map(q => q.id) || [])
        .order('submitted_at', { ascending: false })

      if (attemptsError) throw attemptsError

      // Agrupar tentativas por quiz
      const attemptsMap = new Map<string, typeof attempts>()
      attempts?.forEach(attempt => {
        const existing = attemptsMap.get(attempt.quiz_id) || []
        attemptsMap.set(attempt.quiz_id, [...existing, attempt])
      })

      // Combinar dados
      const combined = quizzes?.map(quiz => ({
        ...quiz,
        user_attempts: attemptsMap.get(quiz.id) || []
      })) || []

      setSheets(combined)

      // Calcular estatísticas
      const submittedAttempts = attempts?.filter(a => a.status === 'submitted') || []
      const available = combined.filter(s => getSheetStatus(s) === 'available').length
      const submitted = submittedAttempts.length
      const avgScore = submitted > 0
        ? submittedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / submitted
        : 0
      const bestScore = submittedAttempts.reduce((max, a) => Math.max(max, a.percentage || 0), 0)

      setStats({
        available,
        submitted,
        average: Math.round(avgScore),
        best: Math.round(bestScore)
      })

    } catch (error: any) {
      toast({
        title: 'Erro ao carregar cartões',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getSheetStatus = (sheet: AnswerSheet): 'available' | 'submitted' | 'expired' | 'scheduled' => {
    const now = new Date()

    if (sheet.scheduled_end && new Date(sheet.scheduled_end) < now) {
      return 'expired'
    }

    if (sheet.scheduled_start && new Date(sheet.scheduled_start) > now) {
      return 'scheduled'
    }

    const hasSubmitted = sheet.user_attempts?.some(a => a.status === 'submitted')
    if (hasSubmitted) {
      return 'submitted'
    }

    return 'available'
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível'
      case 'submitted': return 'Enviado'
      case 'expired': return 'Encerrado'
      case 'scheduled': return 'Agendado'
      default: return 'Desconhecido'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/10 border-green-500/20 text-green-600'
      case 'submitted':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600'
      case 'expired':
        return 'bg-gray-500/10 border-gray-500/20 text-gray-600'
      case 'scheduled':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-600'
      default:
        return 'bg-muted/10 border-muted/20 text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <Send className="h-3 w-3" />
      case 'submitted':
        return <CheckCircle className="h-3 w-3" />
      case 'expired':
        return <AlertCircle className="h-3 w-3" />
      case 'scheduled':
        return <Clock className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <MagicLayout title="Carregando..." description="Aguarde...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title="Cartões Resposta"
      description="Preencha os cartões das provas presenciais"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <FileCheck className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                    Cartões Resposta
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Provas presenciais - Preencha o cartão online
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Send className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">{stats.available}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Disponíveis</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">{stats.submitted}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Enviados</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <BarChart2 className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">{stats.average}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Média</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Trophy className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">{stats.best}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Melhor</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Sheets Table */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Provas Disponíveis</h2>
            </div>

            <div className="rounded-xl overflow-hidden border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/20 to-muted/10 border-border/50">
                    <TableHead className="font-semibold">Nome da Prova</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Nota</TableHead>
                    <TableHead className="text-right font-semibold">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum cartão resposta disponível no momento
                      </TableCell>
                    </TableRow>
                  ) : (
                    sheets.map((sheet, index) => {
                      const status = getSheetStatus(sheet)
                      const lastAttempt = sheet.user_attempts?.[0]
                      const formattedDate = sheet.scheduled_start
                        ? format(new Date(sheet.scheduled_start), "dd/MM/yyyy", { locale: ptBR })
                        : '-'

                      return (
                        <TableRow
                          key={sheet.id}
                          className={cn(
                            "group hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 transition-all duration-300",
                            "border-border/50"
                          )}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                                <span className="text-sm font-bold text-primary">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold">{sheet.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {sheet.description || 'Prova presencial'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formattedDate}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "flex items-center gap-2 px-3 py-1 rounded-full border font-medium",
                              getStatusColor(status)
                            )}>
                              {getStatusIcon(status)}
                              {getStatusLabel(status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {lastAttempt && lastAttempt.status === 'submitted' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Trophy className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">
                                  {lastAttempt.percentage?.toFixed(0)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {status === 'available' && (
                                <Button
                                  size="sm"
                                  asChild
                                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold"
                                >
                                  <Link to={`/cartao-resposta/${sheet.id}`}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Preencher
                                  </Link>
                                </Button>
                              )}
                              {status === 'submitted' && lastAttempt && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/cartao-resposta/${sheet.id}/resultado?attemptId=${lastAttempt.id}`}>
                                    <BarChart2 className="mr-2 h-4 w-4" />
                                    Ver Nota
                                  </Link>
                                </Button>
                              )}
                              {status === 'expired' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="opacity-50 cursor-not-allowed"
                                >
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Encerrado
                                </Button>
                              )}
                              {status === 'scheduled' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="opacity-50 cursor-not-allowed"
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Agendado
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
