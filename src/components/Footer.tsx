import { Link } from 'react-router-dom'
import { Mountain, Twitter, Github, Linkedin } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="bg-slate-100 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <Mountain className="h-6 w-6 text-primary" />
              <span>Everest Preparatórios</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Sua jornada para a aprovação começa aqui. A plataforma completa
              para seus estudos.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 md:col-span-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3">Plataforma</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/meus-cursos"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Cursos
                  </Link>
                </li>
                <li>
                  <Link
                    to="/simulados"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Simulados
                  </Link>
                </li>
                <li>
                  <Link
                    to="/redacoes"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Redações
                  </Link>
                </li>
                <li>
                  <a
                    href="/#planos"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Planos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/termos"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Termos de Serviço
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacidade"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="text-muted-foreground hover:text-primary"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contato"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Contato
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Everest Preparatórios. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  )
}
