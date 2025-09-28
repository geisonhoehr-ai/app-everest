import { useState } from 'react'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react'

const mockClasses = [
  {
    id: 'class-a',
    name: 'Turma A - Extensivo 2025',
    type: 'standard',
    description: 'Acesso completo a todos os módulos.',
  },
  {
    id: 'class-b',
    name: 'Turma B - Foco em Evercast',
    type: 'standard',
    description: 'Acesso exclusivo ao módulo Evercast.',
  },
  {
    id: 'class-c',
    name: 'Turma C - Foco em Redação',
    type: 'standard',
    description: 'Acesso exclusivo ao módulo de Redação.',
  },
  {
    id: 'class-trial',
    name: 'Turma Degustação',
    type: 'trial',
    description: 'Acesso limitado por 7 dias.',
  },
]

export const ClassManagement = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Turmas</CardTitle>
            <CardDescription>
              Gerencie as turmas e suas permissões de acesso.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar turma..." className="pl-8" />
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Turma
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockClasses.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell className="font-medium">{cls.name}</TableCell>
                <TableCell>{cls.description}</TableCell>
                <TableCell>
                  <Badge
                    variant={cls.type === 'trial' ? 'secondary' : 'outline'}
                  >
                    {cls.type === 'trial' ? 'Degustação' : 'Padrão'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Gerenciar Permissões</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Remover
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
