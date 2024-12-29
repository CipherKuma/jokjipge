'use client'

import { useAccount } from '@/lib/web3'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConnectButton } from '@/lib/web3'
import { PnLSummary, ActivePositions, BetHistory, ClaimableWinnings } from '@/components/dashboard'
import { useUserPositions } from '@/hooks/use-user-positions'
import type { ClaimablePosition } from '@/components/dashboard/claimable-winnings'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { Address } from 'viem'
import { useTranslation } from '@/lib/i18n'

export default function MyBetsPage() {
  const { t } = useTranslation()
  const { isConnected, address } = useAccount()
  const { stats, positions, bets, claimable, isLoading, error, refetch } = useUserPositions()

  // Not connected state
  if (!isConnected) {
    return (
      <main className="p-6">
        <div className="max-w-md mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-4">{t('myBets.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('myBets.description')}</p>
          <ConnectButton />
        </div>
      </main>
    )
  }

  // Error state
  if (error) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('myBets.title')}</h1>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('common.retry')}
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    )
  }

  // Calculate win rate
  const winRate =
    stats && stats.totalBets > 0
      ? (stats.winCount / stats.totalBets) * 100
      : 0

  // Map claimable positions with market addresses
  // Uses claimedAmount from contract-based winnings check
  const claimableWithAddresses: ClaimablePosition[] = claimable.map((p) => ({
    id: p.id,
    marketId: p.marketId,
    marketAddress: p.market.address || (p.marketId as Address),
    question: p.market.question,
    outcome: p.outcome,
    amount: p.amount,
    winnings: p.claimedAmount || p.shares, // Use contract winnings if available
  }))

  return (
    <main className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('myBets.title')}</h1>
          <p className="text-muted-foreground">{t('myBets.trackPositions')}</p>
        </div>
        <Button variant="outline" onClick={refetch} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* P&L Summary Cards */}
      <div className="mb-8">
        <PnLSummary
          totalPnL={stats?.pnl || 0n}
          winRate={winRate}
          totalWagered={stats?.totalWagered || 0n}
          totalWon={stats?.totalWon || 0n}
          activeBets={positions.length}
          isLoading={isLoading}
        />
      </div>

      {/* Claimable Winnings */}
      {claimableWithAddresses.length > 0 && (
        <div className="mb-8">
          <ClaimableWinnings
            positions={claimableWithAddresses}
            isLoading={isLoading}
            onClaimed={refetch}
          />
        </div>
      )}

      {/* Active Positions */}
      <div className="mb-8">
        <ActivePositions positions={positions} isLoading={isLoading} />
      </div>

      {/* Bet History */}
      <div>
        <BetHistory bets={bets} isLoading={isLoading} />
      </div>
    </main>
  )
}
