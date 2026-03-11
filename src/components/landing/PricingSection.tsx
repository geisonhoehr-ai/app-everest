import { Button } from '@/components/ui/button'
import { Mountain, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export const PricingSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-orange-50 via-background to-orange-50/30 dark:from-orange-950/20 dark:via-background dark:to-orange-950/10">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-3xl bg-primary/10">
              <Mountain className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground">
            Acesse a plataforma agora e comece sua preparação.
            Já é aluno? Faça login com seu email.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 text-base rounded-xl" asChild>
              <Link to="/login">
                Acessar a Plataforma
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
