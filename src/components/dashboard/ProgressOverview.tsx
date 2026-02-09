import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
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

const chartData = [
  { day: 'Seg', hours: 2.5 },
  { day: 'Ter', hours: 3 },
  { day: 'Qua', hours: 4 },
  { day: 'Qui', hours: 2 },
  { day: 'Sex', hours: 5 },
  { day: 'Sáb', hours: 6 },
  { day: 'Dom', hours: 1.5 },
]

const chartConfig = {
  hours: {
    label: 'Horas de Estudo',
    color: 'hsl(var(--primary))',
  },
}

export const ProgressOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso Semanal</CardTitle>
        <CardDescription>Horas de estudo nos últimos 7 dias.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="hours" fill="var(--color-hours)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
