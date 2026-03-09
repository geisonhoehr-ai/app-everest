import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Bell, Menu, Search, Mountain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { MobileSidebar } from './MobileSidebar'
import { ThemeToggle } from './ThemeToggle'
import { CommandPalette } from './CommandPalette'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/hooks/useNotifications'
import { SidebarTrigger } from './ui/sidebar'

export const Header = () => {
  const { unreadCount } = useNotifications()
  const { profile } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAdmin = profile?.role === 'administrator' || profile?.role === 'teacher'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/40 bg-card px-4 md:px-6">
      {profile && (
        <>
          <div className="hidden md:flex items-center">
            <SidebarTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </SidebarTrigger>
          </div>
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                <MobileSidebar />
              </SheetContent>
            </Sheet>
          </div>
        </>
      )}

      <div className="flex flex-1 items-center gap-4 md:gap-8">
        {profile ? (
          <>
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              className="relative flex-1 max-w-md hidden md:flex items-center cursor-pointer bg-muted/40 hover:bg-muted/60 rounded-xl h-9 px-3 transition-all border border-transparent hover:border-border/30"
            >
              <Search className="h-4 w-4 text-muted-foreground/50 shrink-0 mr-2" />
              <span className="text-sm text-muted-foreground/50">Buscar...</span>
              <kbd className="ml-auto text-[10px] text-muted-foreground/50 border rounded px-1.5 py-0.5 bg-background/50">
                Ctrl K
              </kbd>
            </button>
            <CommandPalette />
          </>
        ) : (
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
          >
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Mountain className="h-5 w-5 text-primary" />
            </div>
            <span className="text-foreground">Everest</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {profile ? (
          <>
            {!isAdmin && <ThemeToggle />}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground h-9 w-9"
              asChild
            >
              <NavLink to="/notificacoes">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                )}
                <span className="sr-only">Notificações</span>
              </NavLink>
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild size="sm">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Começar agora</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
