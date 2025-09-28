import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Copy, Users, Play } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const mockParticipants = [
  {
    name: 'João Pedro',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=10',
  },
  {
    name: 'Ana Clara',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=5',
  },
]

export default function GroupStudyLobbyPage() {
  const { setId } = useParams()
  const { toast } = useToast()
  const invitationLink = `${window.location.origin}/estudo-em-grupo/session123`

  const copyLink = () => {
    navigator.clipboard.writeText(invitationLink)
    toast({ title: 'Link copiado para a área de transferência!' })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Lobby de Estudo em Grupo</CardTitle>
          <CardDescription>
            Convide seus amigos e comece a estudar em equipe!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-semibold">Convide com este link:</p>
          <div className="flex gap-2">
            <Input value={invitationLink} readOnly />
            <Button size="icon" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Participantes (
            {mockParticipants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {mockParticipants.map((p) => (
              <li key={p.name} className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={p.avatar} />
                  <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{p.name}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" asChild>
          <Link to="/estudo-em-grupo/session123">
            <Play className="mr-2 h-5 w-5" /> Iniciar Sessão para Todos
          </Link>
        </Button>
      </div>
    </div>
  )
}
