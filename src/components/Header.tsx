import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Bell, Menu, Search, Mountain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { MobileSidebar } from './MobileSidebar'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/hooks/use-auth'
import { SidebarTrigger } from './ui/sidebar'

export const Header = () => {
  const unreadNotifications = 0
  const { profile } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAdmin = profile?.role === 'administrator' || profile?.role === 'teacher'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/40 bg-background/60 backdrop-blur-md px-4 md:px-6 supports-[backdrop-filter]:bg-background/60">
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
          <div className="relative flex-1 max-w-md hidden md:flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              type="search"
              placeholder="O que você quer aprender hoje?"
              className="w-full bg-muted/40 pl-9 border-transparent focus:border-primary/20 focus:bg-background transition-all rounded-xl h-9 shadow-none hover:bg-muted/60"
            />
            <div className="absolute right-2 px-1.5 py-0.5 rounded border bg-background text-[10px] font-medium text-muted-foreground opacity-50">
              ⌘K
            </div>
          </div>
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
                {unreadNotifications > 0 && (
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
