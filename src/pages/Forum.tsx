import { Link } from 'react-router-dom'
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
import { MessageSquare, PlusCircle, Search } from 'lucide-react'

const topics = [
  {
    id: 1,
    title: 'Dúvida sobre a Segunda Lei de Newton',
    author: 'Ana Clara',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=5',
    replies: 5,
    lastReply: '2 horas atrás',
    category: 'Física',
  },
  {
    id: 2,
    title: 'Qual a melhor estrutura para a redação do ENEM?',
    author: 'Lucas Mendes',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=6',
    replies: 12,
    lastReply: '5 horas atrás',
    category: 'Redação',
  },
  {
    id: 3,
    title: 'Revolução Francesa: principais causas e consequências',
    author: 'Beatriz Lima',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=7',
    replies: 8,
    lastReply: '1 dia atrás',
    category: 'História',
  },
]

export default function ForumPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Fórum de Dúvidas</CardTitle>
            <CardDescription>
              Interaja, tire suas dúvidas e ajude outros estudantes.
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar no fórum..." className="pl-8" />
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Tópico
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {topics.map((topic) => (
            <li
              key={topic.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Link
                to={`/forum/${topic.id}`}
                className="flex items-start gap-4"
              >
                <Avatar>
                  <AvatarImage src={topic.avatar} />
                  <AvatarFallback>{topic.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-semibold text-primary">{topic.title}</p>
                  <p className="text-sm text-muted-foreground">
                    por {topic.author} em{' '}
                    <span className="font-medium text-foreground">
                      {topic.category}
                    </span>
                  </p>
                </div>
                <div className="hidden md:flex flex-col items-end text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{topic.replies} respostas</span>
                  </div>
                  <p className="text-muted-foreground">
                    Última resposta {topic.lastReply}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
