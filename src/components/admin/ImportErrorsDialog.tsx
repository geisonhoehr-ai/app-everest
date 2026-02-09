import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ImportError } from '@/lib/importExport'

interface ImportErrorsDialogProps {
  errors: ImportError[]
  isOpen: boolean
  onClose: () => void
}

export const ImportErrorsDialog = ({
  errors,
  isOpen,
  onClose,
}: ImportErrorsDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Erro na Importação</AlertDialogTitle>
          <AlertDialogDescription>
            O arquivo contém os seguintes erros de formatação. Por favor,
            corrija-os e tente novamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="max-h-60 w-full rounded-md border p-4">
          <ul className="space-y-2">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">
                <span className="font-semibold">Linha {error.line}:</span>{' '}
                {error.message}
              </li>
            ))}
          </ul>
        </ScrollArea>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Entendi</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
