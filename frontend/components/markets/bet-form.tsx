'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { PayoutCalculator } from './payout-calculator'
import { useAccount, useBalance, ConnectButton, useReadContract } from '@/lib/web3'
import { usePlaceBet } from '@/lib/hooks/use-place-bet'
import { parseEther, formatEther } from 'viem'
import { toast } from 'sonner'
import { Loader2, AlertCircle, Wallet, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import type { BetOutcome, Market } from '@/lib/types/market'
import { OUTCOME_NO, OUTCOME_YES, MAX_POSITION } from '@/lib/types/market'
import { PredictionMarketABI } from '@/lib/web3/abis/PredictionMarket'
import type { Address } from 'viem'

const EXPLORER_URL = 'https://www.veryscan.io'

export interface OptimisticBet {
  id: string
  user: string
  outcome: number
  amount: bigint
  shares: bigint
  createdAt: number
}

interface BetFormProps {
  market: Market
  selectedOutcome: BetOutcome | null
  yesOdds: bigint
  noOdds: bigint
  onBetPlaced?: () => void
  onOptimisticBet?: (bet: OptimisticBet) => void
  onOutcomeChange?: (outcome: BetOutcome) => void
}

export function BetForm({
  market,
  selectedOutcome,
  yesOdds,
  noOdds,
  onBetPlaced,
  onOptimisticBet,
}: BetFormProps) {
  const { isConnected, address } = useAccount()
  const { balance, isLoading: balanceLoading } = useBalance({ address })
  const { placeBet, isPending, isConfirming, isSuccess, error, txHash, reset } = usePlaceBet()

  const [amountInput, setAmountInput] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  // Refs to track processed transactions and pending bet details
  const processedTxRef = useRef<string | null>(null)
  const pendingBetRef = useRef<{ amount: bigint; shares: bigint; outcome: number } | null>(null)

  const marketAddress = market.address as Address

  // Parse amount input
  const betAmount = useMemo(() => {
    if (!amountInput || isNaN(parseFloat(amountInput))) return 0n
    try {
      return parseEther(amountInput)
    } catch {
      return 0n
    }
  }, [amountInput])

  // Get current odds based on selected outcome
  const currentOdds = selectedOutcome === 'yes' ? yesOdds : selectedOutcome === 'no' ? noOdds : null

  // Calculate outcome number for contract call
  const outcomeNumber = selectedOutcome === 'yes' ? OUTCOME_YES : OUTCOME_NO

  // Fetch actual shares from contract using calculateShares
  const { data: contractShares, isLoading: sharesLoading } = useReadContract<bigint>({
    address: marketAddress,
    abi: PredictionMarketABI,
    functionName: 'calculateShares',
    args: [outcomeNumber, betAmount],
    watch: false,
  })

  // Use contract shares if available, otherwise null
  const estimatedShares = betAmount > 0n && selectedOutcome ? (contractShares ?? null) : null

  // Validation
  const validationError = useMemo(() => {
    if (!selectedOutcome) return null
    if (betAmount <= 0n) return null

    const userBalance = balance ?? 0n
    if (betAmount > userBalance) return 'Insufficient balance'
    if (betAmount > MAX_POSITION) return 'Exceeds position limit (100 VERY)'

    return null
  }, [selectedOutcome, betAmount, balance])

  // Handle bet submission
  const handlePlaceBet = useCallback(async () => {
    if (!selectedOutcome || betAmount <= 0n) return

    setLocalError(null)

    // Store bet details before submission (so we have the correct values for optimistic update)
    const outcome = selectedOutcome === 'yes' ? OUTCOME_YES : OUTCOME_NO
    pendingBetRef.current = {
      amount: betAmount,
      shares: contractShares ?? betAmount,
      outcome,
    }

    try {
      await placeBet(marketAddress, outcome as 0 | 1, betAmount)
    } catch (err) {
      pendingBetRef.current = null
      setLocalError(err instanceof Error ? err.message : 'Failed to place bet')
    }
  }, [selectedOutcome, betAmount, contractShares, marketAddress, placeBet])

  // Handle success - show toast and trigger optimistic update
  useEffect(() => {
    // Skip if already processed this transaction or missing required data
    if (!isSuccess || !txHash || !address || !pendingBetRef.current) return
    if (processedTxRef.current === txHash) return

    // Mark as processed immediately to prevent re-runs
    processedTxRef.current = txHash
    const pendingBet = pendingBetRef.current
    pendingBetRef.current = null

    // Show success toast with action to view transaction
    toast.success('Bet placed successfully!', {
      action: {
        label: 'View TX',
        onClick: () => window.open(`${EXPLORER_URL}/tx/${txHash}`, '_blank'),
      },
      duration: 5000,
    })

    // Trigger optimistic update with stored bet details
    onOptimisticBet?.({
      id: `optimistic-${txHash}`,
      user: address,
      outcome: pendingBet.outcome,
      amount: pendingBet.amount,
      shares: pendingBet.shares,
      createdAt: Math.floor(Date.now() / 1000),
    })

    setAmountInput('')
    onBetPlaced?.()
  }, [isSuccess, txHash, address, onBetPlaced, onOptimisticBet])

  // Not connected state
  if (!isConnected) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Place Bet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <Wallet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Connect wallet to place bets</p>
            <ConnectButton />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (balanceLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Place Bet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  const displayError = localError || (error?.message ?? null)
  const isLoading = isPending || isConfirming
  const canSubmit = selectedOutcome && betAmount > 0n && !validationError && !isLoading

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Place Bet</CardTitle>
          <span className="text-sm text-muted-foreground">
            Balance: {formatEther(balance ?? 0n).slice(0, 8)} VERY
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Outcome Display */}
        {selectedOutcome ? (
          <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md ${
            selectedOutcome === 'yes'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {selectedOutcome === 'yes' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="font-medium capitalize">Betting {selectedOutcome}</span>
          </div>
        ) : (
          <div className="text-center py-2 px-3 rounded-md bg-muted/50 text-muted-foreground text-sm">
            Select YES or NO above to place a bet
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="number"
              placeholder="Enter amount"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={isLoading || !selectedOutcome}
              className="pr-16 text-lg h-12"
              min="0"
              step="0.01"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              VERY
            </span>
          </div>
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
        </div>

        {/* Payout Calculator */}
        <PayoutCalculator
          betAmount={betAmount}
          estimatedShares={estimatedShares}
          selectedOutcome={selectedOutcome}
          currentOdds={currentOdds}
          totalPool={market.yesPool + market.noPool}
          isCalculating={sharesLoading && betAmount > 0n}
        />

        {/* Error Display */}
        {displayError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={!canSubmit}
          className={`w-full ${
            selectedOutcome === 'yes'
              ? 'bg-success hover:bg-success/90'
              : selectedOutcome === 'no'
              ? 'bg-destructive hover:bg-destructive/90'
              : ''
          }`}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isConfirming ? 'Confirming...' : 'Placing Bet...'}
            </>
          ) : selectedOutcome ? (
            `Place ${selectedOutcome.toUpperCase()} Bet`
          ) : (
            'Select Outcome'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
