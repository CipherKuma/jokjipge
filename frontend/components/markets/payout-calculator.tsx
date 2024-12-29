'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calculator, TrendingUp, Coins, Percent } from 'lucide-react'
import { formatEther } from 'viem'
import type { BetOutcome } from '@/lib/types/market'

interface PayoutCalculatorProps {
  betAmount: bigint
  estimatedShares: bigint | null
  selectedOutcome: BetOutcome | null
  currentOdds: bigint | null // Scaled by 1e18
  totalPool: bigint
  isCalculating?: boolean
}

const PRECISION = BigInt('1000000000000000000') // 1e18

export function PayoutCalculator({
  betAmount,
  estimatedShares,
  selectedOutcome,
  currentOdds,
  totalPool,
  isCalculating,
}: PayoutCalculatorProps) {
  // Calculate potential payout using contract formula
  // At resolution: winnings = (userShares * totalPool) / totalWinningShares
  // Estimate: payout ≈ shares * multiplier (where multiplier = 1 / probability)
  const calculatePotentialPayout = (): string => {
    if (!estimatedShares || estimatedShares === 0n || betAmount === 0n) {
      return '0.00'
    }

    // Use shares-based calculation with current odds
    // multiplier = PRECISION / currentOdds represents expected return per share
    if (currentOdds && currentOdds > 0n) {
      // Calculate: payout = (shares * PRECISION) / currentOdds
      // This is equivalent to shares * multiplier
      const payoutBigInt = (estimatedShares * PRECISION) / currentOdds
      const payout = parseFloat(formatEther(payoutBigInt))
      return payout.toFixed(4)
    }

    // Fallback: 50/50 odds = 2x multiplier on shares
    const payout = parseFloat(formatEther(estimatedShares)) * 2
    return payout.toFixed(4)
  }

  // Calculate profit multiplier
  const calculateMultiplier = (): string => {
    if (!currentOdds || currentOdds === 0n) return '1.00'
    const multiplier = Number(PRECISION) / Number(currentOdds)
    return multiplier.toFixed(2)
  }

  // Format shares for display
  const formatShares = (shares: bigint | null): string => {
    if (!shares) return '0.00'
    return parseFloat(formatEther(shares)).toFixed(4)
  }

  // Calculate ROI percentage based on shares vs bet amount
  const calculateROI = (): string => {
    if (betAmount === 0n || !estimatedShares || estimatedShares === 0n) return '0'
    if (!currentOdds || currentOdds === 0n) return '0'

    // Calculate expected payout
    const payoutBigInt = (estimatedShares * PRECISION) / currentOdds
    // ROI = (payout - cost) / cost * 100
    const payout = Number(payoutBigInt)
    const cost = Number(betAmount)
    if (cost === 0) return '0'
    const roi = ((payout - cost) / cost) * 100
    return roi.toFixed(0)
  }

  if (isCalculating) {
    return (
      <Card className="bg-muted/30 border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calculator className="h-4 w-4" />
            <span className="text-sm font-medium">Calculating...</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (betAmount === 0n || !selectedOutcome) {
    return (
      <Card className="bg-muted/30 border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calculator className="h-4 w-4" />
            <span className="text-sm">Enter bet amount to see potential payout</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-muted/30 border-border">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 text-foreground">
          <Calculator className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium">Potential Payout</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Shares */}
          <div className="bg-card rounded-md p-3 border border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Coins className="h-3.5 w-3.5" />
              <span className="text-xs">Shares</span>
            </div>
            <span className="text-lg font-semibold text-foreground">
              {formatShares(estimatedShares)}
            </span>
          </div>

          {/* Multiplier */}
          <div className="bg-card rounded-md p-3 border border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs">Multiplier</span>
            </div>
            <span className="text-lg font-semibold text-foreground">
              {calculateMultiplier()}x
            </span>
          </div>
        </div>

        {/* Payout summary */}
        <div className="bg-card rounded-md p-3 border border-border">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">
                If {selectedOutcome.toUpperCase()} wins
              </div>
              <div className="text-xl font-bold text-success">
                {calculatePotentialPayout()} VERY
              </div>
            </div>
            <div className="flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded">
              <Percent className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">+{calculateROI()}%</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground">
          Actual payout depends on final pool distribution at market resolution.
        </p>
      </CardContent>
    </Card>
  )
}
