'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  GET_LEADERBOARD,
  GET_GLOBAL_STATS,
  type LeaderboardUser,
  type GlobalStats,
} from '@/lib/graphql/queries/leaderboard'

// API route for subgraph queries (server-side proxy)
const SUBGRAPH_API = '/api/subgraph'

export type SortBy = 'pnl' | 'winCount' | 'totalWagered' | 'totalBets'

export interface LeaderboardEntry {
  rank: number
  address: string
  totalBets: number
  totalWagered: bigint
  totalWon: bigint
  pnl: bigint
  winCount: number
  winRate: number
  roi: number
}

export interface LeaderboardStats {
  totalUsers: number
  totalVolume: bigint
  totalBets: number
  activeMarkets: number
}

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[]
  stats: LeaderboardStats
  loading: boolean
  error: string | null
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  refetch: () => Promise<void>
  hasMore: boolean
  loadMore: () => Promise<void>
}

const ENTRIES_PER_PAGE = 20

export function useLeaderboard(): UseLeaderboardReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<LeaderboardStats>({
    totalUsers: 0,
    totalVolume: 0n,
    totalBets: 0,
    activeMarkets: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('pnl')
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const mapToEntry = useCallback(
    (user: LeaderboardUser, index: number, baseRank: number): LeaderboardEntry => {
      const totalBets = parseInt(user.totalBets)
      const winCount = parseInt(user.winCount)
      const totalWagered = BigInt(user.totalWagered)
      const pnl = BigInt(user.pnl)

      // Calculate win rate (wins / total bets * 100)
      const winRate = totalBets > 0 ? (winCount / totalBets) * 100 : 0

      // Calculate ROI (pnl / totalWagered * 100)
      let roi = 0
      if (totalWagered > 0n) {
        roi = Number((pnl * 10000n) / totalWagered) / 100
      }

      return {
        rank: baseRank + index + 1,
        address: user.id,
        totalBets,
        totalWagered,
        totalWon: BigInt(user.totalWon),
        pnl,
        winCount,
        winRate,
        roi,
      }
    },
    []
  )

  const fetchLeaderboard = useCallback(
    async (resetPagination = true) => {
      if (resetPagination) {
        setSkip(0)
        setLoading(true)
      }
      setError(null)

      try {
        const currentSkip = resetPagination ? 0 : skip

        // Map sortBy to subgraph field
        const orderByMap: Record<SortBy, string> = {
          pnl: 'pnl',
          winCount: 'winCount',
          totalWagered: 'totalWagered',
          totalBets: 'totalBets',
        }

        const [leaderboardRes, statsRes] = await Promise.all([
          fetch(SUBGRAPH_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: GET_LEADERBOARD,
              variables: {
                first: ENTRIES_PER_PAGE,
                skip: currentSkip,
                orderBy: orderByMap[sortBy],
                orderDirection: 'desc',
              },
            }),
          }),
          fetch(SUBGRAPH_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: GET_GLOBAL_STATS }),
          }),
        ])

        const [leaderboardData, statsData] = await Promise.all([
          leaderboardRes.json(),
          statsRes.json(),
        ])

        if (leaderboardData.errors) {
          throw new Error(leaderboardData.errors[0]?.message || 'Failed to fetch leaderboard')
        }

        const users: LeaderboardUser[] = leaderboardData.data?.users || []
        const globalStats: GlobalStats | null = statsData.data?.globalStats

        const mappedEntries = users.map((user, index) =>
          mapToEntry(user, index, currentSkip)
        )

        if (resetPagination) {
          setEntries(mappedEntries)
        } else {
          setEntries((prev) => [...prev, ...mappedEntries])
        }

        if (globalStats) {
          setStats({
            totalUsers: mappedEntries.length + (resetPagination ? 0 : entries.length),
            totalVolume: BigInt(globalStats.totalVolume),
            totalBets: parseInt(globalStats.totalBets),
            activeMarkets: parseInt(globalStats.activeMarkets),
          })
        }

        setHasMore(users.length === ENTRIES_PER_PAGE)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard')
        if (resetPagination) {
          setEntries([])
          setStats({ totalUsers: 0, totalVolume: 0n, totalBets: 0, activeMarkets: 0 })
        }
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    },
    [sortBy, skip, mapToEntry, entries.length]
  )

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    setSkip((prev) => prev + ENTRIES_PER_PAGE)
    await fetchLeaderboard(false)
  }, [hasMore, loading, fetchLeaderboard])

  useEffect(() => {
    fetchLeaderboard(true)
  }, [sortBy])

  return {
    entries,
    stats,
    loading,
    error,
    sortBy,
    setSortBy,
    refetch: () => fetchLeaderboard(true),
    hasMore,
    loadMore,
  }
}
