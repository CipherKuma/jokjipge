'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ActivityItem,
  ActivityType,
  ActivityFeedState,
  TrendingMarket,
  TrendingMarketsState,
  EndingSoonMarket,
  EndingSoonState,
} from './types'

const POLL_INTERVAL = 10000 // 10 seconds
const MAX_ITEMS = 20

// GraphQL queries
const RECENT_ACTIVITY_QUERY = `
  query GetRecentActivity($first: Int!) {
    betEvents(orderBy: timestamp, orderDirection: desc, first: $first) {
      id
      user
      market
      outcome
      amount
      timestamp
    }
    marketEvents(orderBy: timestamp, orderDirection: desc, first: $first) {
      id
      eventType
      market
      timestamp
    }
  }
`

const TRENDING_MARKETS_QUERY = `
  query GetTrendingMarkets {
    markets(where: { status: "OPEN" }, orderBy: totalVolume, orderDirection: desc, first: 5) {
      id
      question
      totalVolume
      yesPool
      noPool
      resolutionDate
    }
  }
`

const ENDING_SOON_QUERY = `
  query GetEndingSoon($deadline: BigInt!) {
    markets(
      where: { status: "OPEN", resolutionDate_lt: $deadline }
      orderBy: resolutionDate
      orderDirection: asc
      first: 5
    ) {
      id
      question
      resolutionDate
      yesPool
      noPool
    }
  }
`

interface UseActivityFeedOptions {
  subgraphUrl?: string
  pollInterval?: number
  maxItems?: number
}

async function fetchGraphQL(url: string, query: string, variables: Record<string, any> = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`)
  }

  const result = await response.json()
  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL error')
  }

  return result.data
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { subgraphUrl, pollInterval = POLL_INTERVAL, maxItems = MAX_ITEMS } = options

  const [state, setState] = useState<ActivityFeedState>({
    items: [],
    loading: true,
    error: null,
  })

  const previousIdsRef = useRef<Set<string>>(new Set())

  const fetchActivity = useCallback(async () => {
    if (!subgraphUrl) {
      setState({ items: [], loading: false, error: 'No subgraph URL configured' })
      return
    }

    try {
      const data = await fetchGraphQL(subgraphUrl, RECENT_ACTIVITY_QUERY, { first: maxItems })

      const items: ActivityItem[] = []

      // Process bet events
      if (data.betEvents) {
        for (const event of data.betEvents) {
          items.push({
            id: event.id,
            type: 'BET' as ActivityType,
            user: event.user,
            market: { id: event.market, question: '' },
            outcome: event.outcome,
            amount: BigInt(event.amount || '0'),
            timestamp: Number(event.timestamp),
          })
        }
      }

      // Process market events
      if (data.marketEvents) {
        for (const event of data.marketEvents) {
          const type = event.eventType === 'CREATED' ? 'MARKET_CREATED' : 'MARKET_RESOLVED'
          items.push({
            id: event.id,
            type: type as ActivityType,
            user: '',
            market: { id: event.market, question: '' },
            timestamp: Number(event.timestamp),
          })
        }
      }

      // Sort by timestamp and limit
      items.sort((a, b) => b.timestamp - a.timestamp)
      const limitedItems = items.slice(0, maxItems)

      // Mark new items
      const newIds = new Set(limitedItems.map((item) => item.id))
      previousIdsRef.current = newIds

      setState({ items: limitedItems, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch activity',
      }))
    }
  }, [subgraphUrl, maxItems])

  useEffect(() => {
    fetchActivity()
    const interval = setInterval(fetchActivity, pollInterval)
    return () => clearInterval(interval)
  }, [fetchActivity, pollInterval])

  return { ...state, refetch: fetchActivity }
}

export function useTrendingMarkets(options: UseActivityFeedOptions = {}) {
  const { subgraphUrl } = options

  const [state, setState] = useState<TrendingMarketsState>({
    markets: [],
    loading: true,
    error: null,
  })

  const fetchTrending = useCallback(async () => {
    if (!subgraphUrl) {
      setState({ markets: [], loading: false, error: 'No subgraph URL configured' })
      return
    }

    try {
      const data = await fetchGraphQL(subgraphUrl, TRENDING_MARKETS_QUERY)

      const markets: TrendingMarket[] = (data.markets || []).map((m: any) => ({
        id: m.id,
        question: m.question,
        totalVolume: BigInt(m.totalVolume || '0'),
        yesPool: BigInt(m.yesPool || '0'),
        noPool: BigInt(m.noPool || '0'),
        resolutionDate: Number(m.resolutionDate),
        betCount: 0,
      }))

      setState({ markets, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch trending',
      }))
    }
  }, [subgraphUrl])

  useEffect(() => {
    fetchTrending()
    const interval = setInterval(fetchTrending, 30000)
    return () => clearInterval(interval)
  }, [fetchTrending])

  return { ...state, refetch: fetchTrending }
}

export function useEndingSoon(options: UseActivityFeedOptions = {}) {
  const { subgraphUrl } = options

  const [state, setState] = useState<EndingSoonState>({
    markets: [],
    loading: true,
    error: null,
  })

  const fetchEndingSoon = useCallback(async () => {
    if (!subgraphUrl) {
      setState({ markets: [], loading: false, error: 'No subgraph URL configured' })
      return
    }

    try {
      const deadline = Math.floor(Date.now() / 1000) + 24 * 60 * 60
      const data = await fetchGraphQL(subgraphUrl, ENDING_SOON_QUERY, {
        deadline: deadline.toString(),
      })

      const markets: EndingSoonMarket[] = (data.markets || []).map((m: any) => {
        const yesPool = BigInt(m.yesPool || '0')
        const noPool = BigInt(m.noPool || '0')
        const total = yesPool + noPool
        const yesOdds = total > 0n ? Number((yesPool * 100n) / total) : 50
        const noOdds = total > 0n ? Number((noPool * 100n) / total) : 50

        return {
          id: m.id,
          question: m.question,
          resolutionDate: Number(m.resolutionDate),
          yesPool,
          noPool,
          yesOdds,
          noOdds,
        }
      })

      setState({ markets, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ending soon',
      }))
    }
  }, [subgraphUrl])

  useEffect(() => {
    fetchEndingSoon()
    const interval = setInterval(fetchEndingSoon, 60000)
    return () => clearInterval(interval)
  }, [fetchEndingSoon])

  return { ...state, refetch: fetchEndingSoon }
}
