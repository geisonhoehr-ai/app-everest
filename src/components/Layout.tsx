import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { SidebarProvider } from './ui/sidebar'
import { AppSidebar } from './AppSidebar'

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true)

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-grow p-4 sm:px-6 sm:py-0 md:gap-8 md:p-8">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  )
}
