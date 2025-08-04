import axios from 'axios'

// Create axios instance with base configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  timeout: 10000,
})

// Add auth token to requests where needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && !config.url?.includes('forgot-password') && !config.url?.includes('reset-password') && !config.url?.includes('validate-reset-token')) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  dateOfBirth?: string
}

export interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: User
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  newPassword: string
}

export interface ResetTokenValidation {
  email: string
  userName: string
  expiresAt: string
  minutesRemaining: number
}

class AuthService {
  private api = api

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post('/login', credentials)
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  // Register user
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.api.post('/register', userData)
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  }

  // Forgot password - Send reset email
  async forgotPassword(data: ForgotPasswordData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.post('/forgot-password', data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send password reset email')
    }
  }

  // Reset password using token
  async resetPassword(data: ResetPasswordData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.post('/reset-password', data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password')
    }
  }

  // Validate reset token
  async validateResetToken(token: string): Promise<{ success: boolean; message: string; data?: ResetTokenValidation }> {
    try {
      const response = await this.api.get(`/validate-reset-token/${token}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Invalid or expired reset token')
    }
  }

  // Get user profile
  async getProfile(): Promise<{ success: boolean; user: User }> {
    try {
      const response = await this.api.get('/profile')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile')
    }
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<{ success: boolean; user: User; message: string }> {
    try {
      const response = await this.api.put('/profile', userData)
      
      if (response.data.success && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile')
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.put('/change-password', {
        currentPassword,
        newPassword
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password')
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await this.api.post('/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed, continuing with local logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    return !!(token && user)
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
      return null
    }
  }

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem('token')
  }

  // Clear auth data
  clearAuthData(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

const authService = new AuthService()
export default authService