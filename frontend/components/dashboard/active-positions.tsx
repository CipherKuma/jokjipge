'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatEther } from 'viem'
import { Clock, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import { getTimeRemaining, getOddsPercentage, type Position, type BetOutcome } from '@/lib/types/market'
import { useTranslation } from '@/lib/i18n'

export interface ActivePositionsProps {
  positions: Position[]
  isLoading?: boolean
}

function getUnrealizedPnL(position: Position): bigint {
  if (!position.currentOdds) return 0n
  // Simplified: compare current odds to entry odds
  const oddsChange = position.currentOdds - position.entryOdds
  const shareValue = (position.shares * BigInt(Math.floor(oddsChange * 1e18))) / BigInt(1e18)
  return shareValue
}

function formatPnL(value: bigint): string {
  const num = Number(formatEther(value))
  const sign = num > 0 ? '+' : ''
  return `${sign}${num.toFixed(4)}`
}

export function ActivePositions({ positions, isLoading }: ActivePositionsProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return <ActivePositionsSkeleton />
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.activePositions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('dashboard.activePositions.noPositions')}</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/markets">{t('dashboard.activePositions.browseMarkets')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.activePositions.titleWithCount', { count: positions.length })}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PositionCard({ position }: { position: Position }) {
  const { t } = useTranslation()
  const { market } = position
  const unrealizedPnL = getUnrealizedPnL(position)
  const isProfitable = unrealizedPnL > 0n
  const isLoss = unrealizedPnL < 0n
  const timeRemaining = getTimeRemaining(market.resolutionDate)
  const currentOdds = getOddsPercentage(market.yesPool, market.noPool)
  const odds = position.outcome === 'yes' ? currentOdds.yes : currentOdds.no

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={position.outcome === 'yes' ? 'default' : 'secondary'}>
            {position.outcome === 'yes' ? t('common.yes').toUpperCase() : t('common.no').toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeRemaining}
          </span>
        </div>
        <p className="font-medium truncate">{market.question}</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>{t('dashboard.activePositions.staked')} {Number(formatEther(position.amount)).toFixed(4)} VERY</span>
          <span>{t('dashboard.activePositions.currentOdds')} {odds}%</span>
          <span>{t('dashboard.activePositions.entry')} {position.entryOdds.toFixed(0)}%</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Unrealized P&L */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t('dashboard.activePositions.unrealizedPnL')}</p>
          <p
            className={`font-semibold flex items-center gap-1 ${
              isProfitable ? 'text-success' : isLoss ? 'text-destructive' : ''
            }`}
          >
            {isProfitable ? (
              <TrendingUp className="h-4 w-4" />
            ) : isLoss ? (
              <TrendingDown className="h-4 w-4" />
            ) : null}
            {formatPnL(unrealizedPnL)} VERY
          </p>
        </div>

        {/* View Market Link */}
        <Button asChild variant="ghost" size="icon">
          <Link href={`/markets/${market.id}`}>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function ActivePositionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
