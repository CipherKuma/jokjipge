'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { TrendingMarkets } from '@/components/activity/trending-markets'
import { EndingSoon } from '@/components/activity/ending-soon'
import { useTranslation } from '@/lib/i18n'
import { useFilterContext } from '@/lib/contexts/filter-context'
import {
  Search,
  Trophy,
  Film,
  Vote,
  Gamepad2,
  TrendingUp,
  Clock,
  CheckCircle,
  Radio,
  ChevronDown,
} from 'lucide-react'
import type { MarketCategory } from '@/lib/types/market'

interface SidebarProps {
  className?: string
  subgraphUrl?: string
}

const categoryConfig = [
  { id: 'sports', icon: Trophy },
  { id: 'entertainment', icon: Film },
  { id: 'politics', icon: Vote },
  { id: 'gaming', icon: Gamepad2 },
  { id: 'crypto', icon: TrendingUp },
]

const statusConfig = [
  { id: 'live', labelKey: 'filters.live', icon: Radio, color: 'live' },
  { id: 'ending-soon', labelKey: 'filters.endingSoon', icon: Clock, color: 'warning' },
  { id: 'resolved', labelKey: 'filters.resolved', icon: CheckCircle, color: 'success' },
]

export function Sidebar({
  className,
  subgraphUrl,
}: SidebarProps) {
  const { t } = useTranslation()
  const { filters, updateFilter } = useFilterContext()
  const [trendingOpen, setTrendingOpen] = useState(true)
  const [endingSoonOpen, setEndingSoonOpen] = useState(true)

  const selectedCategory = filters.category
  const selectedStatus = filters.status

  const handleCategoryClick = (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? undefined : categoryId as MarketCategory
    updateFilter('category', newCategory)
  }

  const handleStatusClick = (statusId: string) => {
    // Map sidebar status IDs to filter status values
    const statusMap: Record<string, 'live' | 'upcoming' | 'all' | undefined> = {
      'live': 'live',
      'ending-soon': 'upcoming', // ending-soon maps to upcoming/live markets
      'resolved': undefined, // Will need to add resolved status if needed
    }
    const newStatus = selectedStatus === statusMap[statusId] ? undefined : statusMap[statusId]
    updateFilter('status', newStatus)
  }

  const handleSearchChange = (value: string) => {
    updateFilter('search', value || undefined)
  }

  return (
    <aside
      className={cn(
        'hidden md:flex w-64 flex-col border-r border-border bg-card',
        className
      )}
    >
      <ScrollArea className="flex-1">
        <div className="px-4 py-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('filters.searchPlaceholder')}
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {t('sidebar.categories')}
            </h3>
            <div className="space-y-1">
              {categoryConfig.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 text-muted-foreground hover:text-foreground',
                      selectedCategory === category.id && 'bg-accent text-primary'
                    )}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {t(`categories.${category.id}`)}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Status Filters */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {t('sidebar.status')}
            </h3>
            <div className="space-y-1">
              {statusConfig.map((status) => {
                const Icon = status.icon
                return (
                  <Button
                    key={status.id}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 text-muted-foreground hover:text-foreground',
                      selectedStatus === status.id && 'bg-accent text-foreground'
                    )}
                    onClick={() => handleStatusClick(status.id)}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        status.id === 'live' && 'text-live animate-pulse'
                      )}
                    />
                    {t(status.labelKey)}
                    {status.id === 'live' && (
                      <Badge className="ml-auto bg-live/20 text-live border-0 text-xs">
                        3
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Trending Markets - Collapsible */}
        <Collapsible open={trendingOpen} onOpenChange={setTrendingOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-4 py-2 h-auto hover:bg-accent/50"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{t('sidebar.trending')}</span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  trendingOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <TrendingMarkets subgraphUrl={subgraphUrl} />
          </CollapsibleContent>
        </Collapsible>

        {/* Ending Soon - Collapsible */}
        <Collapsible open={endingSoonOpen} onOpenChange={setEndingSoonOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-4 py-2 h-auto hover:bg-accent/50"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm font-semibold">{t('sidebar.endingSoon')}</span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  endingSoonOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <EndingSoon subgraphUrl={subgraphUrl} />
          </CollapsibleContent>
        </Collapsible>
      </ScrollArea>
    </aside>
  )
}
