import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { useToast } from '@/hooks/use-toast'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  GraduationCap,
  Lock,
  Brain,
  Target,
  Mic,
  FileText,
  Trophy,
  BookOpen,
  Headphones,
  Calendar,
  Save,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Users,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  FEATURE_KEYS,
  type FeatureKey,
  getClassFeaturePermissions,
  updateClassFeaturePermissions,
} from '@/services/classPermissionsService'
import { supabase } from '@/lib/supabase/client'

/**
 * Página de Gerenciamento de Permissões por Turma
 *
 * Permite que administradores configurem quais recursos
 * cada turma pode acessar na plataforma.
 */

interface Class {
  id: string
  name: string
  description: string | null
  teacher_id: string
  start_date: string
  end_date: string | null
  class_type: 'standard' | 'trial'
}

interface FeatureOption {
  key: FeatureKey
  label: string
  description: string
  icon: React.ElementType
  category: 'core' | 'content' | 'gamification'
}

// Recursos CONTROLÁVEIS por turma
// NOTA: Os recursos abaixo são NÃO marcados são SEMPRE VISÍVEIS para todos os alunos:
// ✅ Dashboard, Calendário, Ranking, Fórum, Conquistas, Progresso, Notificações, Configurações
const FEATURE_OPTIONS: FeatureOption[] = [
  {
    key: FEATURE_KEYS.FLASHCARDS,
    label: 'Flashcards',
    description: 'Sistema de revisão espaçada com flashcards',
    icon: Brain,
    category: 'content'
  },
  {
    key: FEATURE_KEYS.QUIZ,
    label: 'Quizzes',
    description: 'Quizzes e simulados',
    icon: Target,
    category: 'content'
  },
  {
    key: FEATURE_KEYS.EVERCAST,
    label: 'Evercast',
    description: 'Aulas em áudio (podcast)',
    icon: Mic,
    category: 'content'
  },
  {
    key: FEATURE_KEYS.ESSAYS,
    label: 'Redações',
    description: 'Sistema de redações e correções',
    icon: FileText,
    category: 'content'
  },
  {
    key: FEATURE_KEYS.VIDEO_LESSONS,
    label: 'Videoaulas',
    description: 'Cursos em vídeo',
    icon: BookOpen,
    category: 'content'
  },
  {
    key: FEATURE_KEYS.AUDIO_LESSONS,
    label: 'Aulas em Áudio',
    description: 'Módulos de áudio e podcasts educativos',
    icon: Headphones,
    category: 'content'
  },
]

export default function AdminClassPermissionsPage() {
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedPermissions, setSelectedPermissions] = useState<FeatureKey[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Buscar turmas
  useEffect(() => {
    loadClasses()
  }, [])

  // Buscar permissões quando seleciona uma turma
  useEffect(() => {
    if (selectedClassId) {
      loadPermissions(selectedClassId)
    }
  }, [selectedClassId])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name')

      if (error) throw error

      setClasses(data || [])
    } catch (error) {
      logger.error('Erro ao carregar turmas:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as turmas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async (classId: string) => {
    try {
      setLoading(true)
      const permissions = await getClassFeaturePermissions(classId)
      const featureKeys = permissions.map(p => p.feature_key as FeatureKey)
      setSelectedPermissions(featureKeys)
    } catch (error) {
      logger.error('Erro ao carregar permissões:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as permissões.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = (featureKey: FeatureKey) => {
    setSelectedPermissions(prev => {
      if (prev.includes(featureKey)) {
        return prev.filter(k => k !== featureKey)
      } else {
        return [...prev, featureKey]
      }
    })
  }

  const handleSelectAll = () => {
    const allKeys = FEATURE_OPTIONS.map(f => f.key)
    setSelectedPermissions(allKeys)
  }

  const handleDeselectAll = () => {
    setSelectedPermissions([])
  }

  const handleSave = async () => {
    if (!selectedClassId) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma turma primeiro.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      const result = await updateClassFeaturePermissions(
        selectedClassId,
        selectedPermissions
      )

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: 'Permissões atualizadas com sucesso.',
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      logger.error('Erro ao salvar permissões:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as permissões.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const selectedClass = classes.find(c => c.id === selectedClassId)

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'core':
        return 'Essenciais'
      case 'content':
        return 'Conteúdo'
      case 'gamification':
        return 'Gamificação'
      default:
        return 'Outros'
    }
  }

  const groupedFeatures = FEATURE_OPTIONS.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = []
    }
    acc[feature.category].push(feature)
    return acc
  }, {} as Record<string, FeatureOption[]>)

  return (
    <MagicLayout
      title="Permissões por Turma"
      description="Configure quais recursos cada turma pode acessar na plataforma"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <MagicCard variant="premium" size="lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gerenciamento de Permissões</h1>
                <p className="text-muted-foreground">
                  Controle granular de acesso por turma
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-600">
              <Users className="h-3 w-3 mr-1" />
              {classes.length} Turmas
            </Badge>
          </div>
        </MagicCard>

        {/* Seleção de Turma */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">Selecione uma Turma</Label>
            </div>

            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha uma turma..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cls.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {cls.class_type === 'trial' ? 'Trial' : 'Padrão'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedClass && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{selectedClass.name}</h4>
                    {selectedClass.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {selectedClass.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Início: {new Date(selectedClass.start_date).toLocaleDateString('pt-BR')}</span>
                      {selectedClass.end_date && (
                        <span>Fim: {new Date(selectedClass.end_date).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </MagicCard>

        {/* Recursos Disponíveis */}
        {selectedClassId && (
          <MagicCard variant="glass" size="lg">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-lg font-semibold">Recursos Controláveis</Label>
                    <p className="text-sm text-muted-foreground">
                      Configure quais recursos adicionais esta turma pode acessar
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Nenhum
                  </Button>
                </div>
              </div>

              {/* Info Box - Recursos Padrão */}
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-600 mb-2">Recursos Padrão (Sempre Visíveis)</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Todos os alunos têm acesso automático aos seguintes recursos, independente da turma:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-700">
                        Dashboard
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-700">
                        Calendário
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-700">
                        Ranking
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-700">
                        Fórum
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-700">
                        Conquistas
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-700">
                        Progresso
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-700">
                        Notificações
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-700">
                        Configurações
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {Object.entries(groupedFeatures).map(([category, features]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {getCategoryLabel(category)}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {features.filter(f => selectedPermissions.includes(f.key)).length}/{features.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {features.map(feature => {
                      const isSelected = selectedPermissions.includes(feature.key)
                      return (
                        <div
                          key={feature.key}
                          className={cn(
                            'p-4 rounded-xl border transition-all cursor-pointer',
                            isSelected
                              ? 'bg-primary/5 border-primary/50'
                              : 'bg-card/50 border-border/50 hover:border-primary/30'
                          )}
                          onClick={() => handleTogglePermission(feature.key)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleTogglePermission(feature.key)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <feature.icon className="h-4 w-4 text-primary" />
                                <span className="font-semibold">{feature.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Info Box */}
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <h4 className="font-semibold text-blue-600 mb-1">Importante</h4>
                    <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Alunos só verão os recursos marcados acima no menu e dashboard</li>
                      <li>Professores e Administradores sempre têm acesso total</li>
                      <li>As alterações são aplicadas imediatamente após salvar</li>
                      <li>Alunos precisam fazer logout/login para ver as mudanças</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={() => loadPermissions(selectedClassId)}
                  disabled={loading || saving}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || saving}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Permissões'}
                </Button>
              </div>
            </div>
          </MagicCard>
        )}

        {/* Empty State */}
        {!selectedClassId && !loading && (
          <MagicCard variant="glass" size="lg" className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Selecione uma Turma</h3>
              <p className="text-muted-foreground">
                Escolha uma turma acima para configurar as permissões de acesso aos recursos da plataforma.
              </p>
            </div>
          </MagicCard>
        )}
      </div>
    </MagicLayout>
  )
}
