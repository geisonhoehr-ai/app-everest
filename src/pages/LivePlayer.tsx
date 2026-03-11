import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Radio, User } from 'lucide-react'
import { getLiveEvent, type LiveEvent } from '@/services/liveEventService'
import { LivePlayerEmbed } from '@/components/LivePlayerEmbed'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'

export default function LivePlayerPage() {
  const { liveId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [live, setLive] = useState<LiveEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!liveId) return
    loadLive()

    const channel = supabase
      .channel(`live-event-${liveId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_events', filter: `id=eq.${liveId}` },
        (payload) => {
          setLive(prev => prev ? { ...prev, ...payload.new } as LiveEvent : null)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [liveId])

  const loadLive = async () => {
    const data = await getLiveEvent(liveId!)
    if (!data) {
      toast({ title: 'Erro', description: 'Aula ao vivo não encontrada', variant: 'destructive' })
      navigate('/lives')
      return
    }
    setLive(data)
    setLoading(false)
  }

  if (loading) return <SectionLoader />
  if (!live) return null

  const isLive = live.status === 'live'
  const isScheduled = live.status === 'scheduled'

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/lives"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">{live.title}</h1>
            {isLive && (
              <Badge className="bg-red-500 text-white animate-pulse">Ao Vivo</Badge>
            )}
            {isScheduled && (
              <Badge variant="outline" className="text-blue-500 border-blue-500/30">Agendada</Badge>
            )}
            {live.status === 'ended' && (
              <Badge variant="outline">Encerrada</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(live.scheduled_start), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            {live.users && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {live.users.first_name} {live.users.last_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Player or waiting state */}
      {isLive ? (
        <LivePlayerEmbed provider={live.provider} streamUrl={live.stream_url} title={live.title} />
      ) : isScheduled ? (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Radio className="h-12 w-12 text-muted-foreground/30" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">Aula ainda não começou</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Início previsto: {format(new Date(live.scheduled_start), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Radio className="h-12 w-12 text-muted-foreground/30" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">Aula encerrada</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {live.recording_published
                  ? 'A gravação está disponível nos seus cursos.'
                  : 'A gravação será disponibilizada em breve.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {live.description && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Descrição</h3>
            <p className="text-sm text-muted-foreground">{live.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
