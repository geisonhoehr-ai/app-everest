import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import {
  getEssaysForComparison,
  getErrorCategories,
  type EssayForCorrection,
  type ErrorCategory,
} from '@/services/essayService'
import { SectionLoader } from '@/components/SectionLoader'
import { InteractiveEssayEditor } from '@/components/admin/essays/InteractiveEssayEditor'
import { CorrectionPanel } from '@/components/admin/essays/CorrectionPanel'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { cn } from '@/lib/utils'

export default function AdminEssayComparisonPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [essays, setEssays] = useState<EssayForCorrection[]>([])
  const [errorCategories, setErrorCategories] = useState<ErrorCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const editor1Ref = useRef<HTMLDivElement>(null)
  const editor2Ref = useRef<HTMLDivElement>(null)

  const [isSyncEnabled, setIsSyncEnabled] = useState(true)
  const isSyncingScroll = useRef(false)

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',')
    if (ids && ids.length === 2) {
      Promise.all([getEssaysForComparison(ids), getErrorCategories()])
        .then(([essayData, categoryData]) => {
          setEssays(essayData)
          setErrorCategories(categoryData)
        })
        .finally(() => setIsLoading(false))
    } else {
      navigate('/admin/essays')
    }
  }, [searchParams, navigate])

  const handleScroll = (scrollingEditor: 'editor1' | 'editor2') => {
    if (!isSyncEnabled || isSyncingScroll.current) return

    isSyncingScroll.current = true

    const source =
      scrollingEditor === 'editor1' ? editor1Ref.current : editor2Ref.current
    const target =
      scrollingEditor === 'editor1' ? editor2Ref.current : editor1Ref.current

    if (source && target) {
      target.scrollTop = source.scrollTop
    }

    setTimeout(() => {
      isSyncingScroll.current = false
    }, 100)
  }

  if (isLoading) return <SectionLoader />
  if (essays.length < 2)
    return <div>Erro ao carregar redações para comparação.</div>

  const [essay1, essay2] = essays

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Comparar Redações</h1>
            <p className="text-sm text-muted-foreground">
              {essay1.essay_prompts?.title}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsSyncEnabled(!isSyncEnabled)}
        >
          <RefreshCw
            className={cn('mr-2 h-4 w-4', isSyncEnabled && 'animate-spin')}
          />
          {isSyncEnabled
            ? 'Desativar Rolagem Sincronizada'
            : 'Ativar Rolagem Sincronizada'}
        </Button>
      </div>
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel>
          <div className="grid grid-cols-2 h-full gap-2">
            <div
              ref={editor1Ref}
              onScroll={() => handleScroll('editor1')}
              className="overflow-y-auto h-full"
            >
              <InteractiveEssayEditor
                text={essay1.submission_text}
                annotations={[]}
                onTextSelect={() => {}}
                onAnnotationClick={() => {}}
              />
            </div>
            <div className="h-full">
              <CorrectionPanel
                essay={essay1}
                errorCategories={errorCategories}
                selectedAnnotation={null}
                onAnnotationUpdate={() => {}}
                onAnnotationDelete={() => {}}
                onFinalizeCorrection={() => {}}
              />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <div className="grid grid-cols-2 h-full gap-2">
            <div
              ref={editor2Ref}
              onScroll={() => handleScroll('editor2')}
              className="overflow-y-auto h-full"
            >
              <InteractiveEssayEditor
                text={essay2.submission_text}
                annotations={[]}
                onTextSelect={() => {}}
                onAnnotationClick={() => {}}
              />
            </div>
            <div className="h-full">
              <CorrectionPanel
                essay={essay2}
                errorCategories={errorCategories}
                selectedAnnotation={null}
                onAnnotationUpdate={() => {}}
                onAnnotationDelete={() => {}}
                onFinalizeCorrection={() => {}}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
