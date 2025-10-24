"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  IconUser,
  IconFolder,
  IconPhoto,
  IconCar,
  IconTool,
  IconFileText,
  IconSearch,
  IconUsers,
  IconSettings,
  IconMap,
  IconPlus
} from "@tabler/icons-react"
import { NewWorkspaceDialog } from "@/components/project/new-workspace-dialog"

interface SearchResult {
  id: string
  title: string
  description?: string
  type: 'person' | 'project' | 'workspace' | 'part' | 'picture' | 'post' | 'vehicle' | 'tool' | 'document'
  url?: string
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface QuickAction {
  id: string
  title: string
  icon: React.ReactNode
  shortcut: string
  action: () => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false)

  // Mock search results for demonstration
  const mockSearch = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return []
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const mockData: SearchResult[] = [
      {
        id: "1",
        title: "John Doe",
        description: "Automotive Engineer",
        type: "person",
        url: "/users/john-doe"
      },
      {
        id: "2", 
        title: "BMW E46 M3 Project",
        description: "Track car build with S54 engine",
        type: "project",
        url: "/projects/bmw-e46-m3"
      },
      {
        id: "3",
        title: "Public Garage",
        description: "Community workspace for electric vehicle conversions",
        type: "workspace", 
        url: "/workspaces/public-garage"
      },
      {
        id: "4",
        title: "Bosch LSU 4.9 O2 Sensor",
        description: "Wideband oxygen sensor for tuning",
        type: "part",
        url: "/parts/bosch-lsu-49"
      },
      {
        id: "5",
        title: "Engine Bay Wiring",
        description: "Clean wire routing in BMW engine bay",
        type: "picture",
        url: "/gallery/engine-bay-wiring"
      },
      {
        id: "6",
        title: "ECU Tuning Guide",
        description: "How to tune modern engine management systems", 
        type: "post",
        url: "/posts/ecu-tuning-guide"
      }
    ]

    // Filter results based on query
    return mockData.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [])

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const searchResults = await mockSearch(query)
        setResults(searchResults)
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, mockSearch])

  const getIcon = (type: SearchResult['type']) => {
    const iconProps = { size: 16, className: "mr-2" }
    switch (type) {
      case 'person': return <IconUser {...iconProps} />
      case 'project': return <IconFolder {...iconProps} />
      case 'workspace': return <IconMap {...iconProps} />
      case 'part': return <IconTool {...iconProps} />
      case 'picture': return <IconPhoto {...iconProps} />
      case 'post': return <IconFileText {...iconProps} />
      case 'vehicle': return <IconCar {...iconProps} />
      case 'tool': return <IconSettings {...iconProps} />
      case 'document': return <IconFileText {...iconProps} />
      default: return <IconSearch {...iconProps} />
    }
  }

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'person': return 'People'
      case 'project': return 'Projects'
      case 'workspace': return 'Workspaces'
      case 'part': return 'Parts'
      case 'picture': return 'Pictures'
      case 'post': return 'Posts'
      case 'vehicle': return 'Vehicles'
      case 'tool': return 'Tools'
      case 'document': return 'Documents'
      default: return 'Results'
    }
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    const type = result.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false)
    if (result.url) {
      // Navigate to the result - you'll implement navigation logic here
      console.log("Navigate to:", result.url)
      // router.push(result.url)
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: "new-workspace",
      title: "New Workspace",
      icon: <IconPlus className="h-4 w-4" />,
      shortcut: "⌘N",
      action: () => {
        onOpenChange(false)
        setShowNewWorkspaceDialog(true)
      }
    },
    {
      id: "browse-people",
      title: "Browse People", 
      icon: <IconUsers className="h-4 w-4" />,
      shortcut: "⌘P",
      action: () => {
        onOpenChange(false)
        console.log("Browse people")
      }
    },
    {
      id: "find-workspaces",
      title: "Find Workspaces",
      icon: <IconMap className="h-4 w-4" />,
      shortcut: "⌘W", 
      action: () => {
        onOpenChange(false)
        console.log("Find workspaces")
      }
    }
  ]

  return (
    <>
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search people, projects, workspaces, parts..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <IconSearch className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </div>
        ) : (
          <>
            {query && results.length === 0 && (
              <CommandEmpty>No results found for "{query}"</CommandEmpty>
            )}
            
            {!query && (
              <CommandGroup heading="Quick Actions">
                {quickActions.map((action) => (
                  <CommandItem key={action.id} onSelect={action.action}>
                    <span className="mr-2">{action.icon}</span>
                    {action.title}
                    <CommandShortcut>{action.shortcut}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {Object.entries(groupedResults).map(([type, items]) => (
              <div key={type}>
                <CommandSeparator />
                <CommandGroup heading={getTypeLabel(type as SearchResult['type'])}>
                  {items.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                    >
                      {getIcon(result.type)}
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        {result.description && (
                          <span className="text-sm text-muted-foreground">
                            {result.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ))}

            {query && results.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem className="text-center text-sm text-muted-foreground">
                    Press ↵ to select • ↑↓ to navigate
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
    
    {/* New Workspace Dialog */}
    <NewWorkspaceDialog open={showNewWorkspaceDialog} onOpenChange={setShowNewWorkspaceDialog}>
      <div />
    </NewWorkspaceDialog>
  </>
  )
}