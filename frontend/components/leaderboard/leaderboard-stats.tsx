'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, TrendingUp, Coins, Activity } from 'lucide-react'
import { formatEther } from 'viem'
import { useTranslation } from '@/lib/i18n'
import type { LeaderboardStats as Stats } from '@/lib/hooks/use-leaderboard'

interface LeaderboardStatsProps {
  stats: Stats
  loading: boolean
}

export function LeaderboardStats({ stats, loading }: LeaderboardStatsProps) {
  const { t } = useTranslation()

  const statItems = [
    {
      label: t('leaderboard.stats.totalPredictors'),
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-500',
    },
    {
      label: t('leaderboard.stats.totalVolume'),
      value: `${parseFloat(formatEther(stats.totalVolume)).toFixed(4)} VERY`,
      icon: Coins,
      color: 'text-green-500',
    },
    {
      label: t('leaderboard.stats.totalBets'),
      value: stats.totalBets.toLocaleString(),
      icon: TrendingUp,
      color: 'text-purple-500',
    },
    {
      label: t('leaderboard.stats.activeMarkets'),
      value: stats.activeMarkets.toLocaleString(),
      icon: Activity,
      color: 'text-orange-500',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-2xl font-bold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
