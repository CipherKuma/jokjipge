'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEther } from 'viem'
import { TrendingUp, TrendingDown, Target, Wallet, Activity } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export interface PnLSummaryProps {
  totalPnL: bigint
  winRate: number
  totalWagered: bigint
  totalWon: bigint
  activeBets: number
  isLoading?: boolean
}

function formatPnL(value: bigint): string {
  const formatted = Number(formatEther(value)).toFixed(4)
  const sign = value > 0n ? '+' : ''
  return `${sign}${formatted} VERY`
}

function formatAmount(value: bigint): string {
  return `${Number(formatEther(value)).toFixed(4)} VERY`
}

export function PnLSummary({
  totalPnL,
  winRate,
  totalWagered,
  totalWon,
  activeBets,
  isLoading,
}: PnLSummaryProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return <PnLSummarySkeleton />
  }

  const isProfitable = totalPnL > 0n
  const isLoss = totalPnL < 0n

  const getPositionText = () => {
    if (activeBets === 0) return t('dashboard.pnlSummary.noActivePositions')
    if (activeBets === 1) return t('dashboard.pnlSummary.onePosition')
    return t('dashboard.pnlSummary.positions', { count: activeBets })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Total P&L Card */}
      <Card className={isProfitable ? 'border-success/50' : isLoss ? 'border-destructive/50' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.pnlSummary.totalPnL')}</CardTitle>
          {isProfitable ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : isLoss ? (
            <TrendingDown className="h-4 w-4 text-destructive" />
          ) : null}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              isProfitable ? 'text-success' : isLoss ? 'text-destructive' : 'text-foreground'
            }`}
          >
            {formatPnL(totalPnL)}
          </div>
        </CardContent>
      </Card>

      {/* Win Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.pnlSummary.winRate')}</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {winRate >= 50 ? t('dashboard.pnlSummary.aboveAverage') : t('dashboard.pnlSummary.belowAverage')}
          </p>
        </CardContent>
      </Card>

      {/* Total Wagered Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.pnlSummary.totalWagered')}</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatAmount(totalWagered)}</div>
        </CardContent>
      </Card>

      {/* Total Won Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.pnlSummary.totalWon')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{formatAmount(totalWon)}</div>
        </CardContent>
      </Card>

      {/* Active Bets Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.pnlSummary.activeBets')}</CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeBets}</div>
          <p className="text-xs text-muted-foreground mt-1">{getPositionText()}</p>
        </CardContent>
      </Card>
    </div>
  )
}

function PnLSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
