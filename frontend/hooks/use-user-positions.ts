'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, usePublicClient } from '@/lib/web3'
import { getSubgraphEndpoint, hasSubgraph } from '@/constants/subgraphs'
import {
  GET_USER_POSITIONS,
  GET_USER_BETS,
  GET_RESOLVED_UNCLAIMED_POSITIONS,
  type SubgraphUser,
  type SubgraphPosition,
} from '@/lib/graphql/queries/user'
import type { Position, Bet, UserStats, BetOutcome, Market, MarketStatus } from '@/lib/types/market'
import type { Address } from 'viem'

// Contract ABIs for reading position data
const MARKET_ABI = [
  {
    name: 'calculateWinnings',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'winnings', type: 'uint256' }],
  },
  {
    name: 'getPosition',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'yesShares', type: 'uint256' },
        { name: 'noShares', type: 'uint256' },
        { name: 'claimed', type: 'bool' },
      ],
    }],
  },
  {
    name: 'getMarketInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'question', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'resolutionTime', type: 'uint256' },
        { name: 'resolved', type: 'bool' },
        { name: 'winningOutcome', type: 'uint8' },
        { name: 'totalYesShares', type: 'bigint' },
        { name: 'totalNoShares', type: 'bigint' },
        { name: 'totalPool', type: 'bigint' },
      ],
    }],
  },
] as const

interface ContractPosition {
  yesShares: bigint
  noShares: bigint
  claimed: boolean
}

const CHAIN_ID = 4613 // VeryChain Mainnet

interface UseUserPositionsReturn {
  stats: UserStats | null
  positions: Position[]
  bets: Bet[]
  claimable: Position[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// Convert subgraph outcome (0=NO, 1=YES) to BetOutcome ('yes' | 'no')
function toOutcome(outcome: number): BetOutcome {
  return outcome === 1 ? 'yes' : 'no'
}

function mapSubgraphPosition(sp: SubgraphPosition): Position {
  const yesPool = BigInt(sp.market.yesPool ?? '0')
  const noPool = BigInt(sp.market.noPool ?? '0')

  return {
    id: sp.id,
    marketId: sp.market.id,
    market: {
      id: sp.market.id,
      question: sp.market.question ?? '',
      status: (sp.market.status as MarketStatus) ?? 'active',
      resolutionDate: parseInt(sp.market.resolutionDate || '0'),
      yesPool,
      noPool,
      totalVolume: yesPool + noPool,
      category: 'other',
      creator: '',
      createdAt: 0,
      outcome: sp.market.result !== null ? (sp.market.result === 1) : undefined,
    } as Market,
    outcome: toOutcome(sp.outcome),
    amount: BigInt(sp.amount ?? '0'),
    shares: BigInt(sp.shares ?? '0'),
    entryOdds: 50, // TODO: Calculate from historical data
    claimed: sp.claimed ?? false,
    claimedAmount: sp.claimedAmount ? BigInt(sp.claimedAmount) : undefined,
    createdAt: sp.createdAt ? parseInt(sp.createdAt) : 0,
  }
}

function mapSubgraphPositionToBet(sp: SubgraphPosition): Bet {
  const position = mapSubgraphPosition(sp)
  let result: 'won' | 'lost' | 'pending' = 'pending'

  if (sp.market.status === 'RESOLVED' && sp.market.result !== null) {
    // sp.outcome: 0=NO, 1=YES; sp.market.result: 0=NO, 1=YES
    result = sp.market.result === sp.outcome ? 'won' : 'lost'
  }

  return { ...position, result }
}

async function fetchSubgraph(query: string, variables: Record<string, unknown>): Promise<unknown> {
  if (!hasSubgraph(CHAIN_ID, 'predictionmarket')) {
    throw new Error('Subgraph not configured')
  }

  const endpoint = getSubgraphEndpoint(CHAIN_ID, 'predictionmarket')
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error('Subgraph request failed')
  }

  const json = await response.json()
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'Subgraph query error')
  }

  return json.data
}

export function useUserPositions(): UseUserPositionsReturn {
  const { address, isConnected } = useAccount()
  const { publicClient } = usePublicClient()

  const [stats, setStats] = useState<UserStats | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [claimable, setClaimable] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!address || !isConnected) {
      setStats(null)
      setPositions([])
      setBets([])
      setClaimable([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const userId = address.toLowerCase()

      // Fetch user positions and stats from subgraph
      const positionsData = (await fetchSubgraph(GET_USER_POSITIONS, { userId })) as {
        user: SubgraphUser | null
      }

      // Fetch bet history from subgraph
      const betsData = (await fetchSubgraph(GET_USER_BETS, { userId, first: 50, skip: 0 })) as {
        bets: SubgraphPosition[]
      }

      // Fetch resolved positions for verification
      const resolvedData = await fetchSubgraph(GET_RESOLVED_UNCLAIMED_POSITIONS, { userId }) as {
        positions: SubgraphPosition[]
      }

      // Build contract-verified data for resolved markets
      const contractDataMap = new Map<string, { position: ContractPosition; winnings: bigint }>()

      if (publicClient) {
        // Get all resolved market addresses from both positions AND bets
        const resolvedFromPositions = resolvedData.positions.map(p => p.market.id.toLowerCase())
        const resolvedFromBets = betsData.bets
          .filter(b => b.market.status === 'RESOLVED')
          .map(b => b.market.id.toLowerCase())

        const allResolvedMarkets = [...new Set([...resolvedFromPositions, ...resolvedFromBets])]

        for (const marketAddr of allResolvedMarkets) {
          try {
            const [position, winnings] = await Promise.all([
              publicClient.readContract({
                address: marketAddr as Address,
                abi: MARKET_ABI,
                functionName: 'getPosition',
                args: [address],
              }) as Promise<ContractPosition>,
              publicClient.readContract({
                address: marketAddr as Address,
                abi: MARKET_ABI,
                functionName: 'calculateWinnings',
                args: [address],
              }) as Promise<bigint>,
            ])
            contractDataMap.set(marketAddr, { position, winnings })
          } catch (e) {
            console.warn(`Failed to get contract data for ${marketAddr}:`, e)
          }
        }
      }

      // Calculate accurate stats using contract data
      let totalWon = 0n
      let pnl = 0n
      let winCount = 0
      let lossCount = 0
      const totalWagered = BigInt(positionsData.user?.totalWagered || '0')
      const totalBets = parseInt(positionsData.user?.totalBets || '0')

      // Track already-processed markets for stats calculation
      const processedMarkets = new Set<string>()

      // Process bets with contract-verified data
      const processedBets: Bet[] = betsData.bets.map(sp => {
        const mapped = mapSubgraphPosition(sp)
        let result: 'won' | 'lost' | 'pending' = 'pending'

        if (sp.market.status === 'RESOLVED' && sp.market.result !== null) {
          const marketResult = sp.market.result // 0=NO, 1=YES

          // Determine win/loss based on bet outcome vs market result
          // sp.outcome: 0=NO, 1=YES; marketResult: 0=NO won, 1=YES won
          const betWon = sp.outcome === marketResult
          result = betWon ? 'won' : 'lost'

          // Get contract data for this market
          const contractData = contractDataMap.get(sp.market.id.toLowerCase())

          if (contractData) {
            const { position: contractPos } = contractData
            const userYesShares = contractPos.yesShares
            const userNoShares = contractPos.noShares
            const totalUserBet = userYesShares + userNoShares

            // For winning bets that have been claimed, set claimedAmount
            // to the total pool (user was sole bettor, got everything back)
            if (betWon && contractPos.claimed) {
              mapped.claimedAmount = totalUserBet
            }

            // Calculate stats from contract data (only once per market)
            if (!processedMarkets.has(sp.market.id.toLowerCase())) {
              processedMarkets.add(sp.market.id.toLowerCase())

              if (contractPos.claimed) {
                // User claimed winnings
                totalWon += totalUserBet
                // P&L = 0 for sole bettor who got entire pool back
                winCount++
              } else {
                // Not claimed yet - losses are pending
                const losingShares = marketResult === 1 ? userNoShares : userYesShares
                pnl -= losingShares
                if (losingShares > 0n) lossCount++
              }
            }
          }
        }

        return { ...mapped, result }
      })

      // Update positions list (only unclaimed from non-resolved markets)
      const activePositions = positionsData.user?.positions
        .filter(p => p.market.status !== 'RESOLVED')
        .map(mapSubgraphPosition) || []

      // Build claimable list from contract-verified data
      const claimableWithWinnings: Position[] = []
      for (const sp of resolvedData.positions) {
        const contractData = contractDataMap.get(sp.market.id.toLowerCase())
        if (contractData && !contractData.position.claimed && contractData.winnings > 0n) {
          const mapped = mapSubgraphPosition(sp)
          mapped.claimedAmount = contractData.winnings
          claimableWithWinnings.push(mapped)
        }
      }

      // Set final stats
      setStats({
        totalBets,
        totalWagered,
        totalWon,
        pnl,
        winCount,
        lossCount,
      })
      setPositions(activePositions)
      setBets(processedBets)
      setClaimable(claimableWithWinnings)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
      console.error('Error fetching user positions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, publicClient])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    stats,
    positions,
    bets,
    claimable,
    isLoading,
    error,
    refetch: fetchData,
  }
}
