import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Plus, 
  Settings, 
  Copy, 
  UserPlus,
  Crown,
  Clock,
  Heart,
  MoreVertical,
  Shield,
  Trash2,
  Share2,
  Link,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import familyService, { type FamilyGroup, type CreateFamilyGroupData, type InviteLinkData } from '@/services/familyService'
import { useAuth } from '@/hooks/useAuth'
import { formatDateIST } from '@/utils/timeUtils'

export function FamilyGroups() {
  const { user } = useAuth()
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null)
  const [inviteLink, setInviteLink] = useState<InviteLinkData | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchFamilyGroups()
  }, [])

  const fetchFamilyGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const groups = await familyService.getFamilyGroups()
      setFamilyGroups(groups)
    } catch (error: any) {
      console.error('Failed to fetch family groups:', error)
      setError(error.message || 'Failed to fetch family groups')
    } finally {
      setLoading(false)
    }
  }

  const createFamilyGroup = async () => {
    try {
      setError(null)
      const groupData: CreateFamilyGroupData = {
        name: newGroupName,
        description: newGroupDescription || undefined
      }
      
      const newGroup = await familyService.createFamilyGroup(groupData)
      setFamilyGroups([...familyGroups, newGroup])
      setCreateDialogOpen(false)
      setNewGroupName('')
      setNewGroupDescription('')
      setSuccess('Family group created successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Failed to create family group:', error)
      setError(error.message || 'Failed to create family group')
    }
  }

  const joinFamilyGroup = async () => {
    try {
      setError(null)
      await familyService.joinFamilyGroup(joinCode)
      await fetchFamilyGroups() // Refresh the list
      setJoinDialogOpen(false)
      setJoinCode('')
      setSuccess('Successfully joined family group!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Failed to join family group:', error)
      setError(error.message || 'Failed to join family group')
    }
  }

  const generateShareableLink = async (group: FamilyGroup) => {
    try {
      setError(null)
      setSelectedGroup(group)
      const linkData = await familyService.generateInviteLink(group._id)
      setInviteLink(linkData)
      setShareDialogOpen(true)
    } catch (error: any) {
      console.error('Failed to generate invite link:', error)
      setError(error.message || 'Failed to generate invite link')
    }
  }

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setSuccess('Invite code copied to clipboard!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to copy invite code:', error)
      setError('Failed to copy invite code')
    }
  }

  const copyInviteLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setSuccess('Invite link copied to clipboard!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to copy invite link')
      setTimeout(() => setError(''), 3000)
    }
  }

  const shareInviteLink = async (link: string, groupName: string) => {
    try {
      await familyService.shareInviteLink(link, groupName)
      setSuccess('Invite link shared!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to share invite link:', error)
      setError('Failed to share invite link')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Family Groups</h1>
          <p className="text-muted-foreground">Manage your family health tracking groups</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 cursor-pointer">
                <UserPlus className="h-4 w-4" />
                Join Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Family Group</DialogTitle>
                <DialogDescription>
                  Enter an invite code to join an existing family group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Invite Code</label>
                  <Input
                    placeholder="Enter invite code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                </div>
                <Button onClick={joinFamilyGroup} className="w-full cursor-pointer">
                  Join Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Family Group</DialogTitle>
                <DialogDescription>
                  Create a family group to share blood pressure readings with family members.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Group Name</label>
                  <Input
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Input
                    placeholder="Enter group description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                </div>
                <Button onClick={createFamilyGroup} className="w-full cursor-pointer">
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Share Invite Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Family Group Invite</DialogTitle>
            <DialogDescription>
              Share this invite link with family members to join your group.
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && inviteLink && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{selectedGroup.name}</div>
                    <div className="text-sm text-muted-foreground">Family Group</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Invite Link</div>
                  <div className="p-2 rounded border bg-background text-sm break-all font-mono">
                    {inviteLink.inviteLink}
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Expires in {inviteLink.expiresIn}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => copyInviteLink(inviteLink.inviteLink)} 
                  className="flex-1 gap-2 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>
                <Button 
                  onClick={() => shareInviteLink(inviteLink.inviteLink, selectedGroup.name)} 
                  variant="outline"
                  className="flex-1 gap-2 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                This link will expire in 24 hours and can be used by anyone to join your family group.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Family Groups Grid */}
      {familyGroups.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Family Groups Yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first family group or join an existing one to start tracking health together.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
              <Button variant="outline" onClick={() => setJoinDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Join Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {familyGroups.map((group) => {
            const isAdmin = group.adminId === user?._id
            const currentUserMember = group.members.find(m => m.userId._id === user?._id)
            
            return (
              <Card key={group._id} className="dashboard-card group hover:scale-105">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        {isAdmin && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Crown className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => generateShareableLink(group)} className="cursor-pointer">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Invite Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyInviteCode(group.inviteCode)} className="cursor-pointer">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Invite Code
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                              <Settings className="h-4 w-4 mr-2" />
                              Group Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 cursor-pointer">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Group
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold text-blue-500">{group.stats.totalMembers}</div>
                      <div className="text-xs text-muted-foreground">Members</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold text-red-500">{group.stats.totalReadings}</div>
                      <div className="text-xs text-muted-foreground">Readings</div>
                    </div>
                  </div>

                  {/* Members Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Members</span>
                      <span className="text-xs text-muted-foreground">
                        {group.members.length} total
                      </span>
                    </div>
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 4).map((member) => (
                        <Avatar key={member.userId._id} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src="" alt={member.userId.firstName} />
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-xs">
                            {member.userId.firstName[0]}{member.userId.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {group.members.length > 4 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border-2 border-background">
                          <span className="text-xs font-medium">+{group.members.length - 4}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invite Code */}
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Invite Code</div>
                        <div className="font-mono text-sm font-medium">{group.inviteCode}</div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyInviteCode(group.inviteCode)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Created {formatDateIST(group.createdAt)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 