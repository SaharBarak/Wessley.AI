"use client"

import { FC, useState, useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SIDEBAR_WIDTH } from "../ui/dashboard"
import { NewWorkspaceDialog } from "../project/new-workspace-dialog"
import { useSearch } from "../search/search-provider"
import { ChatbotUIContext } from "@/context/context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  IconEdit, 
  IconSearch, 
  IconPlus,
  IconLibrary, 
  IconShoppingCart,
  IconSettings,
  IconCompass,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconLayoutSidebar,
  IconBrandGoogle,
  IconTrash,
  IconPencil
} from "@tabler/icons-react"
import Image from "next/image"
import { ProfileSettings } from "../utility/profile-settings"
import { createClient } from "@/lib/supabase/client"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SidebarProps {
  showSidebar: boolean
  onMainViewChange?: (view: string) => void
  currentView?: string
  onToggleSidebar?: () => void
}

export const Sidebar: FC<SidebarProps> = ({ showSidebar, onMainViewChange, currentView, onToggleSidebar }) => {
  const router = useRouter()
  const { open } = useSearch()
  const { profile, workspaces, chats, setWorkspaces, setSelectedWorkspace } = useContext(ChatbotUIContext)
  const [authUser, setAuthUser] = useState<any>(null)

  useEffect(() => {
    const getAuthUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setAuthUser(user)
    }
    getAuthUser()
  }, [profile])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['projects', 'chats']))
  
  // Rename/Delete state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workspaceForAction, setWorkspaceForAction] = useState<any>(null)
  const [newName, setNewName] = useState("")

  const handleProjectClick = (projectId: string) => {
    // Find the workspace by ID
    const workspace = workspaces.find(w => w.id === projectId)
    
    if (expandedProjects.has(projectId)) {
      const newExpanded = new Set(expandedProjects)
      newExpanded.delete(projectId)
      setExpandedProjects(newExpanded)
    } else {
      setExpandedProjects(new Set([...expandedProjects, projectId]))
    }
    
    setSelectedProject(projectId)
    
    // Navigate to the project page using the new URL pattern
    if (workspace) {
      setSelectedWorkspace(workspace)
      router.push(`/g/${projectId}/project`)
    }
  }

  const handleViewChange = (view: string) => {
    onMainViewChange?.(view)
  }

  const handleToggleSidebar = () => {
    onToggleSidebar?.()
  }

  const handleSectionToggle = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/chat`
      }
    })
  }

  const handleRename = (workspace: any) => {
    setSelectedWorkspace(workspace)
    setNewName(workspace.name)
    setRenameDialogOpen(true)
  }

  const handleDelete = (workspace: any) => {
    setSelectedWorkspace(workspace)
    setDeleteDialogOpen(true)
  }

  const confirmRename = async () => {
    if (!workspaceForAction || !newName.trim()) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('workspaces')
        .update({ name: newName.trim() })
        .eq('id', workspaceForAction.id)
      
      if (!error) {
        setWorkspaces(workspaces.map(w => 
          w.id === workspaceForAction.id ? { ...w, name: newName.trim() } : w
        ))
      }
    } catch (error) {
      console.error('Error renaming workspace:', error)
    }
    
    setRenameDialogOpen(false)
    setSelectedWorkspace(null)
    setNewName("")
  }

  const confirmDelete = async () => {
    if (!workspaceForAction) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceForAction.id)
      
      if (!error) {
        setWorkspaces(workspaces.filter(w => w.id !== workspaceForAction.id))
      }
    } catch (error) {
      console.error('Error deleting workspace:', error)
    }
    
    setDeleteDialogOpen(false)
    setSelectedWorkspace(null)
  }

  if (!showSidebar) return null

  return (
    <div
      className="flex flex-col h-screen"
      style={{ 
        width: `${SIDEBAR_WIDTH}px`,
        backgroundColor: '#090909'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Image 
            src="/wessley_thumb_chat.svg" 
            alt="Wessley" 
            width={24}
            height={24}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleSidebar}
          className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
        >
          <IconLayoutSidebar size={16} />
        </Button>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 pb-4">
          
          {/* Primary Actions */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-3 text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => handleViewChange('chat')}
            >
              <IconEdit size={16} className="mr-3" />
              New chat
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-3 text-white/80 hover:bg-white/10 hover:text-white"
              onClick={open}
            >
              <IconSearch size={16} className="mr-3" />
              Search
            </Button>
          </div>

          {/* Main Features */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-3 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <IconLibrary size={16} className="mr-3" />
              Library
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start h-9 px-3 text-white/80 hover:bg-white/10 hover:text-white ${
                currentView === 'marketplace' ? 'bg-white/10 text-white' : ''
              }`}
              onClick={() => handleViewChange('marketplace')}
            >
              <IconShoppingCart size={16} className="mr-3" />
              Marketplace
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start h-9 px-3 text-white/80 hover:bg-white/10 hover:text-white ${
                currentView === 'auto-tuning' ? 'bg-white/10 text-white' : ''
              }`}
              onClick={() => handleViewChange('auto-tuning')}
            >
              <IconSettings size={16} className="mr-3" />
              Auto-tune
            </Button>
            
            <Button
              variant="ghost"
              className={`w-full justify-start h-9 px-3 text-white/80 hover:bg-white/10 hover:text-white ${
                currentView === 'explore' ? 'bg-white/10 text-white' : ''
              }`}
              onClick={() => handleViewChange('explore')}
            >
              <IconCompass size={16} className="mr-3" />
              Explore
            </Button>
          </div>

          {/* Projects Section */}
          <div className="space-y-1">
            <button
              onClick={() => handleSectionToggle('projects')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-medium text-white/40 tracking-wider hover:text-white/60 group"
            >
              <span>Projects</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {expandedSections.has('projects') ? (
                  <IconChevronDown size={12} />
                ) : (
                  <IconChevronRight size={12} />
                )}
              </div>
            </button>
            
            {expandedSections.has('projects') && (
              <>
                <NewWorkspaceDialog>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <IconPlus size={16} className="mr-3" />
                    New project
                  </Button>
                </NewWorkspaceDialog>

                {workspaces.length > 0 && workspaces.map((workspace) => {
                  const workspaceChats = chats.filter(chat => chat.workspace_id === workspace.id)
                  return (
                    <div key={workspace.id}>
                      <ContextMenu>
                        <ContextMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start h-9 px-3 text-white/80 hover:bg-white/10 hover:text-white ${
                              selectedProject === workspace.id ? 'bg-white/10 text-white' : ''
                            }`}
                            onClick={() => handleProjectClick(workspace.id)}
                          >
                            {expandedProjects.has(workspace.id) ? (
                              <IconChevronDown size={12} className="mr-1" />
                            ) : (
                              <IconChevronRight size={12} className="mr-1" />
                            )}
                            <IconFolder size={16} className="mr-2" />
                            <span className="flex-1 text-left">{workspace.name}</span>
                            <span className="text-xs text-white/40">{workspaceChats.length}</span>
                          </Button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => handleRename(workspace)}>
                            <IconPencil size={14} className="mr-2" />
                            Rename
                          </ContextMenuItem>
                          <ContextMenuItem 
                            onClick={() => handleDelete(workspace)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <IconTrash size={14} className="mr-2" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                      
                      {expandedProjects.has(workspace.id) && workspaceChats.length > 0 && (
                        <div className="ml-8 space-y-0.5">
                          {workspaceChats.slice(0, 5).map((chat) => (
                            <Button
                              key={chat.id}
                              variant="ghost"
                              className="w-full justify-start h-8 px-2 text-xs text-white/60 hover:bg-white/10 hover:text-white/80"
                              onClick={() => router.push(`/c/${chat.id}`)}
                            >
                              <div className="w-1 h-1 rounded-full bg-white/30 mr-2"></div>
                              <span className="truncate">{chat.name}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>

          {/* Chats Section */}
          <div className="space-y-1">
            <button
              onClick={() => handleSectionToggle('chats')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-medium text-white/40 tracking-wider hover:text-white/60 group"
            >
              <span>Chats</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {expandedSections.has('chats') ? (
                  <IconChevronDown size={12} />
                ) : (
                  <IconChevronRight size={12} />
                )}
              </div>
            </button>
            
            {expandedSections.has('chats') && chats.length > 0 && (
              <>
                {chats.slice(0, 5).map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className="w-full justify-start h-8 px-3 text-white/60 hover:bg-white/10 hover:text-white/80"
                  >
                    <span className="truncate text-sm">{chat.name}</span>
                  </Button>
                ))}
              </>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Account Section */}
      <div className="p-3">
        {profile ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full overflow-hidden">
              {(authUser?.user_metadata?.avatar_url || profile.avatar_url || profile.image_url) ? (
                <Image
                  src={authUser?.user_metadata?.avatar_url || profile.avatar_url || profile.image_url || ''}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    {(authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || profile.display_name || profile.full_name || profile.username)?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium text-foreground truncate">
                {authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || profile.display_name || profile.full_name || profile.username || 'User'}
              </h3>
              <p className="text-xs font-normal text-gray-500">
                {profile.subscription_tier === 'insiders' || !profile.subscription_tier ? 'Insider' : 
                 profile.subscription_tier === 'pro' ? 'Pro' : 
                 profile.subscription_tier === 'enterprise' ? 'Enterprise' : 'Free'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-red-500 p-2 text-white font-bold">DEBUG: No profile found</div>
            <div className="space-y-2">
            <Button
              onClick={handleGoogleLogin}
              className="w-full justify-start h-9 px-3 bg-white text-black hover:bg-white/90"
            >
              <IconBrandGoogle size={16} className="mr-2" />
              Sign in with Google
            </Button>
            <p className="text-xs text-white/60 text-center">Sign in to access your projects and chat history</p>
            </div>
          </>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for "{workspaceForAction?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmRename()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{workspaceForAction?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}