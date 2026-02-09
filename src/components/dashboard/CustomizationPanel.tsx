import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { WIDGETS, AVAILABLE_WIDGETS } from '@/lib/dashboard-config'
import type { UserProfile } from '@/services/userService'

interface CustomizationPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  visibleWidgets: string[]
  onVisibilityChange: (widgetId: string, isVisible: boolean) => void
  onSave: () => void
  onReset: () => void
  userRole: UserProfile['role']
}

export const CustomizationPanel = ({
  isOpen,
  onOpenChange,
  visibleWidgets,
  onVisibilityChange,
  onSave,
  onReset,
  userRole,
}: CustomizationPanelProps) => {
  const availableWidgetIds = AVAILABLE_WIDGETS[userRole] || []

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Personalizar Dashboard</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione os blocos de informação que você deseja exibir.
          </p>
          {availableWidgetIds.map((widgetId) => {
            const widget = WIDGETS[widgetId]
            if (!widget) return null
            return (
              <div
                key={widgetId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <Label htmlFor={widgetId}>{widget.name}</Label>
                  <p className="text-xs text-muted-foreground">
                    {widget.description}
                  </p>
                </div>
                <Switch
                  id={widgetId}
                  checked={visibleWidgets.includes(widgetId)}
                  onCheckedChange={(checked) =>
                    onVisibilityChange(widgetId, checked)
                  }
                />
              </div>
            )
          })}
        </div>
        <div className="flex flex-col gap-2 mt-6">
          <Button onClick={onSave}>Salvar Alterações</Button>
          <Button variant="outline" onClick={onReset}>
            Restaurar Padrão
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
