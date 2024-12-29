'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react'
import { formatEther } from 'viem'
import { useTranslation } from '@/lib/i18n'
import type { LeaderboardEntry } from '@/lib/hooks/use-leaderboard'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />
    default:
      return <span className="text-muted-foreground font-medium">#{rank}</span>
  }
}

function formatAddress(address: string): string {
  if (address.length <= 13) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatPnL(pnl: bigint): { text: string; isPositive: boolean } {
  const value = parseFloat(formatEther(pnl))
  const isPositive = value >= 0
  const formatted = `${isPositive ? '+' : ''}${value.toFixed(4)}`
  return { text: `${formatted} VERY`, isPositive }
}

export function LeaderboardTable({ entries, loading, hasMore, onLoadMore }: LeaderboardTableProps) {
  const { t } = useTranslation()

  if (loading && entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('leaderboard.table.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('leaderboard.table.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t('leaderboard.table.noData')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('leaderboard.table.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 pl-4">{t('leaderboard.table.rank')}</th>
                <th className="pb-3">{t('leaderboard.table.predictor')}</th>
                <th className="pb-3 text-right">{t('leaderboard.table.pnl')}</th>
                <th className="pb-3 text-right">{t('leaderboard.table.winRate')}</th>
                <th className="pb-3 text-right">{t('leaderboard.table.roi')}</th>
                <th className="pb-3 text-right">{t('leaderboard.table.bets')}</th>
                <th className="pb-3 text-right pr-4">{t('leaderboard.table.volume')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const pnl = formatPnL(entry.pnl)
                return (
                  <tr
                    key={entry.address}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 pl-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="font-mono text-sm">
                        {formatAddress(entry.address)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {pnl.isPositive ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={pnl.isPositive ? 'text-green-500' : 'text-red-500'}>
                          {pnl.text}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <Badge variant={entry.winRate >= 50 ? 'default' : 'secondary'}>
                        {entry.winRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      <span className={entry.roi >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {entry.roi >= 0 ? '+' : ''}{entry.roi.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 text-right text-muted-foreground">
                      {entry.totalBets}
                    </td>
                    <td className="py-4 text-right pr-4 text-muted-foreground">
                      {parseFloat(formatEther(entry.totalWagered)).toFixed(4)} VERY
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {entries.map((entry) => {
            const pnl = formatPnL(entry.pnl)
            return (
              <div
                key={entry.address}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8">{getRankIcon(entry.rank)}</div>
                    <span className="font-mono text-sm">{formatAddress(entry.address)}</span>
                  </div>
                  <Badge variant={entry.winRate >= 50 ? 'default' : 'secondary'}>
                    {entry.winRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('leaderboard.table.pnl')}: </span>
                    <span className={pnl.isPositive ? 'text-green-500' : 'text-red-500'}>
                      {pnl.text}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('leaderboard.table.roi')}: </span>
                    <span className={entry.roi >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {entry.roi >= 0 ? '+' : ''}{entry.roi.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('leaderboard.table.bets')}: </span>
                    <span>{entry.totalBets}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('leaderboard.table.wins')}: </span>
                    <span>{entry.winCount}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={onLoadMore} disabled={loading}>
              {loading ? t('common.loading') : t('common.loadMore')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
