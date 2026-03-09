import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  FileText,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { SectionLoader } from '@/components/SectionLoader'
import { cn } from '@/lib/utils'
import {
  getEssaySubmissions,
  getEssayPromptById,
  getEssayPromptStats,
} from '@/services/adminEssayService'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  submitted: { label: 'Aguardando', variant: 'secondary' },
  correcting: { label: 'Em Correção', variant: 'outline' },
  corrected: { label: 'Corrigida', variant: 'default' },
  draft: { label: 'Rascunho', variant: 'secondary' },
}

interface Submission {
  id: string
  status: string
  final_grade: number | null
  submission_date: string | null
  created_at: string
  users: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
}

export default function AdminEssaySubmissionsPage() {
  const { promptId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [promptTitle, setPromptTitle] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState({ total: 0, corrected: 0, pending: 0, averageGrade: 0 })
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (promptId) loadData()
  }, [promptId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [prompt, subs, promptStats] = await Promise.all([
        getEssayPromptById(promptId!),
        getEssaySubmissions(promptId!),
        getEssayPromptStats(promptId!),
      ])
      setPromptTitle(prompt?.title || 'Tema')
      setSubmissions((subs as any) || [])
      setStats(promptStats)
    } catch (error: any) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id].slice(-2),
    )
  }

  const handleCompare = () => {
    if (selected.length === 2) {
      navigate(`/admin/essays/compare?ids=${selected.join(',')}`)
    }
  }

  if (loading) return <SectionLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/admin/essays"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Envios</h1>
          <p className="text-sm text-muted-foreground mt-1">{promptTitle}</p>
        </div>
        {selected.length === 2 && (
          <Button onClick={handleCompare} className="gap-2">
            <GitCompareArrows className="h-4 w-4" />
            Comparar
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-500/30">
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{stats.corrected}</div>
            <div className="text-xs text-muted-foreground">Corrigidas</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-orange-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-orange-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 text-purple-500 mx-auto mb-1.5" />
            <div className="text-xl font-bold text-foreground">{stats.averageGrade}</div>
            <div className="text-xs text-muted-foreground">Média</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Nenhum envio para este tema ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]" />
                    <TableHead>Aluno</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Nota</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => {
                    const statusInfo = STATUS_MAP[sub.status] || STATUS_MAP.submitted
                    const studentName = sub.users
                      ? `${sub.users.first_name} ${sub.users.last_name}`
                      : 'Aluno desconhecido'
                    const date = sub.submission_date || sub.created_at
                    const formattedDate = date
                      ? new Date(date).toLocaleDateString('pt-BR')
                      : '—'

                    return (
                      <TableRow key={sub.id} className="transition-colors hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selected.includes(sub.id)}
                            onCheckedChange={() => handleSelect(sub.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{studentName}</TableCell>
                        <TableCell className="text-muted-foreground">{formattedDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant={statusInfo.variant}
                            className={cn(
                              sub.status === 'corrected' &&
                                'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30',
                            )}
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {sub.final_grade ?? '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/essays/submissions/${sub.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {sub.status === 'corrected' ? 'Ver Correção' : 'Corrigir'}
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
