'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, Users } from 'lucide-react'
import { formatEther } from 'viem'
import type { Market } from '@/lib/types/market'
import { getOddsPercentage, isMarketLive, getTimeRemaining } from '@/lib/types/market'
import { useTranslation } from '@/lib/i18n'

interface MarketCardProps {
  market: Market
  onSelect: (id: string) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  sports: 'bg-secondary/20 text-secondary border-secondary/30',
  entertainment: 'bg-secondary/20 text-secondary border-secondary/30',
  politics: 'bg-warning/20 text-warning border-warning/30',
  crypto: 'bg-primary/20 text-primary border-primary/30',
  other: 'bg-muted text-muted-foreground border-border',
}

function formatVolume(value: bigint): string {
  const num = Number(formatEther(value))
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(2)
}

export function MarketCard({ market, onSelect }: MarketCardProps) {
  const { t } = useTranslation()
  const odds = getOddsPercentage(market.yesPool, market.noPool)
  const live = isMarketLive(market)
  const timeRemaining = getTimeRemaining(market.resolutionDate)

  return (
    <Card
      onClick={() => onSelect(market.id)}
      className={`
        relative p-4 bg-card border-border cursor-pointer
        transition-all duration-300
        hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5
        ${live ? 'ring-1 ring-live/30' : ''}
      `}
    >
      {/* Live Indicator */}
      {live && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-live" />
          </span>
          <span className="text-xs font-medium text-live">{t('market.live')}</span>
        </div>
      )}

      {/* Category Badge */}
      <Badge
        variant="outline"
        className={`mb-3 ${CATEGORY_COLORS[market.category] || CATEGORY_COLORS.other}`}
      >
        {t(`categories.${market.category}`)}
      </Badge>

      {/* Question */}
      <h3 className="text-foreground font-semibold mb-4 line-clamp-2 min-h-[3rem]">
        {market.question}
      </h3>

      {/* Odds Display */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-success font-medium">{t('common.yes')} {odds.yes}%</span>
          <span className="text-destructive font-medium">{t('common.no')} {odds.no}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          <div
            className="h-full bg-success transition-all duration-500"
            style={{ width: `${odds.yes}%` }}
          />
          <div
            className="h-full bg-destructive transition-all duration-500"
            style={{ width: `${odds.no}%` }}
          />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span>{formatVolume(market.totalVolume)} VERY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{market.betCount ?? 0} {t('market.bets')}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{timeRemaining}</span>
        </div>
      </div>

      {/* Resolved Status */}
      {market.status === 'resolved' && market.outcome !== undefined && (
        <div
          className={`
            absolute inset-0 flex items-center justify-center
            bg-background/80 rounded-lg backdrop-blur-sm
          `}
        >
          <Badge
            className={`
              text-lg px-4 py-2
              ${market.outcome ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}
            `}
          >
            {t('market.resolved')}: {market.outcome ? t('common.yes').toUpperCase() : t('common.no').toUpperCase()}
          </Badge>
        </div>
      )}
    </Card>
  )
}
