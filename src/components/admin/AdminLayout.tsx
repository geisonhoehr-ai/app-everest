import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../Header'
import { SidebarProvider } from '../ui/sidebar'
import { UnifiedSidebar } from '../UnifiedSidebar'

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true)

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full bg-background">
        <UnifiedSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-grow p-4 sm:px-6 sm:py-0 md:gap-8 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
