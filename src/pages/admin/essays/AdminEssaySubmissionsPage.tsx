import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Eye,
  Trash2,
  MoreHorizontal,
  GitCompareArrows,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

const mockPrompt = {
  id: 1,
  theme: 'Inteligência Artificial e o Futuro do Trabalho',
}

const mockSubmissions = [
  {
    id: 1,
    student: 'João Pedro',
    date: '20/10/2025',
    status: 'corrected',
    grade: 920,
  },
  {
    id: 3,
    student: 'Maria Silva',
    date: '28/09/2025',
    status: 'correcting',
    grade: null,
  },
  {
    id: 4,
    student: 'Carlos Souza',
    date: '25/09/2025',
    status: 'draft',
    grade: null,
  },
]

const statusMap = {
  draft: { label: 'Aguardando Correção', variant: 'secondary' },
  correcting: { label: 'Em Correção', variant: 'outline' },
  corrected: { label: 'Corrigida', variant: 'default' },
} as const

export default function AdminEssaySubmissionsPage() {
  const { promptId } = useParams()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>([])

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id].slice(-2),
    )
  }

  const handleCompare = () => {
    if (selected.length === 2) {
      navigate(`/admin/essays/compare?ids=${selected.join(',')}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/admin/essays')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Envios: {mockPrompt.theme}</CardTitle>
              <CardDescription>
                Gerencie as redações enviadas para este tema.
              </CardDescription>
            </div>
          </div>
          {selected.length === 2 && (
            <Button onClick={handleCompare}>
              <GitCompareArrows className="mr-2 h-4 w-4" />
              Comparar ({selected.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Data de Envio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Nota</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockSubmissions.map((essay) => (
              <TableRow key={essay.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(String(essay.id))}
                    onCheckedChange={() => handleSelect(String(essay.id))}
                  />
                </TableCell>
                <TableCell className="font-medium">{essay.student}</TableCell>
                <TableCell>{essay.date}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      statusMap[essay.status as keyof typeof statusMap].variant
                    }
                  >
                    {statusMap[essay.status as keyof typeof statusMap].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {essay.grade ?? '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/essays/submissions/${essay.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          {essay.status === 'corrected'
                            ? 'Ver Correção'
                            : 'Corrigir'}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar Envio
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
