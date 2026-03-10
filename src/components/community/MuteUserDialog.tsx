import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { communityService } from '@/services/communityService'
import { logger } from '@/lib/logger'

interface MuteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
}

const DURATION_OPTIONS = [
  { value: '60', label: '1 hora', minutes: 60 },
  { value: '360', label: '6 horas', minutes: 360 },
  { value: '1440', label: '24 horas', minutes: 1440 },
  { value: '10080', label: '7 dias', minutes: 10080 },
  { value: '43200', label: '30 dias', minutes: 43200 },
] as const

export function MuteUserDialog({ open, onOpenChange, userId, userName }: MuteUserDialogProps) {
  const { getUserId } = useAuth()
  const { toast } = useToast()
  const [duration, setDuration] = useState('1440')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const mutedBy = getUserId()
    if (!mutedBy) return

    const durationMinutes = parseInt(duration, 10)

    setSubmitting(true)
    try {
      await communityService.muteUser(userId, mutedBy, reason.trim() || 'Silenciado por moderador', durationMinutes)

      const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label || duration
      toast({
        title: 'Usuario silenciado',
        description: `${userName} foi silenciado por ${durationLabel}.`,
      })
      onOpenChange(false)
      setDuration('1440')
      setReason('')
    } catch (error) {
      logger.error('Failed to mute user', error)
      toast({ title: 'Erro ao silenciar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[425px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Silenciar Usuario</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Silenciar {userName} por um periodo determinado
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Duracao</Label>
            <RadioGroup value={duration} onValueChange={setDuration}>
              {DURATION_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`duration-${option.value}`} />
                  <Label
                    htmlFor={`duration-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Motivo</Label>
            <Textarea
              placeholder="Descreva o motivo do silenciamento..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Silenciando...
              </>
            ) : (
              'Silenciar'
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
