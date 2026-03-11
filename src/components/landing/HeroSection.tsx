import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Brain, Trophy, FileText, Headphones, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 dark:from-orange-900 dark:via-orange-800 dark:to-amber-900" />
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      {/* Bottom curve */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full h-auto">
          <path d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" className="fill-background" />
        </svg>
      </div>

      <div className="container relative z-10 pt-20 pb-32 md:pt-24 md:pb-40">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-2 text-sm font-medium text-white mb-8">
            <Target className="h-4 w-4" />
            Preparatório para concursos militares
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white leading-[1.1]">
            Sua aprovação
            <br />
            <span className="text-amber-200">começa aqui.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            A plataforma mais completa para sua preparação. Tudo o que você precisa
            para conquistar sua vaga, em um só lugar.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Button size="lg" className="h-14 px-8 text-base rounded-xl bg-white text-orange-600 hover:bg-white/90 font-bold shadow-lg" asChild>
              <a href="#cursos">
                Ver funcionalidades
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-xl border-white/30 text-white hover:bg-white/10 font-semibold" asChild>
              <Link to="/login">Acessar plataforma</Link>
            </Button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: BookOpen, label: 'Videoaulas' },
              { icon: Brain, label: 'Flashcards' },
              { icon: Trophy, label: 'Simulados' },
              { icon: FileText, label: 'Redações' },
              { icon: Headphones, label: 'Audioaulas' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2 text-sm text-white/90"
              >
                <Icon className="h-4 w-4" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
