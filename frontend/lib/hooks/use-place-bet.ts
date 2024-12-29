'use client'

import { useState, useCallback } from 'react'
import { useWriteContract, useWaitForTransaction, useAccount } from '@/lib/web3'
import { PredictionMarketABI } from '@/lib/web3/abis/PredictionMarket'
import { OUTCOME_NO, OUTCOME_YES, MAX_POSITION } from '@/lib/types/market'
import type { Address, Hash } from 'viem'

interface UsePlaceBetReturn {
  placeBet: (
    marketAddress: Address,
    outcome: 0 | 1,
    amount: bigint
  ) => Promise<Hash>
  isPending: boolean
  isSuccess: boolean
  isConfirming: boolean
  error: Error | null
  txHash: Hash | null
  reset: () => void
}

/**
 * Hook to place bets on a prediction market
 * Calls PredictionMarket.placeBet{value: amount}(outcome)
 */
export function usePlaceBet(): UsePlaceBetReturn {
  const { isConnected, address } = useAccount()
  const { writeContract, isPending: isWritePending, error: writeError } = useWriteContract()

  const [txHash, setTxHash] = useState<Hash | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransaction({
    hash: txHash ?? undefined,
  })

  const placeBet = useCallback(
    async (
      marketAddress: Address,
      outcome: 0 | 1,
      amount: bigint
    ): Promise<Hash> => {
      // Validation
      if (!isConnected || !address) {
        throw new Error('Wallet not connected')
      }

      if (amount <= 0n) {
        throw new Error('Bet amount must be greater than 0')
      }

      if (amount > MAX_POSITION) {
        throw new Error('Bet amount exceeds position limit (100 VERY)')
      }

      if (outcome !== OUTCOME_NO && outcome !== OUTCOME_YES) {
        throw new Error('Invalid outcome: must be 0 (NO) or 1 (YES)')
      }

      setError(null)
      setIsSuccess(false)

      try {
        const hash = await writeContract({
          address: marketAddress,
          abi: PredictionMarketABI,
          functionName: 'placeBet',
          args: [outcome],
          value: amount,
        })

        setTxHash(hash)
        return hash
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to place bet')
        setError(error)
        throw error
      }
    },
    [isConnected, address, writeContract]
  )

  // Update success state when transaction is confirmed
  if (isConfirmed && !isSuccess) {
    setIsSuccess(true)
  }

  const reset = useCallback(() => {
    setTxHash(null)
    setError(null)
    setIsSuccess(false)
  }, [])

  return {
    placeBet,
    isPending: isWritePending,
    isSuccess,
    isConfirming,
    error: error || writeError,
    txHash,
    reset,
  }
}

/**
 * Hook to calculate estimated shares for a bet
 */
export function useCalculateShares(
  marketAddress: Address | undefined,
  outcome: 0 | 1,
  amount: bigint
): { shares: bigint | null; isLoading: boolean; error: Error | null } {
  // This would use useReadContract to call calculateShares on the contract
  // For now, we'll provide a simple estimate based on pool ratio
  // TODO: Implement proper contract call when subgraph is ready

  if (!marketAddress || amount <= 0n) {
    return { shares: null, isLoading: false, error: null }
  }

  // Simplified estimation (shares ≈ amount for now)
  // Real calculation: shares = calculateShares(outcome, amount)
  return { shares: amount, isLoading: false, error: null }
}
