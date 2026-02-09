import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface ProgressChartProps {
  data: { date: string; grade: number }[]
}

export const ProgressChart = ({ data }: ProgressChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução das Notas</CardTitle>
        <CardDescription>
          Seu progresso nas redações ao longo do tempo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-64 w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis domain={[0, 1000]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="grade"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{
                fill: 'hsl(var(--primary))',
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
