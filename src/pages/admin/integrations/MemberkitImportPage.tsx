import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
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
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Link2,
  Upload,
  Users,
  BookOpen,
  ScrollText,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import {
  buildPandaVideoMap,
  importMemberkitCourse,
  importMemberkitUsers,
  fetchMemberkitCourses,
  fetchMemberkitClassrooms,
  type ImportProgress,
  type PandaVideoInfo,
  type MKCourse,
  type MKClassroom,
  type ImportCourseResult,
  type ImportUsersResult,
} from '@/services/memberkitImportService'

interface LogEntry {
  id: number
  timestamp: Date
  type: 'info' | 'success' | 'error' | 'progress'
  message: string
}

let logIdCounter = 0

export default function MemberkitImportPage() {
  const { profile } = useAuth()
  const { toast } = useToast()

  // Config state
  const [memberkitApiKey, setMemberkitApiKey] = useState('')
  const [pandaApiKey, setPandaApiKey] = useState('')
  const [serviceRoleKey, setServiceRoleKey] = useState('')
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // Data state
  const [courses, setCourses] = useState<MKCourse[]>([])
  const [classrooms, setClassrooms] = useState<MKClassroom[]>([])
  const [everestClasses, setEverestClasses] = useState<{ id: string; name: string }[]>([])
  const [pandaVideoMap, setPandaVideoMap] = useState<Map<string, PandaVideoInfo> | null>(null)

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const [selectedEverestClassId, setSelectedEverestClassId] = useState('')
  const [defaultPassword, setDefaultPassword] = useState('Everest@2026')

  // Import state
  const [importingCourse, setImportingCourse] = useState(false)
  const [importingUsers, setImportingUsers] = useState(false)
  const [courseResult, setCourseResult] = useState<ImportCourseResult | null>(null)
  const [usersResult, setUsersResult] = useState<ImportUsersResult | null>(null)

  // Log state
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs((prev) => [
      ...prev,
      { id: ++logIdCounter, timestamp: new Date(), type, message },
    ])
  }, [])

  const handleProgress = useCallback(
    (progress: ImportProgress) => {
      const detail = progress.detail ? ` - ${progress.detail}` : ''
      const counter =
        progress.total > 0
          ? ` (${progress.current}/${progress.total})`
          : progress.current > 0
            ? ` (${progress.current})`
            : ''
      addLog('progress', `${progress.step}${counter}${detail}`)
    },
    [addLog],
  )

  // Connect: validate keys and fetch courses/classrooms
  const handleConnect = async () => {
    if (!memberkitApiKey.trim()) {
      toast({
        title: 'Chave obrigatoria',
        description: 'Informe a MemberKit API Key.',
        variant: 'destructive',
      })
      return
    }

    setConnecting(true)
    setLogs([])
    setCourseResult(null)
    setUsersResult(null)

    try {
      addLog('info', 'Conectando ao MemberKit...')
      const [mkCourses, mkClassrooms] = await Promise.all([
        fetchMemberkitCourses(memberkitApiKey),
        fetchMemberkitClassrooms(memberkitApiKey),
      ])
      setCourses(mkCourses)
      setClassrooms(mkClassrooms)
      addLog(
        'success',
        `MemberKit conectado: ${mkCourses.length} cursos, ${mkClassrooms.length} turmas`,
      )

      // Fetch Everest classes
      addLog('info', 'Buscando turmas do Everest...')
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .order('name')

      if (classesError) {
        addLog('error', `Erro ao buscar turmas Everest: ${classesError.message}`)
      } else {
        setEverestClasses(classes || [])
        addLog('success', `${(classes || []).length} turmas Everest encontradas`)
      }

      // Build Panda Video map if key provided
      if (pandaApiKey.trim()) {
        addLog('info', 'Carregando videos do Panda Video...')
        const map = await buildPandaVideoMap(pandaApiKey, handleProgress)
        setPandaVideoMap(map)
        addLog('success', `Panda Video: ${map.size} videos carregados`)
      } else {
        setPandaVideoMap(new Map())
        addLog('info', 'Panda Video API Key nao informada - videos serao ignorados')
      }

      setConnected(true)
      addLog('success', 'Conexao estabelecida com sucesso!')
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      addLog('error', `Erro ao conectar: ${msg}`)
      toast({
        title: 'Erro ao conectar',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setConnecting(false)
    }
  }

  // Import course
  const handleImportCourse = async () => {
    if (!selectedCourseId || !pandaVideoMap || !profile) return

    setImportingCourse(true)
    setCourseResult(null)

    try {
      addLog('info', `Iniciando importacao do curso ID ${selectedCourseId}...`)
      const result = await importMemberkitCourse(
        memberkitApiKey,
        Number(selectedCourseId),
        pandaVideoMap,
        profile.id,
        handleProgress,
      )
      setCourseResult(result)

      if (result.errors.length > 0) {
        for (const err of result.errors) {
          addLog('error', err)
        }
      }

      addLog(
        'success',
        `Curso "${result.courseName}" importado: ${result.modulesCreated} modulos, ${result.lessonsCreated} aulas, ${result.attachmentsCreated} anexos`,
      )

      toast({
        title: 'Curso importado!',
        description: `${result.modulesCreated} modulos e ${result.lessonsCreated} aulas criados.`,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      addLog('error', `Erro na importacao do curso: ${msg}`)
      toast({
        title: 'Erro na importacao',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setImportingCourse(false)
    }
  }

  // Import users
  const handleImportUsers = async () => {
    if (!selectedClassroomId || !selectedEverestClassId) return

    setImportingUsers(true)
    setUsersResult(null)

    try {
      addLog(
        'info',
        `Iniciando importacao de alunos da turma MK ${selectedClassroomId}...`,
      )
      const result = await importMemberkitUsers(
        memberkitApiKey,
        Number(selectedClassroomId),
        selectedEverestClassId,
        defaultPassword,
        handleProgress,
        serviceRoleKey || undefined,
      )
      setUsersResult(result)

      if (result.errors.length > 0) {
        for (const err of result.errors) {
          addLog('error', err)
        }
      }

      addLog(
        'success',
        `Alunos importados: ${result.usersCreated} criados, ${result.usersAlreadyExisted} ja existiam, ${result.enrollmentsCreated} matriculas`,
      )

      toast({
        title: 'Alunos importados!',
        description: `${result.usersCreated} criados, ${result.enrollmentsCreated} matriculados.`,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      addLog('error', `Erro na importacao de alunos: ${msg}`)
      toast({
        title: 'Erro na importacao',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setImportingUsers(false)
    }
  }

  const isImporting = importingCourse || importingUsers || connecting

  return (
    <MagicLayout
      title="Importacao MemberKit"
      description="Importe cursos e alunos da plataforma MemberKit"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Configuration Card */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Configuracao</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mk-key">MemberKit API Key</Label>
                <Input
                  id="mk-key"
                  type="password"
                  placeholder="Sua chave da MemberKit"
                  value={memberkitApiKey}
                  onChange={(e) => setMemberkitApiKey(e.target.value)}
                  disabled={connected || isImporting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panda-key">Panda Video API Key</Label>
                <Input
                  id="panda-key"
                  type="password"
                  placeholder="Sua chave do Panda Video (opcional)"
                  value={pandaApiKey}
                  onChange={(e) => setPandaApiKey(e.target.value)}
                  disabled={connected || isImporting}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="service-key">
                  Supabase Service Role Key{' '}
                  <span className="text-xs text-muted-foreground">
                    (necessaria para criar usuarios)
                  </span>
                </Label>
                <Input
                  id="service-key"
                  type="password"
                  placeholder="Chave service_role do Supabase"
                  value={serviceRoleKey}
                  onChange={(e) => setServiceRoleKey(e.target.value)}
                  disabled={connected || isImporting}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!connected ? (
                <Button
                  onClick={handleConnect}
                  disabled={connecting || !memberkitApiKey.trim()}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      Conectar
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Conectado</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setConnected(false)
                      setCourses([])
                      setClassrooms([])
                      setPandaVideoMap(null)
                      setCourseResult(null)
                      setUsersResult(null)
                    }}
                    disabled={isImporting}
                  >
                    Desconectar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </MagicCard>

        {/* Import Course Card */}
        {connected && (
          <MagicCard variant="glass" size="lg">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold">Importar Curso</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Curso MemberKit</Label>
                  <Select
                    value={selectedCourseId}
                    onValueChange={setSelectedCourseId}
                    disabled={importingCourse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um curso..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleImportCourse}
                  disabled={!selectedCourseId || importingCourse || !pandaVideoMap}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                >
                  {importingCourse ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando Curso...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar Curso
                    </>
                  )}
                </Button>
              </div>

              {/* Course Result */}
              {courseResult && (
                <div className="rounded-xl border border-border/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-500 font-medium">
                    <CheckCircle className="h-5 w-5" />
                    Curso &quot;{courseResult.courseName}&quot; importado
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-3 rounded-lg bg-blue-500/10">
                      <div className="text-lg font-bold text-blue-500">
                        {courseResult.modulesCreated}
                      </div>
                      <div className="text-muted-foreground">Modulos</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-500/10">
                      <div className="text-lg font-bold text-green-500">
                        {courseResult.lessonsCreated}
                      </div>
                      <div className="text-muted-foreground">Aulas</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-500/10">
                      <div className="text-lg font-bold text-purple-500">
                        {courseResult.attachmentsCreated}
                      </div>
                      <div className="text-muted-foreground">Anexos</div>
                    </div>
                  </div>
                  {courseResult.errors.length > 0 && (
                    <div className="text-sm text-yellow-500">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {courseResult.errors.length} avisos durante a importacao
                    </div>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/courses">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Ver Cursos
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </MagicCard>
        )}

        {/* Import Users Card */}
        {connected && (
          <MagicCard variant="glass" size="lg">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold">Importar Alunos</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Turma MemberKit</Label>
                  <Select
                    value={selectedClassroomId}
                    onValueChange={setSelectedClassroomId}
                    disabled={importingUsers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma MK..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name} ({c.users_count} membros)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Turma Everest</Label>
                  <Select
                    value={selectedEverestClassId}
                    onValueChange={setSelectedEverestClassId}
                    disabled={importingUsers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma Everest..." />
                    </SelectTrigger>
                    <SelectContent>
                      {everestClasses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="default-password">Senha padrao para novos alunos</Label>
                  <Input
                    id="default-password"
                    type="text"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    disabled={importingUsers}
                  />
                </div>
              </div>

              <Button
                onClick={handleImportUsers}
                disabled={
                  !selectedClassroomId ||
                  !selectedEverestClassId ||
                  importingUsers
                }
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
              >
                {importingUsers ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando Alunos...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Importar Alunos
                  </>
                )}
              </Button>

              {/* Users Result */}
              {usersResult && (
                <div className="rounded-xl border border-border/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-500 font-medium">
                    <CheckCircle className="h-5 w-5" />
                    Importacao de alunos concluida
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-3 rounded-lg bg-green-500/10">
                      <div className="text-lg font-bold text-green-500">
                        {usersResult.usersCreated}
                      </div>
                      <div className="text-muted-foreground">Criados</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                      <div className="text-lg font-bold text-yellow-500">
                        {usersResult.usersAlreadyExisted}
                      </div>
                      <div className="text-muted-foreground">Ja existiam</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-500/10">
                      <div className="text-lg font-bold text-blue-500">
                        {usersResult.enrollmentsCreated}
                      </div>
                      <div className="text-muted-foreground">Matriculados</div>
                    </div>
                  </div>
                  {usersResult.errors.length > 0 && (
                    <div className="text-sm text-yellow-500">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {usersResult.errors.length} erros durante a importacao
                    </div>
                  )}
                </div>
              )}
            </div>
          </MagicCard>
        )}

        {/* Progress Log Card */}
        {logs.length > 0 && (
          <MagicCard variant="glass" size="lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/10">
                  <ScrollText className="h-5 w-5 text-orange-500" />
                </div>
                <h2 className="text-xl font-semibold">Log de Progresso</h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {logs.length} entradas
                </span>
              </div>

              <div
                ref={logContainerRef}
                className="max-h-80 overflow-y-auto rounded-xl border border-border/50 bg-background/50 p-3 space-y-1 font-mono text-xs"
              >
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-muted-foreground shrink-0">
                      {log.timestamp.toLocaleTimeString('pt-BR')}
                    </span>
                    {log.type === 'success' && (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    )}
                    {log.type === 'error' && (
                      <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    {log.type === 'info' && (
                      <AlertCircle className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    {log.type === 'progress' && (
                      <Loader2 className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5 animate-spin" />
                    )}
                    <span
                      className={
                        log.type === 'error'
                          ? 'text-red-400'
                          : log.type === 'success'
                            ? 'text-green-400'
                            : 'text-foreground/80'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </MagicCard>
        )}
      </div>
    </MagicLayout>
  )
}
