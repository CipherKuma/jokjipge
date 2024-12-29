'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ActivityItem as ActivityItemType, ActivityType } from '@/hooks/activity/types'
import { Coins, Trophy, PlusCircle, CheckCircle } from 'lucide-react'
import { formatEther } from 'viem'

interface ActivityItemProps {
  item: ActivityItemType
  isNew?: boolean
  onClick?: () => void
}

const activityConfig: Record<
  ActivityType,
  { icon: typeof Coins; label: string; color: string }
> = {
  BET: { icon: Coins, label: 'Bet placed', color: 'text-primary' },
  CLAIM: { icon: Trophy, label: 'Claimed winnings', color: 'text-success' },
  MARKET_CREATED: { icon: PlusCircle, label: 'New market', color: 'text-blue-400' },
  MARKET_RESOLVED: { icon: CheckCircle, label: 'Market resolved', color: 'text-muted-foreground' },
}

function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address || 'Unknown'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function truncateQuestion(question: string, maxLength = 40): string {
  if (!question) return 'Untitled Market'
  if (question.length <= maxLength) return question
  return `${question.slice(0, maxLength)}...`
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000
  const diff = now - timestamp

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatAmount(amount: bigint | undefined): string {
  if (!amount || amount === 0n) return ''
  const formatted = formatEther(amount)
  const num = parseFloat(formatted)
  if (num < 0.001) return '<0.001 VERY'
  if (num < 1) return `${num.toFixed(3)} VERY`
  if (num < 1000) return `${num.toFixed(2)} VERY`
  return `${(num / 1000).toFixed(1)}K VERY`
}

export function ActivityItemComponent({ item, isNew, onClick }: ActivityItemProps) {
  const config = activityConfig[item.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-all duration-300',
        'hover:bg-accent/50 cursor-pointer',
        isNew && 'animate-slide-in bg-primary/5'
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={cn('mt-0.5 p-1.5 rounded-md bg-muted/50', config.color)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {config.label}
          </span>
          {item.outcome && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-1.5 py-0',
                item.outcome === 'yes'
                  ? 'border-success text-success'
                  : 'border-destructive text-destructive'
              )}
            >
              {item.outcome.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Market question */}
        <p className="text-xs text-muted-foreground truncate mb-1">
          {truncateQuestion(item.market.question)}
        </p>

        {/* Footer: user, amount, time */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{truncateAddress(item.user)}</span>
          <div className="flex items-center gap-2">
            {item.amount && item.amount > 0n && (
              <span className="text-primary font-medium">
                {formatAmount(item.amount)}
              </span>
            )}
            <span>{formatRelativeTime(item.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
