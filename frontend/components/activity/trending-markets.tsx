'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useTrendingMarkets } from '@/hooks/activity/use-activity-feed'
import { ChevronRight, AlertCircle } from 'lucide-react'
import { formatEther } from 'viem'
import { useTranslation } from '@/lib/i18n'

interface TrendingMarketsProps {
  className?: string
}

function formatVolume(volume: bigint): string {
  const formatted = formatEther(volume)
  const num = parseFloat(formatted)
  if (num < 1) return `${num.toFixed(3)} VERY`
  if (num < 1000) return `${num.toFixed(2)} VERY`
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K VERY`
  return `${(num / 1000000).toFixed(1)}M VERY`
}

function truncateQuestion(question: string, maxLength = 50): string {
  if (!question) return 'Untitled Market'
  if (question.length <= maxLength) return question
  return `${question.slice(0, maxLength)}...`
}

export function TrendingMarkets({ className }: TrendingMarketsProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { markets, loading, error } = useTrendingMarkets()

  const handleMarketClick = (marketId: string) => {
    router.push(`/markets/${marketId}`)
  }

  return (
    <div className={cn('', className)}>
      {/* Content */}
      <div className="px-2 pb-2 space-y-1">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="flex items-center gap-2 p-4 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{t('sidebar.failedToLoad')} {t('sidebar.trending').toLowerCase()}</span>
          </div>
        ) : markets.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <span className="text-sm">{t('activity.noTrending')}</span>
          </div>
        ) : (
          // Market list
          markets.map((market, index) => (
            <div
              key={market.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-all duration-300',
                'hover:bg-accent/50 cursor-pointer group'
              )}
              onClick={() => handleMarketClick(market.id)}
            >
              {/* Rank badge */}
              <Badge
                variant="outline"
                className="h-6 w-6 p-0 flex items-center justify-center text-xs font-bold"
              >
                {index + 1}
              </Badge>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-tight mb-1.5 group-hover:text-primary transition-colors">
                  {truncateQuestion(market.question)}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-primary font-medium">
                    {formatVolume(market.totalVolume)}
                  </span>
                  <span>{t('market.volume').toLowerCase()}</span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
