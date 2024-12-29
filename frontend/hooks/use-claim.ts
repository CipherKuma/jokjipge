'use client'

import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, usePublicClient } from '@/lib/web3'
import { toast } from 'sonner'
import type { Address } from 'viem'
import { formatEther } from 'viem'

// PredictionMarket ABI (only claimWinnings function)
const PREDICTION_MARKET_ABI = [
  {
    name: 'claimWinnings',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'calculateWinnings',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'winnings', type: 'uint256' }],
  },
] as const

// Explorer URL for VeryChain
const EXPLORER_URL = 'https://www.veryscan.io'

export interface UseClaimReturn {
  claimWinnings: (marketAddress: Address, silent?: boolean) => Promise<string | null>
  claimAll: (marketAddresses: Address[]) => Promise<boolean>
  isLoading: boolean
  error: string | null
  pendingClaims: Address[]
}

export function useClaim(): UseClaimReturn {
  const { address } = useAccount()
  const { writeContract } = useWriteContract()
  const { publicClient } = usePublicClient()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingClaims, setPendingClaims] = useState<Address[]>([])

  const claimWinnings = useCallback(
    async (marketAddress: Address, silent = false): Promise<string | null> => {
      console.log('useClaim.claimWinnings called', { marketAddress, address, silent })

      if (!address || !writeContract || !publicClient) {
        setError('Wallet not connected')
        if (!silent) toast.error('Wallet not connected')
        return null
      }

      setIsLoading(true)
      setError(null)
      setPendingClaims((prev) => [...prev, marketAddress])

      try {
        // First check if there are winnings to claim
        let winnings = 0n
        try {
          winnings = await publicClient.readContract({
            address: marketAddress,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'calculateWinnings',
            args: [address],
          }) as bigint
        } catch (readErr) {
          console.error('Failed to read winnings:', readErr)
        }

        if (winnings === 0n) {
          if (!silent) toast.error('No winnings to claim for this market')
          throw new Error('No winnings to claim')
        }

        // Claim winnings
        const hash = await writeContract({
          address: marketAddress,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'claimWinnings',
        })

        if (!silent) toast.loading('Claiming winnings...', { id: 'claim-tx' })

        // Wait for transaction
        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        if (receipt.status === 'success') {
          // Show success with View Tx action (only if not silent)
          if (!silent) {
            toast.dismiss('claim-tx')
            toast.success(`Claimed ${formatEther(winnings)} VERY!`, {
              action: {
                label: 'View Tx',
                onClick: () => window.open(`${EXPLORER_URL}/tx/${hash}`, '_blank'),
              },
              duration: 10000,
            })
          }
          return hash
        } else {
          throw new Error('Transaction failed')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to claim'
        setError(message)
        if (!silent) {
          toast.dismiss('claim-tx')
          toast.error(message)
        }
        return null
      } finally {
        setIsLoading(false)
        setPendingClaims((prev) => prev.filter((a) => a !== marketAddress))
      }
    },
    [address, writeContract, publicClient]
  )

  const claimAll = useCallback(
    async (marketAddresses: Address[]): Promise<boolean> => {
      if (!marketAddresses.length) return true

      let successCount = 0
      let lastHash: string | null = null

      toast.loading('Claiming all winnings...', { id: 'claim-all' })

      for (const marketAddress of marketAddresses) {
        // Use silent=true to suppress individual toasts
        const result = await claimWinnings(marketAddress, true)
        if (result) {
          successCount++
          lastHash = result
        }
      }

      toast.dismiss('claim-all')

      if (successCount === marketAddresses.length) {
        toast.success(`All ${successCount} winnings claimed!`, {
          action: lastHash ? {
            label: 'View Tx',
            onClick: () => window.open(`${EXPLORER_URL}/tx/${lastHash}`, '_blank'),
          } : undefined,
          duration: 10000,
        })
        return true
      } else if (successCount > 0) {
        toast.info(`Claimed ${successCount} of ${marketAddresses.length}`, {
          action: lastHash ? {
            label: 'View Tx',
            onClick: () => window.open(`${EXPLORER_URL}/tx/${lastHash}`, '_blank'),
          } : undefined,
        })
        return false
      } else {
        toast.error('Failed to claim winnings')
      }

      return false
    },
    [claimWinnings]
  )

  return {
    claimWinnings,
    claimAll,
    isLoading,
    error,
    pendingClaims,
  }
}
