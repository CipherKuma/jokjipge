'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Market, MarketCategory, MarketStatus } from '@/lib/types/market'

interface UseMarketDetailReturn {
  market: Market | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const POLL_INTERVAL = 30000 // 30 seconds

// API route for subgraph queries (server-side proxy)
const SUBGRAPH_API = '/api/subgraph'

/**
 * Hook to fetch a single market from the subgraph
 * Polls for updates every 30 seconds
 */
export function useMarketDetail(marketId: string): UseMarketDetailReturn {
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMarket = useCallback(async () => {
    if (!marketId) {
      setError('No market ID provided')
      setLoading(false)
      return
    }

    setError(null)

    try {
      const query = `
        query GetMarket($id: ID!) {
          market(id: $id) {
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
          }
        }
      `

      const response = await fetch(SUBGRAPH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { id: marketId } }),
      })

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Subgraph query failed')
      }

      if (result.data?.market) {
        setMarket(mapSubgraphMarket(result.data.market))
      } else {
        setError('Market not found')
        setMarket(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market')
      setMarket(null)
    } finally {
      setLoading(false)
    }
  }, [marketId])

  // Initial fetch and polling
  useEffect(() => {
    setLoading(true)
    fetchMarket()

    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchMarket()
    }, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchMarket])

  return {
    market,
    loading,
    error,
    refetch: fetchMarket,
  }
}

// Map subgraph status to frontend status
function mapStatus(subgraphStatus: string): MarketStatus {
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
  // result is Int: 0=NO, 1=YES, null=unresolved
  const result = data.result as number | null
  const outcome = result === null ? undefined : result === 1

  return {
    id: data.id as string,
    address: data.id as `0x${string}`, // Market ID is the contract address
    question: data.question as string,
    category: data.category as MarketCategory,
    yesPool: BigInt(data.yesPool as string),
    noPool: BigInt(data.noPool as string),
    totalVolume: BigInt(data.totalVolume as string),
    resolutionDate: parseInt(data.resolutionDate as string),
    status: mapStatus(data.status as string),
    creator: data.creator as string,
    createdAt: parseInt(data.createdAt as string),
    resolvedAt: data.resolvedAt ? parseInt(data.resolvedAt as string) : undefined,
    outcome,
  }
}
