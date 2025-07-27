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
    <header className="flex h-16 items-center gap-4 border-b bg-background/50 backdrop-blur-sm px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground">
          Welcome back, {user?.firstName || 'User'} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          {pageTitle} - Track your health journey
        </p>
      </div>
    </header>
  )
} 