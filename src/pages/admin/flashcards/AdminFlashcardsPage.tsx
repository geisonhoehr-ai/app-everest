import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, BookOpen, TrendingUp, Layers } from 'lucide-react'
import { getSubjects } from '@/services/subjectService'
import type { SubjectWithTopicCount } from '@/services/subjectService'

export default function AdminFlashcardsPage() {
  const [subjects, setSubjects] = useState<SubjectWithTopicCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await getSubjects()
        setSubjects(data)
      } catch (error) {
        console.error('Erro ao carregar matérias:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSubjects()
  }, [])

  const totalTopics = subjects.reduce((acc, subject) => acc + subject.topics.length, 0)

  return (
    <MagicLayout 
      title="Flashcards" 
      description="Gerencie as matérias e tópicos de flashcards do sistema"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-end">
          <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80">
            <PlusCircle className="h-5 w-5" />
            Nova Matéria
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <MagicCard variant="glass" glow>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Matérias</p>
                <h3 className="text-3xl font-bold mt-1">{subjects.length}</h3>
              </div>
            </div>
          </MagicCard>
          
          <MagicCard variant="glass" glow>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10">
                  <Layers className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Tópicos</p>
                <h3 className="text-3xl font-bold mt-1">{totalTopics}</h3>
              </div>
            </div>
          </MagicCard>
          
          <MagicCard variant="glass" glow>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
                <Badge variant="secondary" className="text-xs">Ativo</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <h3 className="text-3xl font-bold mt-1 text-green-500">Online</h3>
              </div>
            </div>
          </MagicCard>
        </div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : subjects.length === 0 ? (
          <MagicCard variant="premium" size="lg">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma matéria encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comece criando sua primeira matéria de flashcards
              </p>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                <PlusCircle className="h-4 w-4" />
                Criar Primeira Matéria
              </Button>
            </div>
          </MagicCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link to={`/admin/flashcards/${subject.id}`} key={subject.id}>
                <MagicCard variant="premium" glow className="group transition-all duration-300 hover:-translate-y-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {subject.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {subject.description || 'Sem descrição'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Layers className="h-4 w-4" />
                        <span>{subject.topics.length} tópicos</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Ativo
                      </Badge>
                    </div>
                    
                    <div className="h-1 w-full rounded-full bg-border/50">
                      <div 
                        className="h-1 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                        style={{ width: `${Math.min((subject.topics.length / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </MagicCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MagicLayout>
  )
}
