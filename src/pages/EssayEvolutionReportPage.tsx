import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Printer, ArrowLeft, TrendingUp } from 'lucide-react'
import { ProgressChart } from '@/components/essays/ProgressChart'
import { useAuth } from '@/hooks/use-auth'
import { getUserEssaysList, type EssayListItem } from '@/services/essayService'
import { SectionLoader } from '@/components/SectionLoader'
import { Link } from 'react-router-dom'

export default function EssayEvolutionReportPage() {
  const { user } = useAuth()
  const [essays, setEssays] = useState<EssayListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    getUserEssaysList(user.id)
      .then(setEssays)
      .finally(() => setLoading(false))
  }, [user?.id])

  if (loading) return <SectionLoader />

  const corrected = essays
    .filter((e) => e.status === 'Corrigida' && e.grade !== null)
    .reverse()

  const progressData = corrected.map((e) => ({
    date: e.date,
    grade: e.grade!,
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <Link
            to="/redacoes"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Evolução em Redações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.user_metadata?.first_name || 'Aluno'} · {corrected.length} redações corrigidas
          </p>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Progress Chart */}
      {progressData.length > 0 ? (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Evolução de Notas</h2>
            </div>
            <ProgressChart data={progressData} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm">
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground">
              Nenhuma redação corrigida ainda. Envie redações para acompanhar sua evolução.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grades table */}
      {corrected.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-3">
            <h3 className="font-semibold text-foreground">Histórico de Notas</h3>
            <div className="space-y-2">
              {corrected.map((e, idx) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 transition-all duration-200 hover:shadow-md hover:border-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-6">
                      {idx + 1}.
                    </span>
                    <span className="text-sm font-medium text-foreground">{e.theme}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{e.date}</span>
                    <span className="text-sm font-bold text-primary">{e.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
