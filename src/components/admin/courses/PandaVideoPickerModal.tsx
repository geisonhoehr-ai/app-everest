import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPandaVideos, getPandaFolders, type PandaVideo, type PandaFolder } from '@/services/pandaVideo'
import { Search, CheckCircle, FolderOpen } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface PandaVideoPickerModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onVideoSelect: (video: PandaVideo) => void
}

export const PandaVideoPickerModal = ({
  isOpen,
  onOpenChange,
  onVideoSelect,
}: PandaVideoPickerModalProps) => {
  const [videos, setVideos] = useState<PandaVideo[]>([])
  const [folders, setFolders] = useState<PandaFolder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Load folders once when modal opens
  useEffect(() => {
    if (isOpen && folders.length === 0) {
      getPandaFolders()
        .then(setFolders)
        .catch(() => setFolders([]))
    }
  }, [isOpen, folders.length])

  // Load videos when search or folder changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      const params: Parameters<typeof getPandaVideos>[0] = {}
      if (debouncedSearchTerm) params.search = debouncedSearchTerm
      if (selectedFolder && selectedFolder !== 'all') params.folder_id = selectedFolder

      getPandaVideos(Object.keys(params).length > 0 ? params : undefined)
        .then((data) => {
          setVideos(data.videos || [])
          setIsLoading(false)
        })
        .catch(() => {
          setVideos([])
          setIsLoading(false)
        })
    }
  }, [isOpen, debouncedSearchTerm, selectedFolder])

  const handleSelect = (video: PandaVideo) => {
    onVideoSelect(video)
    onOpenChange(false)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Selecionar Vídeo do Panda</DialogTitle>
          <DialogDescription>
            Navegue e selecione um vídeo da sua biblioteca.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-[220px]">
              <FolderOpen className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Todas as pastas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as pastas</SelectItem>
              {folders
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[50vh] border rounded-md">
          <div className="p-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : videos.length === 0
                ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FolderOpen className="h-10 w-10 mb-2 opacity-50" />
                      <p className="text-sm">Nenhum vídeo encontrado</p>
                      {(searchTerm || selectedFolder !== 'all') && (
                        <p className="text-xs mt-1">Tente alterar os filtros</p>
                      )}
                    </div>
                  )
                : videos.map((video) => (
                    <div
                      key={video.id}
                      className="group relative cursor-pointer rounded-lg overflow-hidden border"
                      onClick={() => handleSelect(video)}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-white/0 group-hover:text-white/80 transition-colors" />
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium truncate">
                          {video.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(video.duration)}
                        </p>
                      </div>
                    </div>
                  ))}
          </div>
        </ScrollArea>

        {!isLoading && videos.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {videos.length} vídeo{videos.length !== 1 ? 's' : ''} encontrado{videos.length !== 1 ? 's' : ''}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
