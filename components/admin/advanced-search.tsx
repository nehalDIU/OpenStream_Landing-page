"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTheme } from "@/contexts/theme-context"
import { useDebounce } from "@/lib/performance"
import {
  Search,
  Clock,
  Key,
  Activity,
  BarChart3,
  Settings,
  User,
  FileText,
  Filter,
  X,
  ArrowRight,
  Command
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  description: string
  category: "codes" | "logs" | "users" | "settings" | "analytics"
  url: string
  icon: React.ComponentType<{ className?: string }>
  metadata?: Record<string, any>
  relevance: number
}

interface AdvancedSearchProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (url: string) => void
  data?: {
    codes?: any[]
    logs?: any[]
    users?: any[]
  }
}

export function AdvancedSearch({
  isOpen,
  onClose,
  onNavigate,
  data = {}
}: AdvancedSearchProps) {
  const { resolvedTheme } = useTheme()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const debouncedQuery = useDebounce(query, 300)

  // Mock search data - in real app this would come from API
  const searchableData: SearchResult[] = [
    {
      id: "overview",
      title: "Dashboard Overview",
      description: "Main dashboard with system metrics and activity",
      category: "analytics",
      url: "/admin/overview",
      icon: BarChart3,
      relevance: 1
    },
    {
      id: "access-codes",
      title: "Access Codes",
      description: "Manage and generate access codes",
      category: "codes",
      url: "/admin/access-codes",
      icon: Key,
      relevance: 1
    },
    {
      id: "activity-logs",
      title: "Activity Logs",
      description: "View system activity and user actions",
      category: "logs",
      url: "/admin/activity-logs",
      icon: Activity,
      relevance: 1
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "System analytics and performance metrics",
      category: "analytics",
      url: "/admin/analytics",
      icon: BarChart3,
      relevance: 1
    },
    {
      id: "settings",
      title: "Settings",
      description: "System configuration and preferences",
      category: "settings",
      url: "/admin/settings",
      icon: Settings,
      relevance: 1
    }
  ]

  // Search function
  const performSearch = (searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    
    return searchableData
      .map(item => {
        let relevance = 0
        
        // Title match (highest priority)
        if (item.title.toLowerCase().includes(query)) {
          relevance += item.title.toLowerCase().startsWith(query) ? 100 : 50
        }
        
        // Description match
        if (item.description.toLowerCase().includes(query)) {
          relevance += 25
        }
        
        // Category match
        if (item.category.toLowerCase().includes(query)) {
          relevance += 15
        }
        
        return { ...item, relevance }
      })
      .filter(item => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10) // Limit to top 10 results
  }

  // Update search results when query changes
  useEffect(() => {
    if (debouncedQuery) {
      setIsLoading(true)
      // Simulate API delay
      setTimeout(() => {
        const searchResults = performSearch(debouncedQuery)
        setResults(searchResults)
        setSelectedIndex(0)
        setIsLoading(false)
      }, 100)
    } else {
      setResults([])
      setSelectedIndex(0)
    }
  }, [debouncedQuery])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case "Enter":
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (result: SearchResult) => {
    onNavigate(result.url)
    onClose()
    setQuery("")
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "codes":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "logs":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "users":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
      case "settings":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
      case "analytics":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "codes":
        return Key
      case "logs":
        return Activity
      case "users":
        return User
      case "settings":
        return Settings
      case "analytics":
        return BarChart3
      default:
        return FileText
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 theme-bg-card">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 theme-text-primary">
            <Search className="h-5 w-5" />
            Search Admin Panel
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 theme-text-muted" />
            <Input
              ref={inputRef}
              placeholder="Search for pages, features, or data..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base theme-input"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Search Results */}
          <ScrollArea className="max-h-96">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm theme-text-secondary">Searching...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result, index) => {
                  const Icon = result.icon
                  const CategoryIcon = getCategoryIcon(result.category)
                  const isSelected = index === selectedIndex
                  
                  return (
                    <div
                      key={result.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      )}
                      onClick={() => handleSelect(result)}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        isSelected
                          ? "bg-blue-100 dark:bg-blue-900/40"
                          : "bg-gray-100 dark:bg-gray-800"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          isSelected
                            ? "text-blue-600 dark:text-blue-400"
                            : "theme-text-secondary"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm theme-text-primary truncate">
                            {result.title}
                          </h3>
                          <Badge className={cn("text-xs", getCategoryColor(result.category))}>
                            {result.category}
                          </Badge>
                        </div>
                        <p className="text-xs theme-text-secondary truncate">
                          {result.description}
                        </p>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 theme-text-muted flex-shrink-0" />
                    </div>
                  )
                })}
              </div>
            ) : query ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 theme-text-muted mx-auto mb-3" />
                <h3 className="font-medium theme-text-primary mb-1">No results found</h3>
                <p className="text-sm theme-text-secondary">
                  Try searching for "codes", "logs", "analytics", or "settings"
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Command className="h-12 w-12 theme-text-muted mx-auto mb-3" />
                <h3 className="font-medium theme-text-primary mb-1">Quick Search</h3>
                <p className="text-sm theme-text-secondary mb-4">
                  Search across all admin panel features and data
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["codes", "logs", "analytics", "settings"].map(term => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuery(term)}
                      className="text-xs"
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t theme-border mt-4">
            <div className="flex items-center gap-4 text-xs theme-text-muted">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">↑↓</Badge>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">↵</Badge>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">Esc</Badge>
                <span>Close</span>
              </div>
            </div>
            
            {results.length > 0 && (
              <div className="text-xs theme-text-muted">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
