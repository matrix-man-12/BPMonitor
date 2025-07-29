import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const api = axios.create({
  baseURL: `${API_URL}/api/family`
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface FamilyMember {
  userId: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  role: 'admin' | 'member'
  permissions: {
    canViewAllReadings: boolean
    canInviteMembers: boolean
    canRemoveMembers: boolean
    canEditGroupSettings: boolean
  }
  joinedAt: string
  invitedBy?: {
    _id: string
    firstName: string
    lastName: string
  }
}

export interface FamilyGroup {
  _id: string
  name: string
  description?: string
  inviteCode: string
  inviteExpiry: string
  adminId: string
  members: FamilyMember[]
  settings: {
    isPrivate: boolean
    allowSelfJoin: boolean
    maxMembers: number
    dataRetentionDays: number
  }
  stats: {
    totalMembers: number
    totalReadings: number
    lastActivity: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateFamilyGroupData {
  name: string
  description?: string
  settings?: {
    isPrivate?: boolean
    allowSelfJoin?: boolean
    maxMembers?: number
    dataRetentionDays?: number
  }
}

export interface InvitePreview {
  groupName: string
  description?: string
  adminName: string
  memberCount: number
  expiresAt: string
  isExpired: boolean
}

export interface InviteLinkData {
  inviteCode: string
  inviteLink: string
  expiresAt: string
  expiresIn: string
}

class FamilyService {
  // Create a new family group
  async createFamilyGroup(data: CreateFamilyGroupData): Promise<FamilyGroup> {
    try {
      const response = await api.post('/', data)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create family group')
    }
  }

  // Get user's family groups
  async getFamilyGroups(): Promise<FamilyGroup[]> {
    try {
      const response = await api.get('/')
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch family groups')
    }
  }

  // Get a specific family group
  async getFamilyGroup(groupId: string): Promise<FamilyGroup> {
    try {
      const response = await api.get(`/${groupId}`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch family group')
    }
  }

  // Update family group
  async updateFamilyGroup(groupId: string, data: Partial<CreateFamilyGroupData>): Promise<FamilyGroup> {
    try {
      const response = await api.put(`/${groupId}`, data)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update family group')
    }
  }

  // Delete family group
  async deleteFamilyGroup(groupId: string): Promise<void> {
    try {
      await api.delete(`/${groupId}`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete family group')
    }
  }

  // Generate invite code (legacy)
  async generateInviteCode(groupId: string): Promise<{ inviteCode: string }> {
    try {
      const response = await api.post(`/${groupId}/invite`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate invite code')
    }
  }

  // Generate shareable invite link
  async generateInviteLink(groupId: string): Promise<InviteLinkData> {
    try {
      const response = await api.post(`/${groupId}/invite-link`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate invite link')
    }
  }

  // Get invite preview (public, no auth required)
  async getInvitePreview(inviteCode: string): Promise<InvitePreview> {
    try {
      const response = await axios.get(`${API_URL}/api/family/invite-preview/${inviteCode}`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get invite preview')
    }
  }

  // Join family group with invite code (legacy)
  async joinFamilyGroup(inviteCode: string): Promise<FamilyGroup> {
    try {
      const response = await api.post('/join', { inviteCode })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to join family group')
    }
  }

  // Join family group with invite link
  async joinFamilyGroupByLink(inviteCode: string): Promise<FamilyGroup> {
    try {
      const response = await api.post(`/join/${inviteCode}`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to join family group')
    }
  }

  // Remove member from family group
  async removeMember(groupId: string, memberId: string): Promise<FamilyGroup> {
    try {
      const response = await api.delete(`/${groupId}/members/${memberId}`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove member')
    }
  }

  // Update member permissions
  async updateMemberPermissions(
    groupId: string, 
    memberId: string, 
    permissions: Partial<FamilyMember['permissions']>
  ): Promise<FamilyGroup> {
    try {
      const response = await api.put(`/${groupId}/members/${memberId}/permissions`, permissions)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update member permissions')
    }
  }

  // Leave family group
  async leaveFamilyGroup(groupId: string): Promise<void> {
    try {
      await api.post(`/${groupId}/leave`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to leave family group')
    }
  }

  // Helper method to check if invite is expired
  static isInviteExpired(expiresAt: string): boolean {
    return new Date(expiresAt) <= new Date()
  }

  // Helper method to format time remaining
  static getTimeRemaining(expiresAt: string): string {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diffMs = expires.getTime() - now.getTime()

    if (diffMs <= 0) {
      return 'Expired'
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }

  // Helper method to share invite link
  static async shareInviteLink(inviteLink: string, groupName: string): Promise<void> {
    const shareData = {
      title: `Join ${groupName} on BP Monitor`,
      text: `You've been invited to join the ${groupName} family group on BP Monitor to track health together!`,
      url: inviteLink
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        // Fall back to copying to clipboard
        await navigator.clipboard.writeText(inviteLink)
      }
    } else {
      // Fall back to copying to clipboard
      await navigator.clipboard.writeText(inviteLink)
    }
  }

  // Helper method to copy invite link
  static async copyInviteLink(inviteLink: string): Promise<void> {
    await navigator.clipboard.writeText(inviteLink)
  }
}

export default new FamilyService() 