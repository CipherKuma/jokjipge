'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, BarChart3, Activity, Wallet } from 'lucide-react'
import { formatEther } from 'viem'
import { useTranslation } from '@/lib/i18n'
import type { MarketStats } from '@/lib/types/market'

interface StatsBarProps {
  stats: MarketStats
  loading: boolean
  userPnL?: bigint
}

function formatVolume(value: bigint): string {
  const num = Number(formatEther(value))
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(4)
}

function formatPnL(value: bigint): { text: string; isPositive: boolean } {
  const num = Number(formatEther(value))
  const isPositive = num >= 0
  const formatted = Math.abs(num).toFixed(2)
  return { text: `${isPositive ? '+' : '-'}${formatted}`, isPositive }
}

export function StatsBar({ stats, loading, userPnL }: StatsBarProps) {
  const { t } = useTranslation()

  const statItems = [
    {
      label: t('stats.totalMarkets'),
      value: stats.totalMarkets.toString(),
      icon: BarChart3,
      color: 'text-primary',
    },
    {
      label: t('stats.totalVolume'),
      value: `${formatVolume(stats.totalVolume)} VERY`,
      icon: TrendingUp,
      color: 'text-secondary',
    },
    {
      label: t('stats.activeBets'),
      value: stats.activeBets.toLocaleString(),
      icon: Activity,
      color: 'text-live',
    },
  ]

  // Add user PnL if connected
  if (userPnL !== undefined) {
    const pnl = formatPnL(userPnL)
    statItems.push({
      label: t('stats.yourPnL'),
      value: `${pnl.text} VERY`,
      icon: Wallet,
      color: pnl.isPositive ? 'text-success' : 'text-destructive',
    })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 bg-card border-border">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <Card
          key={stat.label}
          className="p-4 bg-card border-border hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </Card>
      ))}
    </div>
  )
}
