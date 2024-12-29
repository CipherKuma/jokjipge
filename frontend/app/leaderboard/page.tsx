'use client'

import { Trophy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LeaderboardStats, LeaderboardTabs, LeaderboardTable } from '@/components/leaderboard'
import { useLeaderboard } from '@/lib/hooks/use-leaderboard'
import { useTranslation } from '@/lib/i18n'

export default function LeaderboardPage() {
  const { t } = useTranslation()
  const {
    entries,
    stats,
    loading,
    error,
    sortBy,
    setSortBy,
    refetch,
    hasMore,
    loadMore,
  } = useLeaderboard()

  return (
    <main className="min-h-screen bg-background">
      <div className="p-6">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {t('leaderboard.title')}
                </h1>
              </div>
              <p className="text-muted-foreground">
                {t('leaderboard.subtitle')}
              </p>
            </div>
            <Button variant="outline" onClick={refetch} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Section */}
        <div className="mb-8">
          <LeaderboardStats stats={stats} loading={loading && entries.length === 0} />
        </div>

        {/* Sort Tabs */}
        <div className="mb-6">
          <LeaderboardTabs sortBy={sortBy} onSortChange={setSortBy} />
        </div>

        {/* Leaderboard Table */}
        <LeaderboardTable
          entries={entries}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </div>
    </main>
  )
}
