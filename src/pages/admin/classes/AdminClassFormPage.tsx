import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, GraduationCap, Save } from 'lucide-react'
import { getModuleRulesForClass, saveAllModuleRules, checkCircularDependency } from '@/services/moduleRulesService'

const classSchema = z.object({
  name: z.string().min(1, 'O nome da turma é obrigatório'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'A data de início é obrigatória'),
  end_date: z.string().min(1, 'A data de término é obrigatória'),
  status: z.enum(['active', 'inactive', 'archived']),
  class_type: z.enum(['standard', 'trial']).default('standard'),
  teacher_id: z.string().min(1, 'O professor é obrigatório'),
})

type ClassFormValues = z.infer<typeof classSchema>

import { getTeachers, Teacher } from '@/services/teacherService'

export default function AdminClassFormPage() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [accessDuration, setAccessDuration] = useState<number | ''>('')
  const [isDefault, setIsDefault] = useState(false)
  const [moduleRules, setModuleRules] = useState<Record<string, { rule_type: string; rule_value: string }>>({})
  const [modules, setModules] = useState<any[]>([])

  const isEditing = !!classId

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      class_type: 'standard',
      teacher_id: '',
    },
  })

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadTeachers()
      if (isEditing) {
        await loadClass()
        await loadModulesAndRules()
      }
      setLoading(false)
    }
    init()
  }, [classId])

  const loadTeachers = async () => {
    try {
      const data = await getTeachers()
      setTeachers(data)

      // If not editing, try to find current user in teachers list to set as default
      if (!isEditing) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const currentTeacher = data.find(t => t.user_id === user.id)
          if (currentTeacher) {
            form.setValue('teacher_id', currentTeacher.id)
          }
        }
      }
    } catch (error) {
      logger.error('Erro ao carregar professores:', error)
    }
  }

  const loadClass = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single()

      if (error) throw error

      const classData = data as any
      if (classData) {
        form.reset({
          name: classData.name,
          description: classData.description || '',
          start_date: classData.start_date,
          end_date: classData.end_date,
          status: classData.status || 'active',
          class_type: classData.class_type || 'standard',
          teacher_id: classData.teacher_id || '',
        })
        setAccessDuration(classData.access_duration_days ?? '')
        setIsDefault(classData.is_default ?? false)
      }
    } catch (error) {
      logger.error('Erro ao carregar turma:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da turma',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadModulesAndRules = async () => {
    try {
      // Fetch modules from courses linked to this class
      const { data: linkedCourses } = await supabase
        .from('class_courses')
        .select('video_courses(id, name, video_modules(id, name, order_index))')
        .eq('class_id', classId)

      const allModules = (linkedCourses || []).flatMap((lc: any) =>
        lc.video_courses?.video_modules?.map((m: any) => ({
          ...m,
          courseName: lc.video_courses.name
        })) || []
      ).sort((a: any, b: any) => a.order_index - b.order_index)

      setModules(allModules)

      // Fetch existing rules
      const rules = await getModuleRulesForClass(classId!)
      const rulesMap: Record<string, any> = {}
      rules.forEach(r => { rulesMap[r.module_id] = { rule_type: r.rule_type, rule_value: r.rule_value || '' } })
      setModuleRules(rulesMap)
    } catch (error) {
      logger.error('Erro ao carregar módulos e regras:', error)
    }
  }

  const onSubmit = async (values: ClassFormValues) => {
    try {
      const classPayload = {
        name: values.name,
        description: values.description,
        start_date: values.start_date,
        end_date: values.end_date,
        status: values.status,
        class_type: values.class_type,
        teacher_id: values.teacher_id,
        access_duration_days: accessDuration === '' ? null : accessDuration,
        is_default: isDefault,
      }

      if (isEditing) {
        const { error } = await (supabase as any)
          .from('classes')
          .update(classPayload)
          .eq('id', classId)

        if (error) throw error

        // Save module rules
        const rulesToSave = Object.entries(moduleRules)
          .filter(([_, r]) => r.rule_type !== 'free')
          .map(([moduleId, r]) => ({
            class_id: classId!,
            module_id: moduleId,
            rule_type: r.rule_type as any,
            rule_value: r.rule_value || null
          }))
        await saveAllModuleRules(classId!, rulesToSave)

        toast({
          title: 'Sucesso',
          description: 'Turma atualizada com sucesso',
        })
      } else {
        const { data: insertedData, error } = await (supabase as any)
          .from('classes')
          .insert(classPayload)
          .select('id')
          .single()

        if (error) throw error

        // Save module rules if we have a new class ID
        if (insertedData?.id) {
          const rulesToSave = Object.entries(moduleRules)
            .filter(([_, r]) => r.rule_type !== 'free')
            .map(([moduleId, r]) => ({
              class_id: insertedData.id,
              module_id: moduleId,
              rule_type: r.rule_type as any,
              rule_value: r.rule_value || null
            }))
          await saveAllModuleRules(insertedData.id, rulesToSave)
        }

        toast({
          title: 'Sucesso',
          description: 'Turma criada com sucesso',
        })
      }

      navigate('/admin/classes')
    } catch (error) {
      logger.error('Erro ao salvar turma:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a turma',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <SectionLoader />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{isEditing ? 'Editar Turma' : 'Nova Turma'}</h1>
        <p className="text-sm text-muted-foreground">{isEditing ? 'Edite as informações da turma' : 'Crie uma nova turma no sistema'}</p>
      </div>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/classes')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-muted/50">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isEditing ? 'Editar Turma' : 'Nova Turma'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Preencha as informações da turma
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome da Turma *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Turma 2025.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição da turma (opcional)"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Prova (fim do acesso) *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Os alunos perdem acesso à plataforma após esta data
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="class_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Turma *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Padrão</SelectItem>
                          <SelectItem value="trial">Trial (Teste)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Turmas trial têm acesso limitado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professor Responsável *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um professor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.length === 0 ? (
                            <SelectItem value="none" disabled>Nenhum professor encontrado</SelectItem>
                          ) : (
                            teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.first_name} {teacher.last_name} ({teacher.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="inactive">Inativa</SelectItem>
                          <SelectItem value="archived">Arquivada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Turmas ativas aparecem para os alunos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Prazo de Acesso</CardTitle>
                  <CardDescription>Ao matricular um aluno, o acesso expira apos esse prazo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={accessDuration}
                      onChange={e => setAccessDuration(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="Ilimitado"
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
                    <label className="text-sm">Turma padrao - Ingressar membros com acesso ilimitado nesta turma</label>
                  </div>
                </CardContent>
              </Card>

              {modules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Regras de Liberacao de Modulos</CardTitle>
                    <CardDescription>Defina quando cada modulo sera liberado para os alunos desta turma</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                        <span>NOME DO MODULO</span>
                        <span>SELECIONE REGRA</span>
                      </div>
                      {modules.map(mod => {
                        const rule = moduleRules[mod.id] || { rule_type: 'free', rule_value: '' }
                        return (
                          <div key={mod.id} className="grid grid-cols-2 gap-4 items-center py-2 border-b border-border/50">
                            <div>
                              <p className="text-sm font-medium">{mod.name}</p>
                              <p className="text-xs text-muted-foreground">{mod.courseName}</p>
                            </div>
                            <div className="flex gap-2">
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                value={rule.rule_type}
                                onChange={e => {
                                  setModuleRules(prev => ({
                                    ...prev,
                                    [mod.id]: { ...prev[mod.id], rule_type: e.target.value, rule_value: '' }
                                  }))
                                }}
                              >
                                <option value="free">Acesso Livre</option>
                                <option value="scheduled_date">Data programada</option>
                                <option value="days_after_enrollment">Dias apos compra</option>
                                <option value="hidden">Oculto</option>
                                <option value="blocked">Bloqueado</option>
                                <option value="module_completed">Modulo concluido</option>
                              </select>
                              {rule.rule_type === 'scheduled_date' && (
                                <Input type="date" value={rule.rule_value} onChange={e => setModuleRules(prev => ({...prev, [mod.id]: {...prev[mod.id], rule_value: e.target.value}}))} className="w-40" />
                              )}
                              {rule.rule_type === 'days_after_enrollment' && (
                                <Input type="number" value={rule.rule_value} onChange={e => setModuleRules(prev => ({...prev, [mod.id]: {...prev[mod.id], rule_value: e.target.value}}))} placeholder="dias" className="w-24" />
                              )}
                              {rule.rule_type === 'module_completed' && (
                                <select
                                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                  value={rule.rule_value}
                                  onChange={e => {
                                    // Check circular dependency
                                    const allRules = Object.entries(moduleRules).map(([mid, r]) => ({ module_id: mid, class_id: classId!, rule_type: r.rule_type as any, rule_value: r.rule_value }))
                                    if (checkCircularDependency(allRules, mod.id, e.target.value)) {
                                      toast({ title: 'Dependencia circular detectada!', variant: 'destructive' })
                                      return
                                    }
                                    setModuleRules(prev => ({...prev, [mod.id]: {...prev[mod.id], rule_value: e.target.value}}))
                                  }}
                                >
                                  <option value="">Selecione...</option>
                                  {modules.filter(m => m.id !== mod.id).map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/classes')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Turma'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
