'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatEther } from 'viem'
import type { BetOutcome } from '@/lib/types/market'

interface OddsPanelProps {
  yesPool: bigint
  noPool: bigint
  yesOdds: bigint // Scaled by 1e18
  noOdds: bigint // Scaled by 1e18
  onSelectOutcome: (outcome: BetOutcome) => void
  selectedOutcome?: BetOutcome
  isLoading?: boolean
}

const PRECISION = BigInt('1000000000000000000') // 1e18

export function OddsPanel({
  yesPool,
  noPool,
  yesOdds,
  noOdds,
  onSelectOutcome,
  selectedOutcome,
  isLoading,
}: OddsPanelProps) {
  // Calculate implied probability percentages
  const total = yesPool + noPool
  const yesPercent = total > 0n ? Number((yesPool * 100n) / total) : 50
  const noPercent = 100 - yesPercent

  // Format odds for display (convert from 1e18 scale to decimal)
  const formatOdds = (odds: bigint): string => {
    const decimal = Number(odds) / Number(PRECISION)
    return (1 / decimal).toFixed(2)
  }

  // Format pool amount (note: pool values are shares, not raw VERY amounts)
  const formatPool = (pool: bigint): string => {
    const value = parseFloat(formatEther(pool))
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return value.toFixed(2)
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Current Odds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Current Odds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outcome buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Yes button */}
          <Button
            variant={selectedOutcome === 'yes' ? 'default' : 'outline'}
            onClick={() => onSelectOutcome('yes')}
            className={`h-auto py-4 flex flex-col gap-1 ${
              selectedOutcome === 'yes'
                ? 'bg-success text-success-foreground hover:bg-success/90 border-success'
                : 'border-border hover:border-success/50 hover:bg-success/10'
            }`}
          >
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">Yes</span>
            </div>
            <span className="text-2xl font-bold">{yesPercent}%</span>
            <span className="text-xs opacity-80">
              {formatPool(yesPool)} shares
            </span>
          </Button>

          {/* No button */}
          <Button
            variant={selectedOutcome === 'no' ? 'default' : 'outline'}
            onClick={() => onSelectOutcome('no')}
            className={`h-auto py-4 flex flex-col gap-1 ${
              selectedOutcome === 'no'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive'
                : 'border-border hover:border-destructive/50 hover:bg-destructive/10'
            }`}
          >
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              <span className="font-semibold">No</span>
            </div>
            <span className="text-2xl font-bold">{noPercent}%</span>
            <span className="text-xs opacity-80">
              {formatPool(noPool)} shares
            </span>
          </Button>
        </div>

        {/* Odds bar visualization */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
            <div
              className="h-full bg-success transition-all duration-300"
              style={{ width: `${yesPercent}%` }}
            />
            <div
              className="h-full bg-destructive transition-all duration-300"
              style={{ width: `${noPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Odds: {formatOdds(yesOdds)}x</span>
            <span>Odds: {formatOdds(noOdds)}x</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
