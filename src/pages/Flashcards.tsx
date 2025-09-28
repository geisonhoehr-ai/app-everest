import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  getSubjects,
  type SubjectWithTopicCount,
} from '@/services/subjectService'
import { SectionLoader } from '@/components/SectionLoader'
import { useStaggeredAnimation } from '@/hooks/useAnimations'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'

const groupBy = <T, K extends keyof any>(list: T[], getKey: (item: T) => K) =>
  list.reduce(
    (previous, currentItem) => {
      const group = getKey(currentItem)
      if (!previous[group]) previous[group] = []
      previous[group].push(currentItem)
      return previous
    },
    {} as Record<K, T[]>,
  )

export default function FlashcardsPage() {
  const [subjects, setSubjects] = useState<SubjectWithTopicCount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getSubjects()
      .then(setSubjects)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <SectionLoader />
  }

  const groupedSubjects = groupBy(
    subjects,
    (subject) => subject.category || 'Outros',
  )

  const allSubjects = Object.values(groupedSubjects).flat()
  const delays = useStaggeredAnimation(allSubjects.length, 100)
  let currentIndex = 0

  return (
    <MagicLayout
      title="Flashcards"
      description="Selecione uma matéria para começar a revisar seus conhecimentos."
    >
      <div className="space-y-12">
        {Object.entries(groupedSubjects).map(([category, subjectList], categoryIndex) => (
          <div key={category} className="animate-fade-in-up" style={{ animationDelay: `${300 + categoryIndex * 100}ms` }}>
            <div className="flex items-center gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {category.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-600 to-primary-700 bg-clip-text text-transparent cyber-glow">
                    {category}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {subjectList.length} matéria{subjectList.length > 1 ? 's' : ''} disponível{subjectList.length > 1 ? 'is' : ''}
                  </p>
                </div>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
            </div>
            
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {subjectList.map((subject, index) => {
                const delay = delays[currentIndex++].delay
                const totalTopics = subject.topics?.length || 0
                const progress = Math.min(100, (totalTopics * 10) + Math.random() * 30)
                
                return (
                  <Link 
                    to={`/flashcards/${subject.id}`} 
                    key={subject.id}
                    className="group block"
                  >
                    <MagicCard
                      className="h-full flex flex-col overflow-hidden"
                      glow={false}
                      gradient={false}
                      led
                      ledColor={index % 4 === 0 ? 'cyan' : index % 4 === 1 ? 'purple' : index % 4 === 2 ? 'orange' : 'green'}
                      style={{ animationDelay: `${delay}ms` }}
                    >
                      {/* Header compacto */}
                      <div className="relative h-40 sm:h-44 overflow-hidden">
                        <img
                          src={
                            subject.image_url ||
                            `https://img.usecurling.com/p/400/200?q=${encodeURIComponent(
                              subject.name,
                            )}`
                          }
                          alt={subject.name}
                          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                        />
                        
                        {/* Overlay simples */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        {/* Badge de Status */}
                        <div className="absolute top-3 left-3">
                          <div className="bg-success text-white px-2 py-1 rounded-md text-xs font-medium shadow-sm">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              Ativo
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress */}
                        <div className="absolute top-3 right-3">
                          <div className="bg-black/70 text-white px-2 py-1 rounded-md text-xs font-bold">
                            {Math.round(progress)}%
                          </div>
                        </div>
                        
                        {/* Título */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-white text-lg font-bold drop-shadow-sm">
                            {subject.name}
                          </h3>
                          <p className="text-white/80 text-xs line-clamp-1">
                            {subject.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Conteúdo compacto */}
                      <div className="flex-grow flex flex-col p-4">
                        <div className="space-y-3">
                          {/* Stats simples */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-muted-foreground">{totalTopics} tópicos</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-success" />
                                <span className="text-muted-foreground">{Math.round(progress)}%</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress Bar simples */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progresso</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-muted/30 rounded-full h-1.5">
                              <div 
                                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Botão simples */}
                          <button className="w-full bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm">
                            Iniciar Estudo
                          </button>
                        </div>
                      </div>
                    </MagicCard>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </MagicLayout>
  )
}
