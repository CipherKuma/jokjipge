'use client'

import { useState, useCallback } from 'react'
import { useWriteContract, usePublicClient, useChainId } from '@/lib/web3'
import { PredictionMarketABI } from '@/lib/web3/abis/PredictionMarket'
import { OUTCOME_YES, OUTCOME_NO, type BetOutcome } from '@/lib/types/market'
import type { Address } from 'viem'

interface TransactionResult {
  hash: `0x${string}`
  success: boolean
}

interface UsePlaceBetReturn {
  placeBet: (
    marketAddress: Address,
    outcome: BetOutcome,
    amount: bigint
  ) => Promise<TransactionResult>
  isLoading: boolean
  error: string | null
  reset: () => void
}

export function usePlaceBet(): UsePlaceBetReturn {
  const { writeContract } = useWriteContract()
  const { publicClient } = usePublicClient()
  const chainId = useChainId()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const waitForTransaction = useCallback(
    async (hash: `0x${string}`): Promise<boolean> => {
      if (!publicClient) return false
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        return receipt.status === 'success'
      } catch {
        return false
      }
    },
    [publicClient]
  )

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  const placeBet = useCallback(
    async (
      marketAddress: Address,
      outcome: BetOutcome,
      amount: bigint
    ): Promise<TransactionResult> => {
      setIsLoading(true)
      setError(null)

      try {
        const outcomeValue = outcome === 'yes' ? OUTCOME_YES : OUTCOME_NO

        const hash = await writeContract({
          address: marketAddress,
          abi: PredictionMarketABI,
          functionName: 'placeBet',
          args: [outcomeValue],
          value: amount,
        })

        const success = await waitForTransaction(hash)

        if (!success) {
          throw new Error('Transaction failed')
        }

        return { hash, success }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to place bet'
        setError(errorMsg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [writeContract, waitForTransaction]
  )

  return {
    placeBet,
    isLoading,
    error,
    reset,
  }
}
