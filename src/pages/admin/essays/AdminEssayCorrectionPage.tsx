import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
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
import { useToast } from '@/components/ui/use-toast'
import { createNotification } from '@/services/notificationService'
import { essayCorrectionService } from '@/services/essayCorrectionService'
import { Loader2, Sparkles } from 'lucide-react'

export default function AdminEssayCorrectionPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [essay, setEssay] = useState<EssayForCorrection | null>(null)
  const [annotations, setAnnotations] = useState<EssayAnnotation[]>([])
  const [errorCategories, setErrorCategories] = useState<ErrorCategory[]>([])
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<EssayAnnotation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAILoading, setIsAILoading] = useState(false)

  const [fileUrl, setFileUrl] = useState<string | null>(null)

  const handleAICorrection = async () => {
    if (!essay || !user) return

    try {
      setIsAILoading(true)
      toast({
        title: 'Iniciando análise com IA',
        description: 'Isso pode levar alguns segundos...',
      })

      const analysis = await essayCorrectionService.correctWithAI({
        essayId: essay.id,
        essay: essay.submission_text,
        theme: essay.essay_prompts?.title || 'Tema Livre',
        criteria: 'ENEM', // Default to ENEM for now, could be dynamic
        userId: essay.student_id,
      })

      // Update local state with analysis results
      setIsLoading(true) // Force re-render/re-computation if needed, or simple update

      // We fetch the updated data to get the AI analysis stored in the essay
      await new Promise(resolve => setTimeout(resolve, 1000)) // slight delay for DB propagation
      const updatedEssay = await getEssayForCorrection(submissionId!)

      if (updatedEssay) {
        setEssay(updatedEssay)
        // If there were annotations saved in ai_analysis, load them
        if (updatedEssay.ai_analysis) {
          const aiAnnotations = (updatedEssay.ai_analysis as any).annotations as EssayAnnotation[]
          if (aiAnnotations) {
            setAnnotations(aiAnnotations)
          }
        }
      }

      toast({
        title: 'Análise concluída!',
        description: 'Sugestões da IA foram aplicadas.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível gerar a correção com IA.',
        variant: 'destructive',
      })
    } finally {
      setIsAILoading(false)
      setIsLoading(false)
    }
  }

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
          const aiAnnotations = (essayData.ai_analysis as any)
            .annotations as EssayAnnotation[]
          setAnnotations(aiAnnotations)
        }

        // Get signed URL if file exists
        if ((essayData as any)?.file_url) {
          const { data } = await supabase.storage
            .from('essays')
            .createSignedUrl((essayData as any).file_url, 3600) // 1 hour validity

          if (data?.signedUrl) {
            setFileUrl(data.signedUrl)
          }
        }

      } catch (error) {
        toast({
          title: 'Erro ao carregar redação',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [submissionId, toast])

  const handleTextSelect = (start: number, end: number, text: string) => {
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
      const existing = prev.find((a) => a.id === updatedAnnotation.id)
      if (existing) {
        return prev.map((a) =>
          a.id === updatedAnnotation.id ? updatedAnnotation : a,
        )
      }
      return [...prev, updatedAnnotation]
    })
    setSelectedAnnotation(null)
  }

  const handleAnnotationDelete = (annotationId: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== annotationId))
    setSelectedAnnotation(null)
  }

  const handleFinalizeCorrection = async (payload: {
    finalGrade: number
    feedback: string
  }) => {
    if (!submissionId || !user || !essay) return

    try {
      await saveCorrection(submissionId, user.id, {
        final_grade: payload.finalGrade,
        teacher_feedback_text: payload.feedback,
        annotations: annotations,
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
    } catch (error) {
      toast({ title: 'Erro ao salvar correção', variant: 'destructive' })
    }
  }

  if (isLoading) return <SectionLoader />
  if (!essay) return <div>Redação não encontrada.</div>

  const isImageObserved = fileUrl && ((essay as any).file_url?.toLowerCase().endsWith('.jpg') || (essay as any).file_url?.toLowerCase().endsWith('.png') || (essay as any).file_url?.toLowerCase().endsWith('.jpeg'))

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            navigate(`/admin/essays/${essay.prompt_id}/submissions`)
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Corrigir Redação</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span>
              Aluno(a):{' '}
              {`${essay.users?.first_name || ''} ${essay.users?.last_name || ''}`}
            </span>
            {essay.users?.student_classes?.[0]?.classes?.name && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {essay.users.student_classes[0].classes.name}
              </span>
            )}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {!essay.ai_analysis && (
            <Button
              variant="outline"
              onClick={handleAICorrection}
              disabled={isAILoading}
              className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
            >
              {isAILoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Correção IA
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
        <div className="lg:col-span-2 h-full flex flex-col overflow-hidden">
          {fileUrl ? (
            <div className="flex-1 border rounded-lg overflow-auto bg-muted/20">
              {isImageObserved ? (
                <img src={fileUrl} alt="Redação Digitalizada" className="max-w-full h-auto mx-auto" />
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

