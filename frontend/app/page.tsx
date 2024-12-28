'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { StatsBar, FilterBar, MarketGrid } from '@/components/markets'
import { useMarkets } from '@/lib/hooks/use-markets'
import { useTranslation } from '@/lib/i18n'
import { useFilterContext } from '@/lib/contexts/filter-context'
import type { MarketFilter } from '@/lib/types/market'

export default function MarketsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { filters, setFilters } = useFilterContext()

  const { markets, stats, loading, error, refetch, hasMore, loadMore } = useMarkets(filters)

  const handleMarketSelect = useCallback(
    (id: string) => {
      router.push(`/market/${id}`)
    },
    [router]
  )

  const handleFiltersChange = useCallback((newFilters: MarketFilter) => {
    setFilters(newFilters)
  }, [setFilters])

  return (
    <main className="min-h-screen bg-background">
      <div className="p-6">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('home.title')}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mb-8">
          <StatsBar stats={stats} loading={loading && markets.length === 0} />
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* Market Grid */}
        <MarketGrid
          markets={markets}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onSelect={handleMarketSelect}
          onLoadMore={loadMore}
          onRetry={refetch}
        />
      </div>
    </main>
  )
}
