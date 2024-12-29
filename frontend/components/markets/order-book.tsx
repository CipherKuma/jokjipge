'use client'

import { useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getSubgraphEndpoint, hasSubgraph } from '@/constants/subgraphs'
import { formatEther } from 'viem'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface Bet {
  id: string
  user: string
  outcome: number // 0=NO, 1=YES
  amount: bigint
  shares: bigint
  createdAt: number
}

export interface OrderBookHandle {
  addOptimisticBet: (bet: Bet) => void
}

interface OrderBookProps {
  marketId: string
}

const CHAIN_ID = 4613 // VeryChain Mainnet
const POLL_INTERVAL = 10000 // 10 seconds

export const OrderBook = forwardRef<OrderBookHandle, OrderBookProps>(
  function OrderBook({ marketId }, ref) {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const subgraphUrl = hasSubgraph(CHAIN_ID, 'predictionmarket')
    ? getSubgraphEndpoint(CHAIN_ID, 'predictionmarket')
    : null

  // Expose addOptimisticBet method via ref
  useImperativeHandle(ref, () => ({
    addOptimisticBet: (bet: Bet) => {
      setBets((prev) => [bet, ...prev])
    },
  }))

  const fetchBets = useCallback(async () => {
    if (!subgraphUrl || !marketId) return

    try {
      const query = `
        query GetMarketBets($marketId: ID!) {
          bets(
            where: { market: $marketId }
            orderBy: createdAt
            orderDirection: desc
            first: 50
          ) {
            id
            user { id }
            outcome
            amount
            shares
            createdAt
          }
        }
      `

      const response = await fetch(subgraphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { marketId } }),
      })

      const result = await response.json()

      if (result.data?.bets) {
        setBets(result.data.bets.map((bet: Record<string, unknown>) => ({
          id: bet.id as string,
          user: (bet.user as { id: string }).id,
          outcome: bet.outcome as number,
          amount: BigInt(bet.amount as string),
          shares: BigInt(bet.shares as string),
          createdAt: parseInt(bet.createdAt as string),
        })))
      }
    } catch (err) {
      console.error('Failed to fetch bets:', err)
    } finally {
      setLoading(false)
    }
  }, [subgraphUrl, marketId])

  useEffect(() => {
    fetchBets()
    intervalRef.current = setInterval(fetchBets, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchBets])

  const formatTime = (timestamp: number): string => {
    const now = Date.now() / 1000
    const diff = now - timestamp
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const formatAmount = (amount: bigint): string => {
    const value = parseFloat(formatEther(amount))
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    if (value >= 1) return value.toFixed(2)
    return value.toFixed(4)
  }

  // Separate YES and NO bets
  const yesBets = bets.filter(b => b.outcome === 1)
  const noBets = bets.filter(b => b.outcome === 0)

  if (loading) {
    return (
      <Card className="bg-card border-border h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Order Book</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order Book</CardTitle>
          <Badge variant="outline" className="text-xs">
            {bets.length} bets
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* YES Bets (Buy side) */}
        <div className="border-b border-border">
          <div className="px-4 py-2 bg-success/5 border-b border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-success font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> YES
              </span>
              <span className="text-muted-foreground">
                {yesBets.length} orders
              </span>
            </div>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="px-2 py-1">
              {yesBets.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No YES bets yet
                </p>
              ) : (
                yesBets.slice(0, 15).map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between py-1.5 px-2 hover:bg-success/5 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span className="text-muted-foreground font-mono">
                        {bet.user.slice(0, 6)}...{bet.user.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-success">
                        {formatAmount(bet.amount)} VERY
                      </span>
                      <span className="text-muted-foreground w-14 text-right">
                        {formatTime(bet.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* NO Bets (Sell side) */}
        <div>
          <div className="px-4 py-2 bg-destructive/5 border-b border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-destructive font-medium flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> NO
              </span>
              <span className="text-muted-foreground">
                {noBets.length} orders
              </span>
            </div>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="px-2 py-1">
              {noBets.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No NO bets yet
                </p>
              ) : (
                noBets.slice(0, 15).map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between py-1.5 px-2 hover:bg-destructive/5 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      <span className="text-muted-foreground font-mono">
                        {bet.user.slice(0, 6)}...{bet.user.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-destructive">
                        {formatAmount(bet.amount)} VERY
                      </span>
                      <span className="text-muted-foreground w-14 text-right">
                        {formatTime(bet.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
})
