import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import axios from 'axios'

interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  familyGroups: string[]
  notificationPreferences: {
    enabled: boolean
    frequency: string
    times: string[]
    email: boolean
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        try {
          // Verify token is still valid by fetching profile
          const response = await axios.get('/api/auth/profile')
          setUser(response.data.data)
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      
      if (response.data.success) {
        const { user, token } = response.data.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)
        return { success: true }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      const response = await axios.post('/api/auth/register', userData)
      
      if (response.data.success) {
        const { user, token } = response.data.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)
        return { success: true }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    // Optionally call logout endpoint
    axios.post('/api/auth/logout').catch(() => {})
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
    isAuthenticated: !!user,
    loading,
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