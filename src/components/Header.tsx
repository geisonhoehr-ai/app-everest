import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Menu, Search, Mountain, LogOut, User, Settings as SettingsIcon, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { MobileSidebar } from './MobileSidebar'
import { ThemeToggle } from './ThemeToggle'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { SidebarTrigger } from './ui/sidebar'
import { cn } from '@/lib/utils'

export const Header = () => {
  const unreadNotifications = 0 // Simulating no notifications based on DB state would be better
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getInitials = () => {
    if (!profile) return 'U'
    const first = profile.first_name?.charAt(0) || ''
    const last = profile.last_name?.charAt(0) || ''
    return `${first}${last}`.toUpperCase()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-background/60 backdrop-blur-md px-6 shadow-sm transition-all duration-300 supports-[backdrop-filter]:bg-background/60">
      {profile && (
        <>
          <div className="hidden md:flex items-center">
            <SidebarTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </SidebarTrigger>
          </div>
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
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
              className="w-full bg-muted/40 pl-9 border-transparent focus:border-primary/20 focus:bg-background transition-all rounded-xl h-10 shadow-none hover:bg-muted/60"
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

      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />

        {profile ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground rounded-full h-9 w-9"
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-border transition-all p-0 overflow-hidden"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.first_name}+${profile.last_name}&background=random`}
                      alt={profile.first_name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile.first_name} {profile.last_name}</p>
                    <p className="text-xs leading-none text-muted-foreground font-light">{profile.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/configuracoes" className="cursor-pointer gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/configuracoes" className="cursor-pointer gap-2">
                    <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/faq" className="cursor-pointer gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Ajuda e Suporte</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair da Conta</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild size="sm">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
              <Link to="/register">Começar agora</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
