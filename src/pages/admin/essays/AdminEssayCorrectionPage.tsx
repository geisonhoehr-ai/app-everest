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
import { useAuth } from '@/contexts/auth-provider'
import { SectionLoader } from '@/components/SectionLoader'
import { InteractiveEssayEditor } from '@/components/admin/essays/InteractiveEssayEditor'
import { CorrectionPanel } from '@/components/admin/essays/CorrectionPanel'
import { useToast } from '@/components/ui/use-toast'
import { createNotification } from '@/services/notificationService'

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
          <p className="text-sm text-muted-foreground">
            Aluno(a):{' '}
            {`${essay.users?.first_name || ''} ${essay.users?.last_name || ''}`}
          </p>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6 flex-grow">
        <div className="lg:col-span-2 h-full">
          <InteractiveEssayEditor
            text={essay.submission_text}
            annotations={annotations}
            onTextSelect={handleTextSelect}
            onAnnotationClick={handleAnnotationClick}
          />
        </div>
        <div className="lg:col-span-1 h-full">
          <CorrectionPanel
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
