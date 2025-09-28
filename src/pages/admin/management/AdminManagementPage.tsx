import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserManagement } from '@/components/admin/management/UserManagement'
import { ClassManagement } from '@/components/admin/management/ClassManagement'

export default function AdminManagementPage() {
  return (
    <Tabs defaultValue="users">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gerenciamento de Usuários e Turmas
          </h1>
          <p className="text-muted-foreground">
            Administre usuários, turmas e permissões da plataforma.
          </p>
        </div>
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="classes">Turmas</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="users" className="mt-6">
        <UserManagement />
      </TabsContent>
      <TabsContent value="classes" className="mt-6">
        <ClassManagement />
      </TabsContent>
    </Tabs>
  )
}
