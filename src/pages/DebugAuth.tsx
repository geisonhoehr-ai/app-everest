import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export default function DebugAuth() {
  const { user, session, profile } = useAuth()
  const [localStorageData, setLocalStorageData] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    // Check localStorage
    const token = localStorage.getItem('everest-auth-token')
    setLocalStorageData(token)

    // Check session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSessionData(data)
    }
    checkSession()
  }, [])

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession()
    console.log('Refresh result:', { data, error })
    setSessionData(data)
  }

  const clearStorage = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Debug de Autenticação</h1>

      <Card>
        <CardHeader>
          <CardTitle>Status do Auth Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>User:</strong>
            <pre className="bg-muted p-4 rounded mt-2 overflow-auto text-xs">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          <div>
            <strong>Session:</strong>
            <pre className="bg-muted p-4 rounded mt-2 overflow-auto text-xs">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
          <div>
            <strong>Profile:</strong>
            <pre className="bg-muted p-4 rounded mt-2 overflow-auto text-xs">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>localStorage</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <strong>everest-auth-token:</strong>
            <pre className="bg-muted p-4 rounded mt-2 overflow-auto text-xs break-all">
              {localStorageData || 'Não encontrado'}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Direct Check</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded overflow-auto text-xs">
            {JSON.stringify(sessionData, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={refreshSession}>Refresh Session</Button>
        <Button onClick={clearStorage} variant="destructive">
          Clear Storage & Reload
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reload Page (F5)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Console Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Abra o console do navegador (F12) e veja os logs de autenticação.
            Pressione F5 e observe se a sessão é mantida.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
