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

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetType: 'post' | 'comment' | 'user'
  targetId: string
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Conteudo Inapropriado' },
  { value: 'harassment', label: 'Assedio' },
  { value: 'other', label: 'Outro' },
] as const

type ReportReason = typeof REPORT_REASONS[number]['value']

export function ReportDialog({ open, onOpenChange, targetType, targetId }: ReportDialogProps) {
  const { getUserId } = useAuth()
  const { toast } = useToast()
  const [reason, setReason] = useState<ReportReason>('spam')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const userId = getUserId()
    if (!userId) return

    setSubmitting(true)
    try {
      await communityService.createReport({
        reporter_id: userId,
        target_type: targetType,
        target_id: targetId,
        reason,
        description: reason === 'other' ? description : undefined,
      })

      toast({ title: 'Denuncia enviada', description: 'Obrigado por reportar. Nossa equipe vai analisar.' })
      onOpenChange(false)
      setReason('spam')
      setDescription('')
    } catch (error) {
      logger.error('Failed to create report', error)
      toast({ title: 'Erro ao denunciar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[425px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Denunciar</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Selecione o motivo da denuncia
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center space-x-2">
                <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                <Label htmlFor={`reason-${r.value}`} className="text-sm font-normal cursor-pointer">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {reason === 'other' && (
            <Textarea
              placeholder="Descreva o motivo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} variant="destructive">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              'Denunciar'
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
