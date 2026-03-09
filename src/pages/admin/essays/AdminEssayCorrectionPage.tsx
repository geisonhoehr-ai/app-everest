import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import {
  getEssayForCorrection,
  getErrorCategories,
  saveCorrection,
  type EssayForCorrection,
  type ErrorCategory,
  type EssayAnnotation,
} from '@/services/essayService'
import { useAuth } from '@/hooks/use-auth'
import { SectionLoader } from '@/components/SectionLoader'
import { InteractiveEssayEditor } from '@/components/admin/essays/InteractiveEssayEditor'
import { CorrectionPanel } from '@/components/admin/essays/CorrectionPanel'
import { useToast } from '@/hooks/use-toast'
import { createNotification } from '@/services/notificationService'
import { essayCorrectionService } from '@/services/essayCorrectionService'

export default function AdminEssayCorrectionPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [essay, setEssay] = useState<EssayForCorrection | null>(null)
  const [annotations, setAnnotations] = useState<EssayAnnotation[]>([])
  const [errorCategories, setErrorCategories] = useState<ErrorCategory[]>([])
  const [selectedAnnotation, setSelectedAnnotation] = useState<EssayAnnotation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAILoading, setIsAILoading] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!submissionId) return
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [essayData, categoriesData] = await Promise.all([
          getEssayForCorrection(submissionId),
          getErrorCategories(),
        ])
        setEssay(essayData)
        setErrorCategories(categoriesData)

        if (essayData?.ai_analysis) {
          const aiAnnotations = (essayData.ai_analysis as any).annotations as EssayAnnotation[]
          if (aiAnnotations) setAnnotations(aiAnnotations)
        }

        if ((essayData as any)?.file_url) {
          const { data } = await supabase.storage
            .from('essays')
            .createSignedUrl((essayData as any).file_url, 3600)
          if (data?.signedUrl) setFileUrl(data.signedUrl)
        }
      } catch {
        toast({ title: 'Erro ao carregar redação', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [submissionId])

  const handleAICorrection = async () => {
    if (!essay || !user) return
    try {
      setIsAILoading(true)
      toast({ title: 'Iniciando análise com IA', description: 'Isso pode levar alguns segundos...' })

      await essayCorrectionService.correctWithAI({
        essayId: essay.id,
        essay: essay.submission_text,
        theme: essay.essay_prompts?.title || 'Tema Livre',
        criteria: 'ENEM',
        userId: essay.student_id,
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))
      const updatedEssay = await getEssayForCorrection(submissionId!)
      if (updatedEssay) {
        setEssay(updatedEssay)
        if (updatedEssay.ai_analysis) {
          const aiAnnotations = (updatedEssay.ai_analysis as any).annotations as EssayAnnotation[]
          if (aiAnnotations) setAnnotations(aiAnnotations)
        }
      }
      toast({ title: 'Análise concluída!', description: 'Sugestões da IA foram aplicadas.' })
    } catch {
      toast({ title: 'Erro na análise', description: 'Não foi possível gerar a correção com IA.', variant: 'destructive' })
    } finally {
      setIsAILoading(false)
    }
  }

  const handleTextSelect = (start: number, end: number) => {
    const newAnnotation: EssayAnnotation = {
      id: `new-${Date.now()}`,
      essay_id: submissionId!,
      start_offset: start,
      end_offset: end,
      annotation_text: '',
      suggested_correction: '',
      error_category_id: null,
      teacher_id: user?.id || null,
      created_at: new Date().toISOString(),
    }
    setSelectedAnnotation(newAnnotation)
  }

  const handleAnnotationClick = (annotation: EssayAnnotation) => {
    setSelectedAnnotation(annotation)
  }

  const handleAnnotationUpdate = (updatedAnnotation: EssayAnnotation) => {
    setAnnotations((prev) => {
      const exists = prev.find((a) => a.id === updatedAnnotation.id)
      if (exists) return prev.map((a) => (a.id === updatedAnnotation.id ? updatedAnnotation : a))
      return [...prev, updatedAnnotation]
    })
    setSelectedAnnotation(null)
  }

  const handleAnnotationDelete = (annotationId: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== annotationId))
    setSelectedAnnotation(null)
  }

  const handleFinalizeCorrection = async (payload: { finalGrade: number; feedback: string }) => {
    if (!submissionId || !user || !essay) return
    try {
      await saveCorrection(submissionId, user.id, {
        final_grade: payload.finalGrade,
        teacher_feedback_text: payload.feedback,
        annotations,
      })

      await createNotification({
        user_id: essay.student_id,
        type: 'essay_corrected',
        title: 'Sua redação foi corrigida!',
        message: `A redação sobre "${essay.essay_prompts?.title}" recebeu a nota ${payload.finalGrade}.`,
        related_entity_id: essay.id,
        related_entity_type: 'essay',
      })

      toast({ title: 'Correção finalizada com sucesso!' })
      navigate(`/admin/essays/${essay?.prompt_id}/submissions`)
    } catch {
      toast({ title: 'Erro ao salvar correção', variant: 'destructive' })
    }
  }

  if (isLoading) return <SectionLoader />

  if (!essay) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Redação não encontrada</h1>
        <Button asChild variant="outline">
          <Link to="/admin/essays">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
    )
  }

  const isImage =
    fileUrl &&
    /\.(jpg|jpeg|png)$/i.test((essay as any).file_url || '')

  const studentName = `${essay.users?.first_name || ''} ${essay.users?.last_name || ''}`.trim()
  const className = essay.users?.student_classes?.[0]?.classes?.name

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(`/admin/essays/${essay.prompt_id}/submissions`)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos envios
          </button>
          <h1 className="text-xl font-bold text-foreground">Corrigir Redação</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{studentName || 'Aluno'}</span>
            {className && (
              <Badge variant="outline" className="text-xs">
                {className}
              </Badge>
            )}
          </div>
        </div>
        {!essay.ai_analysis && (
          <Button
            variant="outline"
            onClick={handleAICorrection}
            disabled={isAILoading}
            className="gap-2 transition-all duration-200 hover:shadow-md hover:border-primary/30"
          >
            {isAILoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Correção IA
              </>
            )}
          </Button>
        )}
      </div>

      {/* Editor + Panel */}
      <div className="grid lg:grid-cols-3 gap-4 flex-grow overflow-hidden">
        <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
          {fileUrl ? (
            <div className="flex-1 border border-border rounded-xl overflow-auto bg-muted/20">
              {isImage ? (
                <img
                  src={fileUrl}
                  alt="Redação Digitalizada"
                  className="max-w-full h-auto mx-auto"
                />
              ) : (
                <iframe src={fileUrl} className="w-full h-full" title="Redação PDF" />
              )}
            </div>
          ) : (
            <InteractiveEssayEditor
              text={essay.submission_text}
              annotations={annotations}
              onTextSelect={handleTextSelect}
              onAnnotationClick={handleAnnotationClick}
            />
          )}
        </div>
        <div className="lg:col-span-1 h-full overflow-auto">
          <CorrectionPanel
            key={essay.updated_at || Date.now()}
            essay={essay}
            errorCategories={errorCategories}
            selectedAnnotation={selectedAnnotation}
            onAnnotationUpdate={handleAnnotationUpdate}
            onAnnotationDelete={handleAnnotationDelete}
            onFinalizeCorrection={handleFinalizeCorrection}
          />
        </div>
      </div>
    </div>
  )
}
