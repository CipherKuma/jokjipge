'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePublicClient, useAccount } from '@/lib/web3'
import { PredictionMarketABI } from '@/lib/web3/abis/PredictionMarket'
import type { Address } from 'viem'
import type { MarketContractInfo, UserContractPosition } from '@/lib/types/market'

interface UseMarketContractReturn {
  marketInfo: MarketContractInfo | null
  position: UserContractPosition | null
  odds: { yesOdds: bigint; noOdds: bigint } | null
  totalBets: { yesTotal: bigint; noTotal: bigint } | null
  isLoading: boolean
  error: string | null
  refetch: () => void
  calculateShares: (outcome: number, amount: bigint) => Promise<bigint | null>
  calculateWinnings: () => Promise<bigint | null>
}

export function useMarketContract(marketAddress: Address | null): UseMarketContractReturn {
  const { publicClient } = usePublicClient()
  const { address: userAddress } = useAccount()
  const [marketInfo, setMarketInfo] = useState<MarketContractInfo | null>(null)
  const [position, setPosition] = useState<UserContractPosition | null>(null)
  const [odds, setOdds] = useState<{ yesOdds: bigint; noOdds: bigint } | null>(null)
  const [totalBets, setTotalBets] = useState<{ yesTotal: bigint; noTotal: bigint } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const fetchMarketData = useCallback(async () => {
    if (!publicClient || !marketAddress) {
      setMarketInfo(null)
      setPosition(null)
      setOdds(null)
      setTotalBets(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch market info
      const info = await publicClient.readContract({
        address: marketAddress,
        abi: PredictionMarketABI,
        functionName: 'getMarketInfo',
      }) as MarketContractInfo

      setMarketInfo(info)

      // Fetch odds
      const [yesOdds, noOdds] = await publicClient.readContract({
        address: marketAddress,
        abi: PredictionMarketABI,
        functionName: 'getOdds',
      }) as [bigint, bigint]

      setOdds({ yesOdds, noOdds })

      // Fetch total bets
      const [yesTotal, noTotal] = await publicClient.readContract({
        address: marketAddress,
        abi: PredictionMarketABI,
        functionName: 'getTotalBets',
      }) as [bigint, bigint]

      setTotalBets({ yesTotal, noTotal })

      // Fetch user position if connected
      if (userAddress) {
        const pos = await publicClient.readContract({
          address: marketAddress,
          abi: PredictionMarketABI,
          functionName: 'getPosition',
          args: [userAddress],
        }) as UserContractPosition

        setPosition(pos)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch market data'
      setError(errorMsg)
      console.error('Market fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [publicClient, marketAddress, userAddress])

  useEffect(() => {
    fetchMarketData()
  }, [fetchMarketData, refetchTrigger])

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1)
  }, [])

  const calculateShares = useCallback(
    async (outcome: number, amount: bigint): Promise<bigint | null> => {
      if (!publicClient || !marketAddress) return null

      try {
        const shares = await publicClient.readContract({
          address: marketAddress,
          abi: PredictionMarketABI,
          functionName: 'calculateShares',
          args: [outcome, amount],
        }) as bigint

        return shares
      } catch (err) {
        console.error('Calculate shares error:', err)
        return null
      }
    },
    [publicClient, marketAddress]
  )

  const calculateWinnings = useCallback(async (): Promise<bigint | null> => {
    if (!publicClient || !marketAddress || !userAddress) return null

    try {
      const winnings = await publicClient.readContract({
        address: marketAddress,
        abi: PredictionMarketABI,
        functionName: 'calculateWinnings',
        args: [userAddress],
      }) as bigint

      return winnings
    } catch (err) {
      console.error('Calculate winnings error:', err)
      return null
    }
  }, [publicClient, marketAddress, userAddress])

  return {
    marketInfo,
    position,
    odds,
    totalBets,
    isLoading,
    error,
    refetch,
    calculateShares,
    calculateWinnings,
  }
}
