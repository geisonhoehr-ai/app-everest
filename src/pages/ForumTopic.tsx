import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, CornerUpRight } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const topicData = {
  id: 1,
  title: 'Dúvida sobre a Segunda Lei de Newton',
  author: 'Ana Clara',
  avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=5',
  timestamp: '2 dias atrás',
  category: 'Física',
  content:
    'Olá pessoal! Estou com uma dúvida sobre a aplicação da Segunda Lei de Newton (F=ma) em problemas que envolvem planos inclinados. Alguém poderia me dar uma luz ou indicar um bom material de estudo sobre isso? Agradeço desde já!',
  replies: [
    {
      author: 'Prof. Carlos',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=8',
      timestamp: '2 dias atrás',
      content:
        'Olá, Ana! Ótima pergunta. O segredo em planos inclinados é decompor a força peso (P) em duas componentes: Px (paralela ao plano) and Py (perpendicular ao plano). Px será P * sen(θ) e Py será P * cos(θ), onde θ é o ângulo de inclinação. A força resultante no eixo do movimento será F_res = Px - F_atrito. Espero que ajude!',
      isTeacher: true,
    },
    {
      author: 'Lucas Mendes',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=6',
      timestamp: '1 dia atrás',
      content:
        'Valeu, professor! Essa dica da decomposição da força peso foi o que faltava pra eu entender. Consegui resolver as questões aqui. Obrigado, Ana, por criar o tópico!',
    },
  ],
}

export default function ForumTopicPage() {
  const { topicId } = useParams()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/forum">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Voltar para o Fórum</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{topicData.title}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage src={topicData.avatar} />
              <AvatarFallback>{topicData.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>
              Postado por <strong>{topicData.author}</strong> em{' '}
              {topicData.timestamp}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90">{topicData.content}</p>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mt-4">
        {topicData.replies.length} Respostas
      </h2>

      <div className="space-y-4">
        {topicData.replies.map((reply, index) => (
          <Card key={index} className="bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={reply.avatar} />
                  <AvatarFallback>{reply.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {reply.author}{' '}
                    {reply.isTeacher && (
                      <span className="text-xs font-bold text-primary-foreground bg-primary px-2 py-0.5 rounded-full ml-2">
                        PROFESSOR
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reply.timestamp}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p>{reply.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-4" />

      <Card>
        <CardHeader>
          <CardTitle>Sua Resposta</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Digite sua resposta aqui..." rows={5} />
        </CardContent>
        <CardFooter>
          <Button>
            <CornerUpRight className="mr-2 h-4 w-4" />
            Publicar Resposta
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
