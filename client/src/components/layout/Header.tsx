import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from 'react-router-dom'

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case '/dashboard':
      return 'Dashboard'
    case '/family':
      return 'Family Groups'
    case '/profile':
      return 'Profile'
    case '/readings':
      return 'BP Readings'
    case '/calendar':
      return 'Calendar'
    case '/notifications':
      return 'Notifications'
    case '/settings':
      return 'Settings'
    default:
      return 'Dashboard'
  }
}

export function Header() {
  const { user } = useAuth()
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex flex-1 items-center gap-4">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">
            Welcome back, {user?.firstName || 'User'} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {pageTitle} - Track your health journey
          </p>
        </div>
      </div>
    </header>
  )
} 