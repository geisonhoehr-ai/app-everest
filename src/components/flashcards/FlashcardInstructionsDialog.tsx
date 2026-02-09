import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Info, Brain, Calendar, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FlashcardInstructionsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const FlashcardInstructionsDialog = ({
  isOpen,
  onClose,
}: FlashcardInstructionsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                Como Funciona o Sistema de Flashcards
              </DialogTitle>
              <DialogDescription className="text-base">
                Aprenda a usar a auto-avaliação para maximizar seu aprendizado
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Como funciona */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-lg">Como Funciona</h3>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                1. Você verá a <strong>pergunta</strong> do flashcard
              </p>
              <p className="text-sm">
                2. Tente <strong>lembrar a resposta</strong> mentalmente
              </p>
              <p className="text-sm">
                3. Clique em <strong>"Mostrar Resposta"</strong> para ver a resposta correta
              </p>
              <p className="text-sm">
                4. <strong>Avalie</strong> o quão difícil foi para você lembrar
              </p>
            </div>
          </div>

          {/* Níveis de Dificuldade */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-lg">Escolha a Dificuldade Honestamente</h3>
            </div>

            <div className="space-y-3">
              {/* Difícil */}
              <div className="border-2 border-red-200 dark:border-red-900/50 rounded-lg p-4 bg-red-50/50 dark:bg-red-950/10">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-red-700 dark:text-red-400">🔴 Difícil</h4>
                      <Badge variant="destructive" className="text-xs">
                        Conta como ERRO
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Quando usar:</strong> Você errou ou teve muita dificuldade para lembrar
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Volta em <strong>1 dia</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Médio */}
              <div className="border-2 border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4 bg-yellow-50/50 dark:bg-yellow-950/10">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-yellow-700 dark:text-yellow-400">🟡 Médio</h4>
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                        Conta como ACERTO
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Quando usar:</strong> Você acertou, mas demorou para lembrar ou não tem certeza
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Volta em <strong>~6 dias</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fácil */}
              <div className="border-2 border-green-200 dark:border-green-900/50 rounded-lg p-4 bg-green-50/50 dark:bg-green-950/10">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-green-700 dark:text-green-400">🟢 Fácil</h4>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                        Conta como ACERTO
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Quando usar:</strong> Você sabia a resposta imediatamente, sem hesitar
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Volta em <strong>semanas ou meses</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dicas Importantes */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-900/50">
            <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              💡 Dicas para Melhor Aprendizado
            </h4>
            <ul className="space-y-2 text-sm text-purple-900 dark:text-purple-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">✓</span>
                <span><strong>Seja honesto:</strong> O sistema só funciona se você avaliar corretamente sua dificuldade</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">✓</span>
                <span><strong>Não marque tudo como "Fácil":</strong> Isso fará os cards demorarem muito para voltar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">✓</span>
                <span><strong>Use "Difícil" sem medo:</strong> É melhor revisar mais vezes do que esquecer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">✓</span>
                <span><strong>Estude regularmente:</strong> O sistema funciona melhor com consistência</span>
              </li>
            </ul>
          </div>

          {/* Botão */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={onClose}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
            >
              Entendi, Começar Agora!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
