'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ActivityItemComponent } from './activity-item'
import { useActivityFeed } from '@/hooks/activity/use-activity-feed'
import { Radio, RefreshCw, AlertCircle } from 'lucide-react'

interface LiveActivityFeedProps {
  subgraphUrl?: string
  className?: string
  maxItems?: number
  collapsed?: boolean
}

export function LiveActivityFeed({
  subgraphUrl,
  className,
  maxItems = 20,
  collapsed = false,
}: LiveActivityFeedProps) {
  const router = useRouter()
  const { items, loading, error, refetch } = useActivityFeed({
    subgraphUrl,
    maxItems,
  })

  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set())
  const previousItemsRef = useRef<string[]>([])

  // Track new items for animation
  useEffect(() => {
    const currentIds = items.map((item) => item.id)
    const previousIds = new Set(previousItemsRef.current)

    const newIds = currentIds.filter((id) => !previousIds.has(id))
    if (newIds.length > 0) {
      setNewItemIds(new Set(newIds))
      // Clear new status after animation
      const timeout = setTimeout(() => setNewItemIds(new Set()), 1000)
      return () => clearTimeout(timeout)
    }

    previousItemsRef.current = currentIds
  }, [items])

  const handleItemClick = (marketId: string) => {
    router.push(`/markets/${marketId}`)
  }

  if (collapsed) {
    return (
      <div className={cn('p-4', className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Radio className="h-4 w-4 text-live animate-pulse" />
          <span>
            {items.length} recent {items.length === 1 ? 'activity' : 'activities'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-live animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">Live Activity</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => refetch()}
          disabled={loading}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading && items.length === 0 ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Radio className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            // Activity items
            items.map((item) => (
              <ActivityItemComponent
                key={item.id}
                item={item}
                isNew={newItemIds.has(item.id)}
                onClick={() => handleItemClick(item.market.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
