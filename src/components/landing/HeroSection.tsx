import { Button } from '@/components/ui/button'
import { ArrowRight, Mountain } from 'lucide-react'
import { Link } from 'react-router-dom'

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-background to-orange-50/30 dark:from-orange-950/20 dark:via-background dark:to-orange-950/10" />
      <div className="container relative pt-20 pb-24 md:pt-32 md:pb-40 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-5 rounded-3xl bg-primary/10">
              <Mountain className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-foreground">
            Alcance o topo com a{' '}
            <span className="text-primary">Everest Preparatórios</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plataforma completa para sua preparação militar. Videoaulas, flashcards,
            simulados, redações e muito mais — tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-base rounded-xl" asChild>
              <a href="#cursos">
                Conheça nossos cursos
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-xl" asChild>
              <Link to="/login">Já sou aluno</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
