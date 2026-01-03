import { useState } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { logger } from '@/lib/logger'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { importAll } from '@/services/memberkitService'
import { useToast } from '@/hooks/use-toast'

export default function MemberkitImportPage() {
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const handleImport = async () => {
    setImporting(true)
    setResults(null)

    try {
      const importResults = await importAll()
      setResults({
        total: importResults.classrooms.total + importResults.users.total + importResults.courses.total,
        imported: importResults.classrooms.success + importResults.users.success + importResults.courses.success,
        skipped: importResults.classrooms.skipped + importResults.users.skipped + importResults.courses.skipped,
        errors: importResults.classrooms.errors + importResults.users.errors + importResults.courses.errors,
      })

      toast({
        title: 'Importação Concluída!',
        description: `${importResults.classrooms.success} turmas, ${importResults.users.success} usuários e ${importResults.courses.success} cursos importados`,
      })
    } catch (error) {
      logger.error('Erro na importação:', error)
      toast({
        title: 'Erro na Importação',
        description: 'Ocorreu um erro ao importar as turmas da Memberkit',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <MagicLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Importação Memberkit</h1>
          <p className="text-muted-foreground">
            Importe todas as turmas da plataforma Memberkit para o sistema
          </p>
        </div>

        <div className="grid gap-6">
          {/* Card de Importação */}
          <MagicCard className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Importar Turmas
                </h2>
                <p className="text-sm text-muted-foreground">
                  Clique no botão abaixo para importar todas as turmas da Memberkit.
                  Turmas já existentes serão ignoradas.
                </p>
              </div>
            </div>

            <Button
              onClick={handleImport}
              disabled={importing}
              size="lg"
              className="w-full sm:w-auto"
            >
              {importing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Iniciar Importação
                </>
              )}
            </Button>
          </MagicCard>

          {/* Card de Resultados */}
          {results && (
            <MagicCard className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Resultados da Importação
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                  <AlertCircle className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{results.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {results.imported}
                    </p>
                    <p className="text-sm text-muted-foreground">Importadas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {results.skipped}
                    </p>
                    <p className="text-sm text-muted-foreground">Ignoradas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {results.errors}
                    </p>
                    <p className="text-sm text-muted-foreground">Erros</p>
                  </div>
                </div>
              </div>
            </MagicCard>
          )}

          {/* Card de Informações */}
          <MagicCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informações</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Importação Segura:</strong> Turmas já existentes não serão duplicadas
                </p>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Limite de Taxa:</strong> Respeitamos o limite de 120 requisições/minuto da Memberkit
                </p>
              </div>

              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Atenção:</strong> A importação pode levar alguns minutos dependendo da quantidade de turmas
                </p>
              </div>

              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Segurança:</strong> Lembre-se de trocar a chave API após concluir a importação!
                </p>
              </div>
            </div>
          </MagicCard>
        </div>
      </div>
    </MagicLayout>
  )
}
