import { ReactNode } from 'react'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Header } from '@/components/layout/Header'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen dashboard-gradient">
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-6 pt-0">
          <div className="mx-auto max-w-8xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </div>
  )
} 