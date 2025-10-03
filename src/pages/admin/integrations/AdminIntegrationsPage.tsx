import { useState } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  testPandaConnection,
  getPandaVideos,
  getPandaFolders,
} from '@/services/pandaVideo'
import {
  getAcademy,
  getClassrooms,
  getUsers,
  getCourses,
  importClassrooms,
  importUsers,
  importCourses,
  importAll,
  type ImportProgress,
  type ImportResult,
} from '@/services/memberkitService'
import {
  Plug,
  Check,
  X,
  Loader2,
  Video,
  GraduationCap,
  Download,
  RefreshCw,
  Eye,
  Users,
  BookOpen,
} from 'lucide-react'

export default function AdminIntegrationsPage() {
  const { toast } = useToast()

  // Connection status
  const [pandaStatus, setPandaStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [memberkitStatus, setMemberkitStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  // Import progress
  const [importingClassrooms, setImportingClassrooms] = useState(false)
  const [importingUsers, setImportingUsers] = useState(false)
  const [importingCourses, setImportingCourses] = useState(false)
  const [importingAll, setImportingAll] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)

  // Stats
  const [pandaStats, setPandaStats] = useState<{ videosCount?: number; foldersCount?: number } | null>(null)
  const [memberkitStats, setMemberkitStats] = useState<{
    academyName?: string
    classroomsCount?: number
    usersCount?: number
    coursesCount?: number
  } | null>(null)

  // Last import results
  const [lastImportResults, setLastImportResults] = useState<{
    classrooms?: ImportResult
    users?: ImportResult
    courses?: ImportResult
  } | null>(null)

  // Test PandaVideo connection
  const handleTestPandaConnection = async () => {
    setPandaStatus('testing')
    try {
      const result = await testPandaConnection()

      if (result.success) {
        setPandaStatus('success')
        setPandaStats({ videosCount: result.videosCount })
        toast({
          title: 'Conexão bem-sucedida',
          description: `PandaVideo conectado! ${result.videosCount} vídeos encontrados.`,
        })

        // Get folders count
        const folders = await getPandaFolders()
        setPandaStats(prev => ({ ...prev, foldersCount: folders.length }))
      } else {
        setPandaStatus('error')
        toast({
          title: 'Erro na conexão',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      setPandaStatus('error')
      toast({
        title: 'Erro ao conectar',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  // Test Memberkit connection
  const handleTestMemberkitConnection = async () => {
    setMemberkitStatus('testing')
    try {
      const academy = await getAcademy()
      const classrooms = await getClassrooms()
      const users = await getUsers({ per_page: 1 })
      const courses = await getCourses()

      setMemberkitStatus('success')
      setMemberkitStats({
        academyName: academy.name,
        classroomsCount: classrooms.length,
        usersCount: users.meta.total,
        coursesCount: courses.length,
      })

      toast({
        title: 'Conexão bem-sucedida',
        description: `Memberkit conectado! Academia: ${academy.name}`,
      })
    } catch (error: any) {
      setMemberkitStatus('error')
      toast({
        title: 'Erro ao conectar',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  // Import functions
  const handleImportClassrooms = async () => {
    setImportingClassrooms(true)
    setImportProgress(null)
    try {
      const result = await importClassrooms((progress) => {
        setImportProgress(progress)
      })

      setLastImportResults(prev => ({ ...prev, classrooms: result }))

      toast({
        title: 'Importação concluída',
        description: `${result.success} turmas importadas, ${result.skipped} puladas, ${result.errors} erros`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setImportingClassrooms(false)
      setImportProgress(null)
    }
  }

  const handleImportUsers = async () => {
    setImportingUsers(true)
    setImportProgress(null)
    try {
      const result = await importUsers((progress) => {
        setImportProgress(progress)
      })

      setLastImportResults(prev => ({ ...prev, users: result }))

      toast({
        title: 'Importação concluída',
        description: `${result.success} usuários importados, ${result.skipped} pulados, ${result.errors} erros`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setImportingUsers(false)
      setImportProgress(null)
    }
  }

  const handleImportCourses = async () => {
    setImportingCourses(true)
    setImportProgress(null)
    try {
      const result = await importCourses((progress) => {
        setImportProgress(progress)
      })

      setLastImportResults(prev => ({ ...prev, courses: result }))

      toast({
        title: 'Importação concluída',
        description: `${result.success} cursos importados, ${result.skipped} pulados, ${result.errors} erros`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setImportingCourses(false)
      setImportProgress(null)
    }
  }

  const handleImportAll = async () => {
    setImportingAll(true)
    setImportProgress(null)
    try {
      const results = await importAll((progress) => {
        setImportProgress(progress)
      })

      setLastImportResults(results)

      toast({
        title: 'Importação completa concluída',
        description: `Turmas: ${results.classrooms.success}, Usuários: ${results.users.success}, Cursos: ${results.courses.success}`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setImportingAll(false)
      setImportProgress(null)
    }
  }

  const getStatusBadge = (status: 'idle' | 'testing' | 'success' | 'error') => {
    switch (status) {
      case 'testing':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Testando...</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-500"><Check className="h-3 w-3 mr-1" />Conectado</Badge>
      case 'error':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Erro</Badge>
      default:
        return <Badge variant="outline">Não testado</Badge>
    }
  }

  return (
    <MagicLayout
      title="Integrações"
      description="Gerencie integrações com plataformas externas"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <Tabs defaultValue="panda" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="panda">
              <Video className="h-4 w-4 mr-2" />
              PandaVideo
            </TabsTrigger>
            <TabsTrigger value="memberkit">
              <GraduationCap className="h-4 w-4 mr-2" />
              Memberkit
            </TabsTrigger>
          </TabsList>

          {/* PandaVideo Tab */}
          <TabsContent value="panda" className="space-y-6">
            <MagicCard variant="glass" size="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10">
                  <Video className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">PandaVideo</h2>
                  <p className="text-sm text-muted-foreground">
                    Integração com plataforma de vídeos
                  </p>
                </div>
                {getStatusBadge(pandaStatus)}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value="panda-7815cbc9c501c0169d429ade132363867425dfb01a258da9a6a894ea8898908e"
                    disabled
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Configurada em: src/services/pandaVideo.ts
                  </p>
                </div>

                <div>
                  <Label>API URL</Label>
                  <Input
                    value="https://api-v2.pandavideo.com.br"
                    disabled
                    className="mt-1 font-mono text-xs"
                  />
                </div>

                <Button
                  onClick={handleTestPandaConnection}
                  disabled={pandaStatus === 'testing'}
                  className="w-full"
                >
                  {pandaStatus === 'testing' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plug className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>

                {pandaStats && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Vídeos</p>
                      <p className="text-2xl font-bold">{pandaStats.videosCount || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Pastas</p>
                      <p className="text-2xl font-bold">{pandaStats.foldersCount || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            </MagicCard>

            <MagicCard variant="glass">
              <h3 className="text-lg font-semibold mb-4">Recursos Disponíveis</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Check className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Listar vídeos</p>
                    <p className="text-xs text-muted-foreground">Com paginação e busca</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Check className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Detalhes de vídeos</p>
                    <p className="text-xs text-muted-foreground">Thumbnail, duração, embed URL</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Check className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Gerenciar pastas</p>
                    <p className="text-xs text-muted-foreground">Organização de conteúdo</p>
                  </div>
                </div>
              </div>
            </MagicCard>
          </TabsContent>

          {/* Memberkit Tab */}
          <TabsContent value="memberkit" className="space-y-6">
            <MagicCard variant="glass" size="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                  <GraduationCap className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">Memberkit</h2>
                  <p className="text-sm text-muted-foreground">
                    Integração com plataforma de membros
                  </p>
                </div>
                {getStatusBadge(memberkitStatus)}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Secret Key</Label>
                  <Input
                    type="password"
                    value="3cG57cb4CAgAKMX7Fg59qY8f"
                    disabled
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Configurada em: src/services/memberkitService.ts
                  </p>
                </div>

                <div>
                  <Label>API URL</Label>
                  <Input
                    value="https://api.memberkit.com.br/v1"
                    disabled
                    className="mt-1 font-mono text-xs"
                  />
                </div>

                <div>
                  <Label>Rate Limit</Label>
                  <Input
                    value="120 requisições por minuto"
                    disabled
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleTestMemberkitConnection}
                  disabled={memberkitStatus === 'testing'}
                  className="w-full"
                >
                  {memberkitStatus === 'testing' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plug className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>

                {memberkitStats && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Academia</p>
                      <p className="text-lg font-bold">{memberkitStats.academyName}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Turmas</p>
                        <p className="text-2xl font-bold">{memberkitStats.classroomsCount || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Usuários</p>
                        <p className="text-2xl font-bold">{memberkitStats.usersCount || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Cursos</p>
                        <p className="text-2xl font-bold">{memberkitStats.coursesCount || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </MagicCard>

            {/* Import Section */}
            <MagicCard variant="glass">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Importar Dados
              </h3>

              {importProgress && (
                <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{importProgress.stage}</p>
                    <p className="text-sm text-muted-foreground">
                      {importProgress.current} / {importProgress.total}
                    </p>
                  </div>
                  {importProgress.currentItem && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {importProgress.currentItem}
                    </p>
                  )}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${(importProgress.current / importProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-green-500">✓ {importProgress.success} sucesso</span>
                    <span className="text-red-500">✗ {importProgress.errors} erros</span>
                  </div>
                </div>
              )}

              <div className="grid gap-3 mb-6">
                <Button
                  onClick={handleImportClassrooms}
                  disabled={importingClassrooms || importingAll}
                  variant="outline"
                  className="w-full justify-start"
                >
                  {importingClassrooms ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GraduationCap className="h-4 w-4 mr-2" />
                  )}
                  Importar Turmas
                </Button>

                <Button
                  onClick={handleImportUsers}
                  disabled={importingUsers || importingAll}
                  variant="outline"
                  className="w-full justify-start"
                >
                  {importingUsers ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Importar Usuários
                </Button>

                <Button
                  onClick={handleImportCourses}
                  disabled={importingCourses || importingAll}
                  variant="outline"
                  className="w-full justify-start"
                >
                  {importingCourses ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BookOpen className="h-4 w-4 mr-2" />
                  )}
                  Importar Cursos
                </Button>

                <Button
                  onClick={handleImportAll}
                  disabled={importingAll || importingClassrooms || importingUsers || importingCourses}
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                >
                  {importingAll ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Importar Tudo
                </Button>
              </div>

              {lastImportResults && (
                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-medium text-sm">Última Importação</h4>

                  {lastImportResults.classrooms && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium text-sm mb-1">Turmas</p>
                      <div className="flex gap-4 text-xs">
                        <span>Total: {lastImportResults.classrooms.total}</span>
                        <span className="text-green-500">✓ {lastImportResults.classrooms.success}</span>
                        <span className="text-yellow-500">⊘ {lastImportResults.classrooms.skipped}</span>
                        <span className="text-red-500">✗ {lastImportResults.classrooms.errors}</span>
                      </div>
                    </div>
                  )}

                  {lastImportResults.users && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium text-sm mb-1">Usuários</p>
                      <div className="flex gap-4 text-xs">
                        <span>Total: {lastImportResults.users.total}</span>
                        <span className="text-green-500">✓ {lastImportResults.users.success}</span>
                        <span className="text-yellow-500">⊘ {lastImportResults.users.skipped}</span>
                        <span className="text-red-500">✗ {lastImportResults.users.errors}</span>
                      </div>
                    </div>
                  )}

                  {lastImportResults.courses && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium text-sm mb-1">Cursos</p>
                      <div className="flex gap-4 text-xs">
                        <span>Total: {lastImportResults.courses.total}</span>
                        <span className="text-green-500">✓ {lastImportResults.courses.success}</span>
                        <span className="text-yellow-500">⊘ {lastImportResults.courses.skipped}</span>
                        <span className="text-red-500">✗ {lastImportResults.courses.errors}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </MagicCard>
          </TabsContent>
        </Tabs>
      </div>
    </MagicLayout>
  )
}
