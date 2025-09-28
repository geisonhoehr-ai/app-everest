import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, PlayCircle, Clock, Mic } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const audioClasses = [
  {
    title: 'Revolução Francesa em 30 minutos',
    series: 'História em Foco',
    duration: '32 min',
    image: 'https://img.usecurling.com/p/400/400?q=french%20revolution',
  },
  {
    title: 'Os Biomas Brasileiros',
    series: 'Geografia Descomplicada',
    duration: '45 min',
    image: 'https://img.usecurling.com/p/400/400?q=brazilian%20biomes',
  },
  {
    title: 'Entendendo a Crase',
    series: 'Português para Concursos',
    duration: '18 min',
    image: 'https://img.usecurling.com/p/400/400?q=portuguese%20grammar',
  },
  {
    title: 'A Tabela Periódica e suas Propriedades',
    series: 'Química Essencial',
    duration: '55 min',
    image: 'https://img.usecurling.com/p/400/400?q=periodic%20table',
  },
]

export default function EvercastPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mic className="text-primary" /> Evercast
              </CardTitle>
              <CardDescription>
                Suas aulas em áudio para ouvir onde e quando quiser.
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar áudio-aulas..."
                className="pl-8 w-full md:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {audioClasses.map((audio) => (
            <Card
              key={audio.title}
              className="rounded-2xl border transition-all duration-200 hover:shadow-xl hover:-translate-y-2 hover:scale-102 cursor-pointer group relative flex flex-col overflow-hidden"
            >
              <img
                src={audio.image}
                alt={audio.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <PlayCircle className="h-16 w-16 text-white/70 group-hover:text-white group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <Badge variant="secondary" className="mb-2 w-fit">
                  {audio.series}
                </Badge>
                <h3 className="font-semibold text-md flex-grow">
                  {audio.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                  <Clock className="h-4 w-4" />
                  <span>{audio.duration}</span>
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
