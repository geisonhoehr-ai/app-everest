import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Send,
  Loader2,
  Download,
  FileText,
  Save,
  Trash2,
  Lightbulb,
  PenLine,
  Upload,
  Camera,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { submitEssay } from '@/services/essayService'
import { compressFile } from '@/lib/fileCompression'

const DRAFT_KEY = 'everest_essay_draft'

interface EssayDraft {
  theme: string
  text: string
  updatedAt: string
}

function loadDraft(): EssayDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraft(theme: string, text: string) {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({ theme, text, updatedAt: new Date().toISOString() })
  )
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

export default function EssaySubmissionPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  const draft = loadDraft()

  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [theme, setTheme] = useState(draft?.theme || '')
  const [text, setText] = useState(draft?.text || '')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimerRef = useRef<number | null>(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  // Auto-save with debounce
  const debouncedSave = useCallback(
    (newTheme: string, newText: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

      if (!newTheme && !newText) return

      setSaveStatus('saving')
      saveTimerRef.current = window.setTimeout(() => {
        saveDraft(newTheme, newText)
        setSaveStatus('saved')
      }, 800)
    },
    []
  )

  const handleThemeChange = (value: string) => {
    setTheme(value)
    debouncedSave(value, text)
  }

  const handleTextChange = (value: string) => {
    setText(value)
    debouncedSave(theme, value)
  }

  const handleClearDraft = () => {
    setTheme('')
    setText('')
    clearDraft()
    setSaveStatus('idle')
    toast({ title: 'Rascunho apagado' })
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // Show restored draft notification
  useEffect(() => {
    if (draft?.text || draft?.theme) {
      setSaveStatus('saved')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado.', variant: 'destructive' })
      return
    }

    if (!text && !file) {
      toast({ title: 'Erro', description: 'Digite o texto ou envie um arquivo.', variant: 'destructive' })
      return
    }

    try {
      setLoading(true)
      const compressedFile = file ? await compressFile(file) : undefined
      await submitEssay(user.id, theme, text, compressedFile)
      clearDraft()
      toast({ title: 'Redação enviada!', description: 'Você será notificado quando a correção estiver pronta.' })
      navigate('/redacoes')
    } catch {
      toast({ title: 'Erro ao enviar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: 'Máximo 5MB.', variant: 'destructive' })
        e.target.value = ''
        return
      }
      setFile(selectedFile)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/redacoes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Enviar Nova Redação</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monte sua redação aqui e depois envie para correção
        </p>
      </div>

      {/* Step-by-step instructions */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Como funciona?
            </p>
          </div>
          <div className="grid gap-3 ml-8">
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white text-xs font-bold shrink-0 mt-0.5">1</span>
              <p className="text-sm text-foreground">
                <strong>Digite seu tema e rascunho aqui.</strong> Vá escrevendo suas ideias — tudo é salvo automaticamente. Você pode sair e voltar quando quiser.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white text-xs font-bold shrink-0 mt-0.5">2</span>
              <p className="text-sm text-foreground">
                <strong>Baixe a folha de redação modelo</strong> e passe a limpo à mão o que você digitou.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white text-xs font-bold shrink-0 mt-0.5">3</span>
              <p className="text-sm text-foreground">
                <strong>Tire uma foto ou escaneie</strong> a folha preenchida e faça o upload abaixo.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white text-xs font-bold shrink-0 mt-0.5">4</span>
              <p className="text-sm text-foreground">
                <strong>Clique em "Enviar para Correção"</strong> — seu professor receberá tanto o texto digitado quanto a foto da folha.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Theme */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-primary" />
                <Label htmlFor="theme" className="text-base font-semibold">Tema da Redação *</Label>
              </div>
              <Input
                id="theme"
                name="theme"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
                placeholder="Ex: Inteligência Artificial e o Futuro do Trabalho"
                required
              />
            </div>

            {/* Step 2: Text area with auto-save */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <Label htmlFor="essay-text" className="text-base font-semibold">Sua Redação (Rascunho)</Label>
                </div>
                <div className="flex items-center gap-3">
                  {/* Save status indicator */}
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Salvando...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Rascunho salvo
                    </span>
                  )}
                  {/* Clear draft button */}
                  {(text || theme) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearDraft}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                id="essay-text"
                name="essay-text"
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Comece a escrever sua redação aqui... Suas ideias são salvas automaticamente."
                rows={18}
                className="resize-y"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'} · {charCount} {charCount === 1 ? 'caractere' : 'caracteres'}
                </p>
                {wordCount > 0 && wordCount < 20 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Redações geralmente têm entre 20 e 30 linhas
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Folha manuscrita</span>
              </div>
            </div>

            {/* Model download */}
            <div className="rounded-lg border border-border p-4 bg-muted/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Folha de Redação Modelo</p>
                  <p className="text-xs text-muted-foreground">
                    Imprima, passe a limpo e tire uma foto para enviar
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
                <a href="/folha-redacao.pdf" download="Folha_Redacao_Everest.pdf" target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Baixar Folha
                </a>
              </Button>
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <Label htmlFor="file-upload" className="text-base font-semibold">Foto ou Arquivo da Redação</Label>
              </div>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="cursor-pointer file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Foto (JPG, PNG), PDF ou DOCX. Máximo: 5MB.
              </p>
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Upload className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground max-w-[60%]">
                Ao enviar, seu professor receberá o texto digitado e o arquivo anexado (se houver).
              </p>
              <Button type="submit" disabled={loading} className="gap-2 transition-all duration-200 hover:shadow-md hover:bg-green-600">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar para Correção
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
