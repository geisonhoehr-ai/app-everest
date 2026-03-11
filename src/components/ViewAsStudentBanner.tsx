import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useViewMode } from '@/contexts/view-mode-context'

export function ViewAsStudentBanner() {
  const { viewingAsStudent, exitStudentView } = useViewMode()

  if (!viewingAsStudent) return null

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-primary px-4 py-2 text-primary-foreground text-sm">
      <Eye className="h-4 w-4" />
      <span className="font-medium">Visualizando como aluno</span>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 px-3 text-xs"
        onClick={exitStudentView}
      >
        <X className="h-3 w-3 mr-1" />
        Voltar ao painel
      </Button>
    </div>
  )
}
