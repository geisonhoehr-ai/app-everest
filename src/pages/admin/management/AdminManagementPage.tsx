import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { logger } from '@/lib/logger'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { UserManagement } from '@/components/admin/management/UserManagement'
import { ClassManagement } from '@/components/admin/management/ClassManagement'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  GraduationCap, 
  Settings, 
  Shield,
  UserCheck,
  BookOpen
} from 'lucide-react'
import { getUsers } from '@/services/adminUserService'
import { supabase } from '@/lib/supabase/client'

export default function AdminManagementPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    administrators: 0,
    totalCourses: 0,
    loading: true
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Get users
      const users = await getUsers()
      
      // Count by role
      const students = users.filter(u => u.role === 'student').length
      const teachers = users.filter(u => u.role === 'teacher').length
      const administrators = users.filter(u => u.role === 'administrator').length

      // Get courses count
      const { count: coursesCount } = await supabase
        .from('video_courses')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalUsers: users.length,
        students,
        teachers,
        administrators,
        totalCourses: coursesCount || 0,
        loading: false
      })
    } catch (error) {
      logger.error('❌ Erro ao carregar estatísticas:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <MagicLayout 
      title="Gerenciamento Administrativo"
      description="Administre usuários, turmas e permissões da plataforma"
    >
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Settings className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Painel Administrativo
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-lg">
                    Gerencie usuários e turmas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Shield className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium">Admin</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                {stats.loading ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16 mx-auto" />
                ) : (
                  <div className="text-xl md:text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                )}
                <div className="text-xs md:text-sm text-muted-foreground">Usuários</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                {stats.loading ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16 mx-auto" />
                ) : (
                  <div className="text-xl md:text-2xl font-bold text-green-600">{stats.students}</div>
                )}
                <div className="text-xs md:text-sm text-muted-foreground">Alunos</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                {stats.loading ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16 mx-auto" />
                ) : (
                  <div className="text-xl md:text-2xl font-bold text-purple-600">{stats.teachers}</div>
                )}
                <div className="text-xs md:text-sm text-muted-foreground">Professores</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                {stats.loading ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16 mx-auto" />
                ) : (
                  <div className="text-xl md:text-2xl font-bold text-orange-600">{stats.totalCourses}</div>
                )}
                <div className="text-xs md:text-sm text-muted-foreground">Cursos</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Management Tabs */}
        <MagicCard variant="glass" size="lg">
          <Tabs defaultValue="users" className="w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Gerenciamento</h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Administre usuários e turmas
                </p>
              </div>
              <TabsList className="bg-card/50 backdrop-blur-sm border border-border/50 w-full md:w-auto">
                <TabsTrigger 
                  value="users" 
                  className="flex-1 md:flex-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
                >
                  <Users className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">Usuários</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="classes"
                  className="flex-1 md:flex-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
                >
                  <GraduationCap className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">Turmas</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="users" className="mt-4 md:mt-6">
              <UserManagement />
            </TabsContent>
            <TabsContent value="classes" className="mt-4 md:mt-6">
              <ClassManagement />
            </TabsContent>
          </Tabs>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
