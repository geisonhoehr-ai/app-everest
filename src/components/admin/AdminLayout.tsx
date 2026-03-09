import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../Header'
import { SidebarProvider } from '../ui/sidebar'
import { UnifiedSidebar } from '../UnifiedSidebar'
import { useTheme } from '@/contexts/theme-provider'

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const { theme, setTheme } = useTheme()
  const [previousTheme, setPreviousTheme] = useState<string | null>(null)

  // Force light mode in admin, restore on unmount
  useEffect(() => {
    if (theme !== 'light') {
      setPreviousTheme(theme)
      setTheme('light')
    }
    return () => {
      if (previousTheme && previousTheme !== 'light') {
        setTheme(previousTheme as 'dark' | 'light' | 'system')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full bg-[#f8f9fb]">
        <UnifiedSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-grow p-4 sm:px-6 md:p-8 bg-[#f8f9fb]">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
