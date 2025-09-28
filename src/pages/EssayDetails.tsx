import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { ArrowLeft, FileDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getStudentEssayDetails,
  type StudentEssayDetails,
} from '@/services/essayService'
import { SectionLoader } from '@/components/SectionLoader'
import { FeedbackReport } from '@/components/essays/FeedbackReport'
import { ProgressChart } from '@/components/essays/ProgressChart'

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
    return <div>Redação não encontrada.</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/redacoes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Detalhes da Redação</h1>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/redacoes/${essayId}/report`} target="_blank">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Link>
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FeedbackReport essay={essay} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-20">
            <CardHeader className="items-center text-center">
              <CardTitle>Nota Final</CardTitle>
              <p className="text-6xl font-bold text-primary">
                {essay.final_grade}
              </p>
              <Badge>
                {essay.status === 'corrected' ? 'Corrigida' : 'Em Correção'}
              </Badge>
            </CardHeader>
          </Card>
          <ProgressChart data={mockProgressData} />
        </div>
      </div>
    </div>
  )
}
