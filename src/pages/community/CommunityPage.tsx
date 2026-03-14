import { useState, useEffect } from 'react'
import { Plus, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SpacesSidebar } from '@/components/community/SpacesSidebar'
import { PostFeed } from '@/components/community/PostFeed'
import { PostEditor } from '@/components/community/PostEditor'
import { communityService, type CommunitySpace } from '@/services/communityService'
import { useAuth } from '@/hooks/use-auth'
import { useContentAccess } from '@/hooks/useContentAccess'
import { logger } from '@/lib/logger'

export default function CommunityPage() {
  const { isStudent } = useAuth()
  const { isRestricted: isReadOnly } = useContentAccess('community_readonly')
  const [spaces, setSpaces] = useState<CommunitySpace[]>([])
  const [editorOpen, setEditorOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [feedKey, setFeedKey] = useState(0)

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const data = await communityService.getSpaces()
        setSpaces(data)
      } catch (error) {
        logger.error('Failed to load spaces for editor', error)
      }
    }
    fetchSpaces()
  }, [])

  const handlePostSuccess = () => {
    setEditorOpen(false)
    setFeedKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comunidade</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interaja, compartilhe e tire suas duvidas
          </p>
        </div>

        {/* Mobile sidebar trigger */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-4">
            <div className="mt-4" onClick={() => setSidebarOpen(false)}>
              <SpacesSidebar />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <SpacesSidebar />
        </div>

        {/* Feed */}
        <div className="flex-1 min-w-0">
          <PostFeed key={feedKey} />
        </div>
      </div>

      {/* Floating create button */}
      {!(isStudent && isReadOnly) && (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
          onClick={() => setEditorOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Post editor dialog */}
      {!(isStudent && isReadOnly) && (
        <PostEditor
          spaces={spaces}
          onSuccess={handlePostSuccess}
          open={editorOpen}
          onOpenChange={setEditorOpen}
        />
      )}
    </div>
  )
}
