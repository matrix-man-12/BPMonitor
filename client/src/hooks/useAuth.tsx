import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import axios from 'axios'

interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth?: string
  familyGroups: string[]
  createdAt?: string
  avatar?: string
  notificationPreferences: {
    enabled: boolean
    frequency: string
    times: string[]
    email: boolean
    push: boolean
    reminders: boolean
  }
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  dateOfBirth: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000'

// Request interceptor to add auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('🚨 Axios interceptor - error caught:', {
      status: error.response?.status,
      url: error.config?.url,
      currentPath: window.location.pathname
    })
    
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password' || currentPath === '/reset-password'
      const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register') || error.config?.url?.includes('/auth/forgot-password')
      
      console.log('🔍 Interceptor decision:', {
        isAuthPage,
        isAuthRequest,
        willRedirect: !isAuthPage && !isAuthRequest,
        currentPath,
        url: error.config?.url
      })
      
      // TEMPORARILY DISABLED - Testing if this is causing the reload
      console.log('⚠️ INTERCEPTOR REDIRECT DISABLED FOR DEBUGGING')
      /*
      // Only clear auth and redirect if:
      // 1. Not already on an auth page
      // 2. The error is from a protected endpoint (not login/register/forgot-password)
      if (!isAuthPage && !isAuthRequest) {
        console.log('🔄 Redirecting to login due to 401 on protected endpoint')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else {
        console.log('✋ Skipping redirect - auth page or auth request')
      }
      */
    }
    return Promise.reject(error)
  }
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        try {
          // Parse stored user data first for immediate UI update
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          
          // Then verify token is still valid by fetching fresh profile
          const response = await axios.get('/api/auth/profile')
          if (response.data.success) {
            setUser(response.data.data)
            localStorage.setItem('user', JSON.stringify(response.data.data))
          }
        } catch (error) {
          // Token is invalid, clear storage
          console.error('Auth verification failed:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
      
      setLoading(false)
      setIsInitialized(true)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 useAuth.login called with:', { email })
      setLoading(true)
      
      console.log('📡 Making login request to server...')
      const response = await axios.post('/api/auth/login', { email, password })
      
      console.log('📨 Server response:', response.data)
      
      if (response.data.success) {
        const { user: newUser, token } = response.data
        
        console.log('✅ Login successful, updating storage and state')
        
        // Update localStorage first
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(newUser))
        
        // Then update state
        setUser(newUser)
        
        return { success: true }
      } else {
        console.log('❌ Login failed - server returned success: false')
        return { success: false, message: response.data.message || 'Login failed' }
      }
    } catch (error: any) {
      console.error('💥 Login error caught:', error)
      
      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred'
      
      if (error.response) {
        console.log('📊 Error response details:', {
          status: error.response.status,
          data: error.response.data,
          url: error.config?.url
        })
        
        // Server responded with error status
        const status = error.response.status
        const serverMessage = error.response.data?.message
        
        if (status === 401) {
          errorMessage = serverMessage || 'Invalid email or password'
        } else if (status === 400) {
          errorMessage = serverMessage || 'Please check your input and try again'
        } else if (status === 429) {
          errorMessage = 'Too many login attempts. Please try again later'
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later'
        } else {
          errorMessage = serverMessage || 'Login failed'
        }
      } else if (error.request) {
        console.log('🌐 Network error - no response received')
        errorMessage = 'Network error. Please check your connection and try again'
      } else {
        console.log('⚙️ Request setup error:', error.message)
      }
      
      console.log('📤 Returning error result:', { success: false, message: errorMessage })
      
      return { 
        success: false, 
        message: errorMessage
      }
    } finally {
      console.log('🏁 useAuth.login - setting loading to false')
      setLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true)
      const response = await axios.post('/api/auth/register', userData)
      
      if (response.data.success) {
        const { user: newUser, token } = response.data
        
        // Update localStorage first
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(newUser))
        
        // Then update state
        setUser(newUser)
        
        return { success: true }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint before removing token
      await axios.post('/api/auth/logout')
    } catch (error) {
      // Don't fail logout if API call fails
      console.log('Logout API call failed, proceeding with client-side logout')
    } finally {
      // Always clear local storage and state
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await axios.put('/api/auth/profile', data)
      
      if (response.data.success) {
        const updatedUser = response.data.data
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        return { success: true }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Profile update failed' 
      }
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && isInitialized,
    loading: loading || !isInitialized,
    login,
    register,
    logout,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 