import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export const HeroSection = () => {
  return (
    <section className="relative bg-background">
      <div className="container pt-20 pb-24 md:pt-32 md:pb-40 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary mb-4 animate-fade-in-down">
            A sua aprovação está mais perto do que nunca
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 animate-fade-in-up text-foreground">
            Alcance o topo com a Everest Preparatórios
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in-up animation-delay-200">
            A plataforma completa para sua preparação, com flashcards, quizzes,
            aulas ao vivo e offline, e muito mais.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up animation-delay-400">
            <Button size="lg" asChild>
              <a href="#planos">
                Comece a estudar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline">
              Ver cursos
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
