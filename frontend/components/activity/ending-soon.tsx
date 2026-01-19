'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useEndingSoon } from '@/hooks/activity/use-activity-feed'
import { Clock, ChevronRight, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface EndingSoonProps {
  className?: string
}

function formatCountdown(resolutionDate: number, endedText: string = 'Ended'): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = resolutionDate - now

  if (diff <= 0) return endedText
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    const mins = Math.floor((diff % 3600) / 60)
    return `${hours}h ${mins}m`
  }
  return `${Math.floor(diff / 86400)}d`
}

function truncateQuestion(question: string, maxLength = 45, fallback = 'Untitled Market'): string {
  if (!question) return fallback
  if (question.length <= maxLength) return question
  return `${question.slice(0, maxLength)}...`
}

function CountdownTimer({ resolutionDate, endedText }: { resolutionDate: number; endedText: string }) {
  const [countdown, setCountdown] = useState(formatCountdown(resolutionDate, endedText))

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(resolutionDate, endedText))
    }, 1000)
    return () => clearInterval(interval)
  }, [resolutionDate, endedText])

  const isUrgent = resolutionDate - Math.floor(Date.now() / 1000) < 3600

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-mono',
        isUrgent && 'border-destructive text-destructive animate-pulse'
      )}
    >
      <Clock className="h-3 w-3 mr-1" />
      {countdown}
    </Badge>
  )
}

export function EndingSoon({ className }: EndingSoonProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { markets, loading, error } = useEndingSoon()

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
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="flex items-center gap-2 p-4 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{t('sidebar.failedToLoad')}</span>
          </div>
        ) : markets.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <span className="text-sm">{t('activity.noEndingSoon')}</span>
          </div>
        ) : (
          // Market list
          markets.map((market) => (
            <div
              key={market.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-all duration-300',
                'hover:bg-accent/50 cursor-pointer group'
              )}
              onClick={() => handleMarketClick(market.id)}
            >
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
                  {truncateQuestion(market.question)}
                </p>
                <div className="flex items-center gap-2">
                  <CountdownTimer resolutionDate={market.resolutionDate} endedText={t('activity.ended')} />
                  <div className="flex items-center gap-1 text-xs">
                    <Badge variant="outline" className="text-success border-success/50 text-xs px-1.5">
                      {t('common.yes')} {market.yesOdds}%
                    </Badge>
                    <Badge variant="outline" className="text-destructive border-destructive/50 text-xs px-1.5">
                      {t('common.no')} {market.noOdds}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
