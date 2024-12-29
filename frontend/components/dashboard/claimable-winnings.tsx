'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEther } from 'viem'
import { Gift, Loader2, CheckCircle } from 'lucide-react'
import { useClaim } from '@/hooks/use-claim'
import type { Address } from 'viem'
import { useTranslation } from '@/lib/i18n'

export interface ClaimablePosition {
  id: string
  marketId: string
  marketAddress: Address
  question: string
  outcome: 'yes' | 'no'
  amount: bigint
  winnings: bigint // Expected winnings
}

export interface ClaimableWinningsProps {
  positions: ClaimablePosition[]
  isLoading?: boolean
  onClaimed?: () => void
}

export function ClaimableWinnings({
  positions,
  isLoading,
  onClaimed,
}: ClaimableWinningsProps) {
  const { t } = useTranslation()
  const { claimWinnings, claimAll, isLoading: claiming, pendingClaims } = useClaim()

  const totalClaimable = positions.reduce((sum, p) => sum + p.winnings, 0n)
  const marketAddresses = positions.map((p) => p.marketAddress)

  const handleClaimAll = async () => {
    console.log('Claim All clicked, addresses:', marketAddresses)
    try {
      const success = await claimAll(marketAddresses)
      console.log('Claim All result:', success)
      if (success) onClaimed?.()
    } catch (err) {
      console.error('Claim All error:', err)
    }
  }

  const handleClaim = async (marketAddress: Address) => {
    console.log('Claim clicked for:', marketAddress)
    try {
      const result = await claimWinnings(marketAddress)
      console.log('Claim result:', result)
      if (result) onClaimed?.()
    } catch (err) {
      console.error('Claim error:', err)
    }
  }

  if (isLoading) {
    return <ClaimableWinningsSkeleton />
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {t('dashboard.claimable.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>{t('dashboard.claimable.noWinnings')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-success/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-success" />
          {t('dashboard.claimable.title')}
        </CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-success">
            {Number(formatEther(totalClaimable)).toFixed(4)} VERY
          </span>
          <Button
            type="button"
            onClick={() => { console.log('Button clicked!'); handleClaimAll(); }}
            disabled={claiming}
            size="sm"
          >
            {claiming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('dashboard.claimable.claiming')}
              </>
            ) : (
              t('dashboard.claimable.claimAll')
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map((position) => {
            const isPending = pendingClaims.includes(position.marketAddress)
            return (
              <div
                key={position.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{position.question}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.claimable.betOn', { amount: Number(formatEther(position.amount)).toFixed(4) })}{' '}
                    <span className="text-primary">{position.outcome === 'yes' ? t('common.yes').toUpperCase() : t('common.no').toUpperCase()}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t('dashboard.claimable.winnings')}</p>
                    <p className="font-semibold text-success">
                      +{Number(formatEther(position.winnings)).toFixed(4)} VERY
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { console.log('Individual claim clicked!', position.marketAddress); handleClaim(position.marketAddress); }}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('dashboard.claimable.claim')
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function ClaimableWinningsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
