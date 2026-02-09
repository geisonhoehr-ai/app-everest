import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function PWAUpdatePrompt() {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const { toast } = useToast()

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker registrado')
    },
    onRegisterError(error) {
      console.log('❌ Erro ao registrar SW:', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      setShowUpdateDialog(true)
    }
  }, [needRefresh])

  useEffect(() => {
    if (offlineReady) {
      toast({
        title: '📱 App pronto para uso offline',
        description: 'Você pode usar o Everest mesmo sem conexão!',
      })
    }
  }, [offlineReady, toast])

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      toast({
        title: '🌐 Conexão restaurada',
        description: 'Você está online novamente!',
      })
    }

    const handleOffline = () => {
      setIsOffline(true)
      toast({
        title: '📵 Você está offline',
        description: 'Algumas funcionalidades podem estar limitadas',
        variant: 'destructive',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast])

  const handleUpdate = () => {
    updateServiceWorker(true)
    setShowUpdateDialog(false)
  }

  return (
    <>
      {/* Update Dialog */}
      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Nova versão disponível!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Uma atualização está disponível. Deseja atualizar agora para obter as últimas funcionalidades e correções?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUpdateDialog(false)}>
              Depois
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdate}>
              Atualizar Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
          <div className="bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">Modo Offline</span>
          </div>
        </div>
      )}
    </>
  )
}

