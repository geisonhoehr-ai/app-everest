import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { logger } from '@/lib/logger'
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
import {
  PlusCircle,
  Pencil,
  Archive,
  Users,
  Copy,
  Link as LinkIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAllInvites, archiveInvite, updateInvite } from '@/services/inviteService'
import { useToast } from '@/components/ui/use-toast'
import { SectionLoader } from '@/components/SectionLoader'

interface InviteRow {
  id: string
  slug: string
  title: string
  description?: string | null
  status: 'active' | 'archived'
  invite_registrations: { count: number }[]
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const { toast } = useToast()

  const loadInvites = async () => {
    try {
      setLoading(true)
      const data = await getAllInvites()
      setInvites(data as unknown as InviteRow[])
    } catch (error) {
      logger.error('Erro ao carregar convites:', error)
      toast({
        title: 'Erro ao carregar',
        description: 'Nao foi possivel carregar os convites.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvites()
  }, [])

  const handleArchive = async (invite: InviteRow) => {
    const action = invite.status === 'active' ? 'arquivar' : 'reativar'
    if (!confirm(`Tem certeza que deseja ${action} o convite "${invite.title}"?`)) return

    try {
      if (invite.status === 'active') {
        await archiveInvite(invite.id)
      } else {
        await updateInvite(invite.id, { status: 'active' })
      }
      toast({
        title: invite.status === 'active' ? 'Convite arquivado' : 'Convite reativado',
        description: `O convite foi ${invite.status === 'active' ? 'arquivado' : 'reativado'} com sucesso.`,
      })
      loadInvites()
    } catch (error) {
      logger.error('Erro ao atualizar convite:', error)
      toast({
        title: 'Erro',
        description: `Nao foi possivel ${action} o convite.`,
        variant: 'destructive',
      })
    }
  }

  const handleCopyLink = async (slug: string) => {
    const url = `${window.location.origin}/invite/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copiado!', description: url })
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel copiar o link.', variant: 'destructive' })
    }
  }

  const activeInvites = invites.filter((i) => i.status === 'active')
  const archivedInvites = invites.filter((i) => i.status === 'archived')
  const filtered = tab === 'active' ? activeInvites : archivedInvites

  const getRegistrationCount = (invite: InviteRow) => {
    return invite.invite_registrations?.[0]?.count ?? 0
  }

  if (loading) {
    return <SectionLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Convites</h1>
          <p className="text-muted-foreground mt-1">Gerencie convites e links de inscricao</p>
        </div>
        <Button asChild className="px-6 py-3 rounded-xl font-semibold">
          <Link to="/admin/invites/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Convite
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'archived')}>
        <TabsList>
          <TabsTrigger value="active">
            Ativos ({activeInvites.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Arquivados ({archivedInvites.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-border shadow-sm">
        <CardContent className="p-5">
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Titulo</TableHead>
                  <TableHead className="font-semibold">Inscritos</TableHead>
                  <TableHead className="font-semibold">Link de divulgacao</TableHead>
                  <TableHead className="text-right font-semibold">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {tab === 'active'
                        ? 'Nenhum convite ativo. Crie seu primeiro convite!'
                        : 'Nenhum convite arquivado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((invite) => {
                    const inviteUrl = `${window.location.origin}/invite/${invite.slug}`
                    return (
                      <TableRow key={invite.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium max-w-xs">
                          <div>
                            <p className="font-semibold text-foreground">{invite.title}</p>
                            {invite.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {invite.description.length > 80
                                  ? invite.description.slice(0, 80) + '...'
                                  : invite.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="cursor-pointer">
                            <Users className="h-3 w-3 mr-1" />
                            {getRegistrationCount(invite)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded max-w-[250px] truncate block">
                              {inviteUrl}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleCopyLink(invite.slug)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link to={`/admin/invites/${invite.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleArchive(invite)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
