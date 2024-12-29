'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Market, MarketStats, MarketFilter } from '@/lib/types/market'
import { getSubgraphEndpoint, hasSubgraph } from '@/constants/subgraphs'

interface UseMarketsReturn {
  markets: Market[]
  stats: MarketStats
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  hasMore: boolean
  loadMore: () => Promise<void>
}

const MARKETS_PER_PAGE = 12

/**
 * Hook to fetch markets from the subgraph
 * Uses direct fetch following Shinroe's pattern
 */
export function useMarkets(filters: MarketFilter = {}): UseMarketsReturn {
  const [markets, setMarkets] = useState<Market[]>([])
  const [stats, setStats] = useState<MarketStats>({
    totalMarkets: 0,
    totalVolume: 0n,
    activeBets: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Use subgraph constants for VeryChain Mainnet (chainId: 4613)
  const CHAIN_ID = 4613
  const subgraphUrl = hasSubgraph(CHAIN_ID, 'predictionmarket')
    ? getSubgraphEndpoint(CHAIN_ID, 'predictionmarket')
    : null

  const buildWhereClause = useCallback(() => {
    const conditions: string[] = []

    if (filters.category && filters.category !== 'all') {
      conditions.push(`category: "${filters.category}"`)
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'live' || filters.status === 'active') {
        conditions.push('status: "OPEN"')
        conditions.push(`resolutionDate_gt: "${Math.floor(Date.now() / 1000)}"`)
      } else if (filters.status === 'resolved') {
        conditions.push('status: "RESOLVED"')
      }
    }

    if (filters.search) {
      conditions.push(`question_contains_nocase: "${filters.search}"`)
    }

    return conditions.length > 0 ? `where: { ${conditions.join(', ')} }` : ''
  }, [filters])

  const buildOrderBy = useCallback(() => {
    switch (filters.sortBy) {
      case 'volume':
        return 'orderBy: totalVolume, orderDirection: desc'
      case 'endingSoon':
        return 'orderBy: resolutionDate, orderDirection: asc'
      case 'newest':
      default:
        return 'orderBy: createdAt, orderDirection: desc'
    }
  }, [filters.sortBy])

  const fetchMarkets = useCallback(
    async (resetPagination = true) => {
      if (!subgraphUrl) {
        setError('Subgraph not configured')
        setMarkets([])
        setStats({ totalMarkets: 0, totalVolume: 0n, activeBets: 0 })
        setLoading(false)
        setHasMore(false)
        return
      }

      if (resetPagination) {
        setSkip(0)
        setLoading(true)
      }
      setError(null)

      try {
        const currentSkip = resetPagination ? 0 : skip
        const whereClause = buildWhereClause()
        const orderClause = buildOrderBy()

        const query = `
          query GetMarkets {
            markets(
              first: ${MARKETS_PER_PAGE}
              skip: ${currentSkip}
              ${whereClause}
              ${orderClause}
            ) {
              id
              question
              category
              yesPool
              noPool
              totalVolume
              resolutionDate
              status
              creator
              createdAt
              resolvedAt
              result
              bets {
                id
              }
            }
            globalStats(id: "global") {
              totalMarkets
              totalVolume
              totalBets
              activeMarkets
            }
          }
        `

        const response = await fetch(subgraphUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })

        const result = await response.json()

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Subgraph query failed')
        }

        const fetchedMarkets = (result.data?.markets || []).map(mapSubgraphMarket)
        const fetchedStats = result.data?.globalStats

        if (resetPagination) {
          setMarkets(fetchedMarkets)
        } else {
          setMarkets((prev) => [...prev, ...fetchedMarkets])
        }

        if (fetchedStats) {
          setStats({
            totalMarkets: parseInt(fetchedStats.totalMarkets || '0'),
            totalVolume: BigInt(fetchedStats.totalVolume || '0'),
            activeBets: parseInt(fetchedStats.totalBets || '0'),
          })
        }

        setHasMore(fetchedMarkets.length === MARKETS_PER_PAGE)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch markets')
        if (resetPagination) {
          setMarkets([])
          setStats({ totalMarkets: 0, totalVolume: 0n, activeBets: 0 })
        }
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    },
    [subgraphUrl, buildWhereClause, buildOrderBy, skip]
  )

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    setSkip((prev) => prev + MARKETS_PER_PAGE)
    await fetchMarkets(false)
  }, [hasMore, loading, fetchMarkets])

  useEffect(() => {
    fetchMarkets(true)
  }, [filters.category, filters.status, filters.sortBy, filters.search])

  return {
    markets,
    stats,
    loading,
    error,
    refetch: () => fetchMarkets(true),
    hasMore,
    loadMore,
  }
}

// Map subgraph status to frontend status
function mapStatus(subgraphStatus: string): Market['status'] {
  switch (subgraphStatus) {
    case 'OPEN':
      return 'active'
    case 'RESOLVED':
      return 'resolved'
    default:
      return 'pending'
  }
}

// Map subgraph response to Market type
function mapSubgraphMarket(data: Record<string, unknown>): Market {
  // result: 0=NO (false), 1=YES (true) - only valid when status is RESOLVED
  const status = data.status as string
  const result = data.result as number | null
  const isResolved = status === 'RESOLVED'
  const bets = data.bets as Array<{ id: string }> | undefined
  return {
    id: data.id as string,
    question: data.question as string,
    category: data.category as Market['category'],
    yesPool: BigInt(data.yesPool as string),
    noPool: BigInt(data.noPool as string),
    totalVolume: BigInt(data.totalVolume as string),
    resolutionDate: parseInt(data.resolutionDate as string),
    status: mapStatus(status),
    creator: data.creator as string,
    createdAt: parseInt(data.createdAt as string),
    resolvedAt: data.resolvedAt ? parseInt(data.resolvedAt as string) : undefined,
    outcome: isResolved && result !== null ? result === 1 : undefined,
    betCount: bets?.length ?? 0,
  }
}
