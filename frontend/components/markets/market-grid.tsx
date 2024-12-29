'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Search, RefreshCw } from 'lucide-react'
import { MarketCard } from './market-card'
import type { Market } from '@/lib/types/market'

interface MarketGridProps {
  markets: Market[]
  loading: boolean
  error: string | null
  hasMore: boolean
  onSelect: (id: string) => void
  onLoadMore: () => void
  onRetry?: () => void
}

function MarketCardSkeleton() {
  return (
    <Card className="p-4 bg-card border-border">
      <Skeleton className="h-5 w-20 mb-3" />
      <Skeleton className="h-12 w-full mb-4" />
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  )
}

function EmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No markets found</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        Try adjusting your filters or search query to find markets.
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="border-border">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      )}
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16">
      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        <RefreshCw className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load markets</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4">{error}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="border-border">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}

export function MarketGrid({
  markets,
  loading,
  error,
  hasMore,
  onSelect,
  onLoadMore,
  onRetry,
}: MarketGridProps) {
  // Initial loading state
  if (loading && markets.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Error state
  if (error && markets.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    )
  }

  // Empty state
  if (!loading && markets.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <EmptyState onRetry={onRetry} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Market Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} onSelect={onSelect} />
        ))}

        {/* Loading more skeletons */}
        {loading &&
          [...Array(3)].map((_, i) => <MarketCardSkeleton key={`loading-${i}`} />)}
      </div>

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="border-border hover:border-primary/50"
          >
            Load More Markets
          </Button>
        </div>
      )}
    </div>
  )
}
