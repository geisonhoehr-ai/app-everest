import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Printer } from 'lucide-react'
import { ProgressChart } from '@/components/essays/ProgressChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const mockProgressData = [
  { date: 'Ago/25', grade: 880 },
  { date: 'Set/25', grade: 900 },
  { date: 'Out/25', grade: 920 },
]

const mockErrorTrends = [
  { category: 'Concordância', count: 12 },
  { category: 'Crase', count: 8 },
  { category: 'Coesão', count: 5 },
]

export default function EssayEvolutionReportPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container py-8 mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <h1 className="text-2xl font-bold">Relatório de Evolução</h1>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
        <div className="p-8 border rounded-lg space-y-8 bg-card">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Evolução em Redações</h2>
            <p className="text-muted-foreground">Aluno: João Pedro</p>
          </div>
          <Separator />
          <ProgressChart data={mockProgressData} />
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Erros</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mockErrorTrends.map((trend) => (
                  <li key={trend.category} className="flex justify-between">
                    <span>{trend.category}</span>
                    <span className="font-semibold">
                      {trend.count} ocorrências
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
