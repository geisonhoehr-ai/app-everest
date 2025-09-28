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
import { BookOpen, Brain, Zap, Target, Sparkles } from 'lucide-react'

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

  const ledColors = ['purple', 'cyan', 'pink', 'blue', 'green', 'orange'] as const
  const icons = [BookOpen, Brain, Zap, Target]

  return (
    <MagicLayout
      title="Flashcards"
      description="Domine qualquer assunto com nossos flashcards inteligentes e interativos."
    >
      <div className="space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-cyan-500/10 border border-primary/20 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Sistema Inteligente de Aprendizado</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-gradientShift">
            Flashcards
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transforme seu estudo com nossa plataforma avançada de flashcards, 
            projetada para maximizar sua retenção e acelerar seu aprendizado.
          </p>
        </div>

        {Object.entries(groupedSubjects).map(([category, subjectList], categoryIndex) => {
          const IconComponent = icons[categoryIndex % icons.length]
          
          return (
            <div key={category} className="animate-fade-in-up" style={{ animationDelay: `${300 + categoryIndex * 100}ms` }}>
              {/* Category Header */}
              <div className="flex items-center gap-8 mb-12">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 via-purple-500/20 to-cyan-500/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-primary/30 animate-premiumFloat">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                      {subjectList.length}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-neonPulse">
                      {category}
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      {subjectList.length} matéria{subjectList.length > 1 ? 's' : ''} disponível{subjectList.length > 1 ? 'is' : ''} para estudo
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-purple-500/30 to-cyan-500/30" />
              </div>
              
              {/* Cards Grid */}
              <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {subjectList.map((subject, index) => {
                  const delay = delays[currentIndex++].delay
                  const totalTopics = subject.topics?.length || 0
                  const progress = Math.min(100, (totalTopics * 10) + Math.random() * 30)
                  const ledColor = ledColors[index % ledColors.length]
                  
                  return (
                    <Link 
                      to={`/flashcards/${subject.id}`} 
                      key={subject.id}
                      className="group block"
                    >
                      <MagicCard
                        variant="premium"
                        size="lg"
                        className="h-full flex flex-col overflow-hidden animate-glassShimmer"
                        led
                        ledColor={ledColor}
                        style={{ animationDelay: `${delay}ms` }}
                      >
                        {/* Premium Header */}
                        <div className="relative h-48 sm:h-52 overflow-hidden rounded-t-2xl">
                          <img
                            src={
                              subject.image_url ||
                              `https://img.usecurling.com/p/400/200?q=${encodeURIComponent(
                                subject.name,
                              )}`
                            }
                            alt={subject.name}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                          />
                          
                          {/* Premium Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          
                          {/* Floating Particles */}
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-4 left-4 w-1 h-1 bg-primary/80 rounded-full animate-particleFloat" />
                            <div className="absolute top-8 right-6 w-0.5 h-0.5 bg-cyan-400/80 rounded-full animate-particleFloat" style={{ animationDelay: '1s' }} />
                            <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-particleFloat" style={{ animationDelay: '2s' }} />
                          </div>
                          
                          {/* Status Badge */}
                          <div className="absolute top-4 left-4">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg backdrop-blur-sm border border-white/20">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                Ativo
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress Badge */}
                          <div className="absolute top-4 right-4">
                            <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/20">
                              {Math.round(progress)}%
                            </div>
                          </div>
                          
                          {/* Title Section */}
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white text-xl font-black drop-shadow-lg mb-1">
                              {subject.name}
                            </h3>
                            <p className="text-white/90 text-sm line-clamp-2 font-medium">
                              {subject.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Premium Content */}
                        <div className="flex-grow flex flex-col p-6 bg-gradient-to-b from-card/50 to-card/90">
                          <div className="space-y-4">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-sm font-bold text-primary">{totalTopics} tópicos</span>
                              </div>
                              <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-bold text-green-500">{Math.round(progress)}%</span>
                              </div>
                            </div>
                            
                            {/* Premium Progress Bar */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                                <span>Progresso</span>
                                <span className="text-primary">{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full bg-muted/20 rounded-full h-2 backdrop-blur-sm border border-white/10">
                                <div 
                                  className="bg-gradient-to-r from-primary via-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-700 animate-gradientShift"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            
                            {/* Premium Button */}
                            <button className="w-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 text-sm animate-neonPulse">
                              <div className="flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" />
                                Iniciar Estudo
                              </div>
                            </button>
                          </div>
                        </div>
                      </MagicCard>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </MagicLayout>
  )
}