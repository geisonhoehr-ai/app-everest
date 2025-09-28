import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle, Clock, FileText } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'

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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Relatório de Desempenho</CardTitle>
          <CardDescription>Simulado Nacional - Humanas</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3 text-center">
          <div>
            <p className="text-muted-foreground">Acertos</p>
            <p className="text-4xl font-bold">
              {resultsData.correctAnswers}/{resultsData.totalQuestions}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Aproveitamento</p>
            <p className="text-4xl font-bold text-primary">{percentage}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tempo Gasto</p>
            <p className="text-4xl font-bold">{resultsData.timeTaken}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Área</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button asChild>
          <Link to="/simulados">Ver Outros Simulados</Link>
        </Button>
        <Button variant="outline">Revisar Gabarito</Button>
      </div>
    </div>
  )
}
