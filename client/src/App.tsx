import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Dashboard } from '@/pages/Dashboard'
import { FamilyGroups } from '@/pages/FamilyGroups'
import { Profile } from '@/pages/Profile'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { useAuth } from '@/hooks/useAuth'
import './App.css'

function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-gradient">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public routes - only show when not authenticated */}
        {!isAuthenticated && (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
        
        {/* Protected routes - only show when authenticated */}
        {isAuthenticated && (
          <>
            <Route
              path="/*"
              element={
                <SidebarProvider>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/family" element={<FamilyGroups />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/readings" element={<div>BP Readings - Coming Soon</div>} />
                      <Route path="/calendar" element={<div>Calendar - Coming Soon</div>} />
                      <Route path="/notifications" element={<div>Notifications - Coming Soon</div>} />
                      <Route path="/settings" element={<div>Settings - Coming Soon</div>} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/register" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </SidebarProvider>
              }
            />
          </>
        )}
      </Routes>
    </Router>
  )
}

export default App
