import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'
import {
  getFlashcardSessionHistory,
  type FlashcardSession,
} from '@/services/flashcardService'
import { SectionLoader } from '@/components/SectionLoader'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function FlashcardSessionHistoryPage() {
  const [history, setHistory] = useState<FlashcardSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getFlashcardSessionHistory()
      .then(setHistory)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <SectionLoader />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Sessões de Flashcards</CardTitle>
        <CardDescription>
          Revise seu desempenho em sessões de estudo anteriores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tópico</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Modo</TableHead>
              <TableHead className="text-center">Desempenho</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">
                  <p>{session.topicTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.subjectName}
                  </p>
                </TableCell>
                <TableCell>
                  {format(new Date(session.date), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{session.mode}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {session.correct}/{session.totalCards}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/flashcards/session/${session.id}/result`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
