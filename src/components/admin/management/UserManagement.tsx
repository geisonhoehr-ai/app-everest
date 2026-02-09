import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { logger } from '@/lib/logger'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoreHorizontal, PlusCircle, Search, Edit, Trash2, UserX, UserCheck, RefreshCw, GraduationCap, Users as UsersIcon } from 'lucide-react'
import { getUsers, updateUser, type User, getUsersWithClasses, type UserWithClasses } from '@/services/adminUserService'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'

export const UserManagement = () => {
  const [users, setUsers] = useState<UserWithClasses[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithClasses[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, statusFilter, classFilter])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await getUsersWithClasses()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      logger.error('❌ Erro ao carregar usuários:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        statusFilter === 'active' ? user.is_active : !user.is_active
      )
    }

    // Filter by class (Degustação)
    if (classFilter === 'tasting') {
      filtered = filtered.filter(user => user.isInTastingClass)
    } else if (classFilter === 'not_tasting') {
      filtered = filtered.filter(user => !user.isInTastingClass && user.role === 'student')
    } else if (classFilter === 'no_class') {
      filtered = filtered.filter(user =>
        user.role === 'student' && (!user.classes || user.classes.length === 0)
      )
    }

    setFilteredUsers(filtered)
  }

  const handleToggleStatus = async (user: User) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active })
      toast({
        title: 'Sucesso',
        description: `Usuário ${user.is_active ? 'desativado' : 'ativado'} com sucesso.`,
      })
      loadUsers()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do usuário.',
        variant: 'destructive'
      })
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'destructive'
      case 'teacher':
        return 'default'
      case 'student':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'Administrador'
      case 'teacher':
        return 'Professor'
      case 'student':
        return 'Aluno'
      default:
        return role
    }
  }

  const tastingCount = users.filter(u => u.isInTastingClass).length
  const regularCount = users.filter(u => !u.isInTastingClass && u.role === 'student' && u.classes && u.classes.length > 0).length
  const noClassCount = users.filter(u => u.role === 'student' && (!u.classes || u.classes.length === 0)).length

  return (
    <>
      {/* Stats Cards */}
      {tastingCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <CardDescription className="text-amber-700">Aguardando Aprovação</CardDescription>
              <CardTitle className="text-3xl text-amber-900">
                {tastingCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-amber-600">
                🍰 Alunos na turma Degustação
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full border-amber-300 hover:bg-amber-100"
                onClick={() => setClassFilter('tasting')}
              >
                Ver alunos em Degustação
              </Button>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardDescription className="text-green-700">Alunos Ativos</CardDescription>
              <CardTitle className="text-3xl text-green-900">
                {regularCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-green-600">
                ✅ Em turmas regulares
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-3">
              <CardDescription className="text-red-700">Necessita Atenção</CardDescription>
              <CardTitle className="text-3xl text-red-900">
                {noClassCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-red-600">
                ⚠️ Alunos sem nenhuma turma
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários ({filteredUsers.length} de {users.length})</CardTitle>
              <CardDescription>
                Gerencie todos os usuários da plataforma.
              </CardDescription>
            </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={loadUsers}
              disabled={isLoading}
              title="Atualizar lista"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Usuário
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou email..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              <SelectItem value="student">Alunos</SelectItem>
              <SelectItem value="teacher">Professores</SelectItem>
              <SelectItem value="administrator">Administradores</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as turmas</SelectItem>
              <SelectItem value="tasting">🍰 Na Degustação</SelectItem>
              <SelectItem value="not_tasting">✅ Em turma regular</SelectItem>
              <SelectItem value="no_class">⚠️ Sem turma</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Turmas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )
              : filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role) as any}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.role === 'student' && (
                          <>
                            {user.isInTastingClass ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                🍰 Degustação
                              </Badge>
                            ) : user.classes && user.classes.length > 0 ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                {user.classes.length} turma(s)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                ⚠️ Sem turma
                              </Badge>
                            )}
                          </>
                        )}
                        {user.role !== 'student' && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? 'default' : 'destructive'}
                      >
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/users/${user.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </Link>
                          </DropdownMenuItem>
                          {user.role === 'student' && (
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/users/${user.id}/classes`}>
                                <GraduationCap className="mr-2 h-4 w-4" /> Gerenciar Turmas
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.is_active ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" /> Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" /> Ativar
                              </>
                            )}
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
    </>
  )
}
