'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from '@/lib/i18n'
import type { SortBy } from '@/lib/hooks/use-leaderboard'

interface LeaderboardTabsProps {
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
}

export function LeaderboardTabs({ sortBy, onSortChange }: LeaderboardTabsProps) {
  const { t } = useTranslation()

  const tabs: { value: SortBy; label: string }[] = [
    { value: 'pnl', label: t('leaderboard.tabs.topEarners') },
    { value: 'winCount', label: t('leaderboard.tabs.mostWins') },
    { value: 'totalWagered', label: t('leaderboard.tabs.highestVolume') },
    { value: 'totalBets', label: t('leaderboard.tabs.mostActive') },
  ]

  return (
    <Tabs value={sortBy} onValueChange={(v) => onSortChange(v as SortBy)}>
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="text-xs md:text-sm">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
