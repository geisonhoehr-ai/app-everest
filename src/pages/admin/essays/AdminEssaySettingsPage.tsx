import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { CriteriaTemplateManagement } from '@/components/admin/essays/CriteriaTemplateManagement'
import { ErrorCategoryManagement } from '@/components/admin/essays/ErrorCategoryManagement'

export default function AdminEssaySettingsPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/admin/essays')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configurações de Correção</h1>
          <p className="text-muted-foreground">
            Gerencie os critérios de avaliação e categorias de erro para as
            redações.
          </p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <CriteriaTemplateManagement />
        <ErrorCategoryManagement />
      </div>
    </div>
  )
}
