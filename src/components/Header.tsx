import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Menu, Search, Mountain } from 'lucide-react'
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AppSidebar } from './AppSidebar'
import { ThemeToggle } from './ThemeToggle'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { SidebarTrigger } from './ui/sidebar'
import { useStaggeredAnimation } from '@/hooks/useAnimations'
import { cn } from '@/lib/utils'

export const Header = () => {
  const unreadNotifications = 3
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

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

  const menuDelays = useStaggeredAnimation(4, 100)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/20 bg-card/80 backdrop-blur-xl px-4 sm:px-6 animate-fade-in-down shadow-lg shadow-black/5">
      {profile && (
        <>
          <div className="hidden md:block animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <SidebarTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="group transition-all duration-300 hover:bg-primary/5"
              >
                <Menu className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </SidebarTrigger>
          </div>
          <div className="md:hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="group transition-all duration-300 hover:bg-primary/5"
                >
                  <Menu className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <AppSidebar />
              </SheetContent>
            </Sheet>
          </div>
        </>
      )}

      <div className="relative flex-1 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        {profile ? (
          <>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-300" />
            <Input
              type="search"
              placeholder="Pesquisar cursos, aulas, materiais..."
              className={cn(
                "w-full rounded-xl bg-muted/50 border-border/50 pl-10 md:w-[250px] lg:w-[400px]",
                "transition-all duration-300 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                "placeholder:text-muted-foreground/70"
              )}
            />
          </>
        ) : (
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-lg mr-auto group"
          >
            <Mountain className="h-6 w-6 text-primary animate-float" />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Everest
            </span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <ThemeToggle />
        </div>
        {profile ? (
          <>
            <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-xl relative group",
                  "transition-all duration-300 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/10"
                )}
                asChild
              >
                <NavLink to="/notifications">
                  <div className="p-1 rounded-lg transition-all duration-300 group-hover:bg-primary/10">
                    <Bell className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                  </div>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-primary text-xs text-primary-foreground font-bold">
                        {unreadNotifications}
                      </span>
                    </span>
                  )}
                  <span className="sr-only">Toggle notifications</span>
                </NavLink>
              </Button>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "rounded-xl group",
                      "transition-all duration-300 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/10"
                    )}
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-primary group-hover:scale-105">
                      <AvatarImage
                        src={`https://img.usecurling.com/ppl/medium?seed=${profile?.id}`}
                        alt="Avatar"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end"
                  className="animate-fade-in-up w-56"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.first_name} {profile?.last_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/configuracoes" className="cursor-pointer transition-colors duration-300 hover:text-primary">
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/configuracoes" className="cursor-pointer transition-colors duration-300 hover:text-primary">
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/faq" className="cursor-pointer transition-colors duration-300 hover:text-primary">
                      Suporte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive transition-colors duration-300 hover:text-destructive focus:text-destructive"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Button 
              variant="outline" 
              asChild
              className="group transition-all duration-300 hover:bg-primary/5"
            >
              <Link to="/login" className="transition-colors duration-300 group-hover:text-primary">
                Entrar
              </Link>
            </Button>
            <Button 
              asChild
              className="group transition-all duration-300 hover:bg-primary/90"
            >
              <a href="/#planos">
                Cadastre-se
              </a>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
