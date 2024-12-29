'use client'

import { useCallback, useState } from 'react'
import { useWriteContract, usePublicClient, useAccount, useChainId } from '@/lib/web3'
import { MarketFactoryABI } from '@/lib/web3/abis/MarketFactory'
import { PredictionMarketABI } from '@/lib/web3/abis/PredictionMarket'
import { getContractAddresses } from '@/lib/types/contracts'
import type { Address, Hash } from 'viem'

interface UseMarketFactoryReturn {
  createMarket: (
    question: string,
    category: string,
    resolutionTime: bigint
  ) => Promise<{ hash: Hash; marketId?: bigint; market?: Address }>
  isPending: boolean
  error: Error | null
}

/**
 * Hook for interacting with MarketFactory contract
 */
export function useMarketFactory(): UseMarketFactoryReturn {
  const chainId = useChainId()
  const { writeContract, isPending, error: writeError } = useWriteContract()
  const { publicClient } = usePublicClient()
  const { address, isConnected } = useAccount()
  const [error, setError] = useState<Error | null>(null)

  const createMarket = useCallback(
    async (
      question: string,
      category: string,
      resolutionTime: bigint
    ): Promise<{ hash: Hash; marketId?: bigint; market?: Address }> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected')
      }

      if (!chainId) {
        throw new Error('No chain ID available')
      }
      const addresses = getContractAddresses(chainId)
      if (!addresses) {
        throw new Error(`No contract addresses for chain ${chainId}`)
      }

      setError(null)

      try {
        const hash = await writeContract({
          address: addresses.marketFactory,
          abi: MarketFactoryABI,
          functionName: 'createMarket',
          args: [question, category, resolutionTime],
        })

        // Optionally wait for receipt and parse logs
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash })
          // Parse MarketCreated event from logs
          const marketCreatedLog = receipt.logs.find((log) => {
            // MarketCreated event signature
            return log.topics[0] === '0x...' // Would need actual signature
          })

          if (marketCreatedLog && marketCreatedLog.topics.length >= 3) {
            const marketId = BigInt(marketCreatedLog.topics[1] as string)
            const market = marketCreatedLog.topics[2] as Address
            return { hash, marketId, market }
          }
        }

        return { hash }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create market')
        setError(error)
        throw error
      }
    },
    [chainId, writeContract, publicClient, address, isConnected]
  )

  return { createMarket, isPending, error: error || writeError }
}

interface UsePredictionMarketReturn {
  placeBet: (outcome: 0 | 1, amount: bigint) => Promise<Hash>
  claimWinnings: () => Promise<Hash>
  isPending: boolean
  error: Error | null
}

/**
 * Hook for interacting with a specific PredictionMarket contract
 */
export function usePredictionMarket(marketAddress: Address | null): UsePredictionMarketReturn {
  const { writeContract, isPending, error: writeError } = useWriteContract()
  const { address, isConnected } = useAccount()
  const [error, setError] = useState<Error | null>(null)

  const placeBet = useCallback(
    async (outcome: 0 | 1, amount: bigint): Promise<Hash> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected')
      }

      if (!marketAddress) {
        throw new Error('No market address provided')
      }

      setError(null)

      try {
        const hash = await writeContract({
          address: marketAddress,
          abi: PredictionMarketABI,
          functionName: 'placeBet',
          args: [outcome],
          value: amount,
        })

        return hash
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to place bet')
        setError(error)
        throw error
      }
    },
    [marketAddress, writeContract, address, isConnected]
  )

  const claimWinnings = useCallback(async (): Promise<Hash> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    if (!marketAddress) {
      throw new Error('No market address provided')
    }

    setError(null)

    try {
      const hash = await writeContract({
        address: marketAddress,
        abi: PredictionMarketABI,
        functionName: 'claimWinnings',
      })

      return hash
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to claim winnings')
      setError(error)
      throw error
    }
  }, [marketAddress, writeContract, address, isConnected])

  return { placeBet, claimWinnings, isPending, error: error || writeError }
}
