import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Trash2, UserPlus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

const mockCollaborators = [
  {
    id: 'collab1',
    user: {
      id: 'user1',
      name: 'Ana Clara',
      email: 'ana@example.com',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=5',
    },
    permission: 'Editor',
  },
  {
    id: 'collab2',
    user: {
      id: 'user2',
      name: 'Lucas Mendes',
      email: 'lucas@example.com',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=6',
    },
    permission: 'Viewer',
  },
]

export default function FlashcardSetCollaboratorsPage() {
  const { setId } = useParams()
  const { toast } = useToast()
  const [collaborators, setCollaborators] = useState(mockCollaborators)

  const handleInvite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')
    const permission = formData.get('permission')

    toast({
      title: 'Convite Enviado!',
      description: `${email} foi convidado como ${permission}.`,
    })
    e.currentTarget.reset()
  }

  const handleRemove = (collabId: string) => {
    setCollaborators(collaborators.filter((c) => c.id !== collabId))
    toast({
      title: 'Colaborador Removido',
    })
  }

  const handlePermissionChange = (collabId: string, permission: string) => {
    setCollaborators(
      collaborators.map((c) => (c.id === collabId ? { ...c, permission } : c)),
    )
    toast({
      title: 'Permissão Atualizada',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to={`/conjuntos/${setId}/editar`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Colaboradores</h1>
          <p className="text-muted-foreground">
            Convide e gerencie quem pode ver e editar este conjunto.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Convidar Novo Colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleInvite}
            className="flex flex-col md:flex-row gap-4 items-end"
          >
            <div className="flex-grow space-y-2 w-full">
              <Label htmlFor="email">Email do Usuário</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="space-y-2 w-full md:w-auto">
              <Label htmlFor="permission">Permissão</Label>
              <Select name="permission" defaultValue="Viewer">
                <SelectTrigger id="permission" className="w-full md:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Viewer">Visualizador</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">
              <UserPlus className="mr-2 h-4 w-4" /> Convidar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colaboradores Atuais</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborators.map((collab) => (
                <TableRow key={collab.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={collab.user.avatar} />
                      <AvatarFallback>
                        {collab.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{collab.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {collab.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={collab.permission}
                      onValueChange={(value) =>
                        handlePermissionChange(collab.id, value)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Viewer">Visualizador</SelectItem>
                        <SelectItem value="Editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(collab.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
