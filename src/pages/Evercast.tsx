import { useState, useEffect } from 'react'
import {
  Search,
  Play,
  Clock,
  Mic,
  Headphones,
  Volume2,
  Calendar,
  MoreHorizontal,
  Pause,
  ListMusic,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import { SectionLoader } from '@/components/SectionLoader'
import { audioLessonService, type AudioLesson } from '@/services/audioLessonService'
import { AudioPlayer } from '@/components/AudioPlayer'

export default function EvercastPage() {
  const { isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [audioLessons, setAudioLessons] = useState<AudioLesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<AudioLesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTrack, setCurrentTrack] = useState<AudioLesson | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAudioLessons()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredLessons(
        audioLessons.filter(lesson =>
          lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lesson.series?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredLessons(audioLessons)
    }
  }, [searchTerm, audioLessons])

  const loadAudioLessons = async () => {
    try {
      setIsLoading(true)
      const lessons = await audioLessonService.getAudioLessons()
      setAudioLessons(lessons)
      setFilteredLessons(lessons)
    } catch (error) {
      console.error('Error loading audio lessons:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlay = (lesson: AudioLesson) => {
    setCurrentTrack(lesson)
  }

  // Verificação de permissões para alunos
  if (permissionsLoading || isLoading) {
    return <SectionLoader />
  }

  // Se for aluno e não tiver permissão, mostra página bloqueada
  if (isStudent && !hasFeature(FEATURE_KEYS.EVERCAST)) {
    return (
      <MagicLayout
        title="Evercast"
        description="Sistema de áudio-aulas bloqueado"
      >
        <MagicCard variant="glass" size="lg" className="text-center py-24">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Recurso Bloqueado
            </h3>
            <p className="text-muted-foreground mb-8">
              O Evercast (áudio-aulas) não está disponível para sua turma. Entre em contato com seu professor ou administrador para mais informações.
            </p>
          </div>
        </MagicCard>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title="Evercast"
      description="Suas aulas em áudio para ouvir onde e quando quiser"
      showHeader={false}
      className={cn("pb-32", currentTrack ? "mb-20" : "")} // Add padding for player
    >
      {/* Hero Section (Spotify Header Style) */}
      <div className="flex flex-col md:flex-row gap-8 items-end p-8 bg-gradient-to-b from-primary/20 to-background/0">
        <div className="w-52 h-52 shadow-2xl rounded-md bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shrink-0">
          <Headphones className="w-24 h-24 text-white" />
        </div>
        <div className="flex flex-col gap-4">
          <span className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Playlist Oficial</span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">Evercast</h1>
          <p className="text-muted-foreground max-w-2xl">
            Todas as suas aulas em áudio, podcasts exclusivos e conteúdos complementares para você estudar em qualquer lugar.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-medium">{audioLessons.length} episódios</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              {Math.floor(audioLessons.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / 60)}h {audioLessons.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) % 60}min
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 px-4 md:px-8">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button
              size="lg"
              className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 text-black shadow-lg hover:scale-105 transition-transform"
              onClick={() => filteredLessons.length > 0 && handlePlay(filteredLessons[0])}
            >
              {currentTrack && filteredLessons[0]?.id === currentTrack.id ? <Pause className="h-6 w-6 ml-0.5 fill-black" /> : <Play className="h-6 w-6 ml-1 fill-black" />}
            </Button>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar episódios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-none rounded-full"
            />
          </div>
        </div>

        {/* Tracks List */}
        <div className="rounded-md border-none">
          <Table>
            <TableHeader className="bg-transparent border-b border-white/10 hover:bg-transparent">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Série/Álbum</TableHead>
                <TableHead className="hidden md:table-cell">Adicionado em</TableHead>
                <TableHead className="text-right"><Clock className="h-4 w-4 ml-auto" /></TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhum episódio encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLessons.map((lesson, index) => (
                  <TableRow
                    key={lesson.id}
                    className={cn(
                      "group hover:bg-white/5 border-transparent transition-colors cursor-pointer",
                      currentTrack?.id === lesson.id ? "bg-white/5 text-green-500" : ""
                    )}
                    onClick={() => handlePlay(lesson)}
                  >
                    <TableCell className="font-medium text-center relative w-12 text-muted-foreground group-hover:text-white">
                      <span className={cn("absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group-hover:hidden", currentTrack?.id === lesson.id ? "hidden" : "block")}>
                        {index + 1}
                      </span>
                      <Play className={cn("h-4 w-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden group-hover:block fill-white text-white", currentTrack?.id === lesson.id ? "hidden" : "")} />

                      {currentTrack?.id === lesson.id && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-end justify-between gap-[2px]">
                          <div className="w-1 bg-green-500 animate-[music-bar_0.6s_ease-in-out_infinite] h-full" />
                          <div className="w-1 bg-green-500 animate-[music-bar_0.8s_ease-in-out_infinite_0.1s] h-2/3" />
                          <div className="w-1 bg-green-500 animate-[music-bar_1.0s_ease-in-out_infinite_0.2s] h-1/2" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={lesson.thumbnail_url || "/logo.png"}
                          alt={lesson.title}
                          className="h-10 w-10 rounded object-cover"
                        />
                        <div className="flex flex-col">
                          <span className={cn("font-medium", currentTrack?.id === lesson.id ? "text-green-500" : "text-white")}>
                            {lesson.title}
                          </span>
                          <span className="text-xs text-muted-foreground md:hidden">{lesson.series || "Single"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{lesson.series || "Single"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {new Date(lesson.created_at || Date.now()).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {lesson.duration_minutes ? `${lesson.duration_minutes} min` : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Add to favs logic */ }}>
                            Adicionar aos Favoritos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Share logic */ }}>
                            Compartilhar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Persistent Audio Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        playlist={filteredLessons}
        onTrackChange={setCurrentTrack}
      />
    </MagicLayout >
  )
}

