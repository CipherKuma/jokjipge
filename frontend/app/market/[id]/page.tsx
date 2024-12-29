'use client'

import { useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { OddsPanel, BetForm, OrderBook } from '@/components/markets'
import type { OrderBookHandle, OptimisticBet } from '@/components/markets'
import { useMarketDetail } from '@/lib/hooks/use-market-detail'
import { useReadContract } from '@/lib/web3'
import { PredictionMarketABI } from '@/lib/web3/abis/PredictionMarket'
import { getTimeRemaining } from '@/lib/types/market'
import { Clock, AlertCircle, Users } from 'lucide-react'
import type { BetOutcome } from '@/lib/types/market'
import type { Address } from 'viem'

// Precision for odds (1e18)
const PRECISION = BigInt('1000000000000000000')

export default function MarketDetailPage() {
  const params = useParams()
  const marketId = params.id as string

  const { market, loading, error, refetch } = useMarketDetail(marketId)
  const [selectedOutcome, setSelectedOutcome] = useState<BetOutcome | null>(null)
  const orderBookRef = useRef<OrderBookHandle>(null)

  // Fetch odds from contract
  const marketAddress = market?.address as Address | undefined
  const { data: oddsData, refetch: refetchOdds } = useReadContract<[bigint, bigint]>({
    address: marketAddress ?? '0x0',
    abi: PredictionMarketABI,
    functionName: 'getOdds',
    args: [],
    watch: true,
  })

  const yesOdds = oddsData?.[0] ?? PRECISION / 2n
  const noOdds = oddsData?.[1] ?? PRECISION / 2n

  const handleRefresh = useCallback(() => {
    refetch()
    refetchOdds()
  }, [refetch, refetchOdds])

  const handleBetPlaced = useCallback(() => {
    handleRefresh()
  }, [handleRefresh])

  const handleOptimisticBet = useCallback((bet: OptimisticBet) => {
    orderBookRef.current?.addOptimisticBet(bet)
  }, [])

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <div className="lg:col-span-1">
                <Skeleton className="h-[500px] w-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Error state
  if (error || !market) {
    return (
      <main className="min-h-screen bg-background">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Market not found'}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </main>
    )
  }

  const timeRemaining = getTimeRemaining(market.resolutionDate)
  const isActive = market.status === 'active'

  return (
    <main className="min-h-screen bg-background">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Market Info & Betting */}
            <div className="lg:col-span-2 space-y-6">
              {/* Market Info Card */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl leading-tight">
                      {market.question}
                    </CardTitle>
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                      {market.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Badge variant="outline" className="capitalize">
                        {market.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Ends: {timeRemaining}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        Creator: {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Odds Panel */}
              <OddsPanel
                yesPool={market.yesPool}
                noPool={market.noPool}
                yesOdds={yesOdds}
                noOdds={noOdds}
                onSelectOutcome={setSelectedOutcome}
                selectedOutcome={selectedOutcome ?? undefined}
              />

              {/* Bet Form */}
              {isActive ? (
                <BetForm
                  market={market}
                  selectedOutcome={selectedOutcome}
                  yesOdds={yesOdds}
                  noOdds={noOdds}
                  onBetPlaced={handleBetPlaced}
                  onOptimisticBet={handleOptimisticBet}
                />
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      This market is {market.status}. Betting is closed.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Order Book */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <OrderBook ref={orderBookRef} marketId={marketId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
