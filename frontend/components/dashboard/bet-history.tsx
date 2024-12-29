'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatEther } from 'viem'
import { ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Bet } from '@/lib/types/market'
import { useTranslation } from '@/lib/i18n'

// Calculate P&L for a bet (works for both claimed and unclaimed)
function calculateBetPnl(bet: Bet): bigint {
  if (bet.result === 'won') {
    if (bet.claimedAmount && bet.claimedAmount > 0n) {
      return bet.claimedAmount - bet.amount
    }
    // Calculate expected winnings for unclaimed winning bets
    const totalPool = bet.market.yesPool + bet.market.noPool
    const winningPool = bet.outcome === 'yes' ? bet.market.yesPool : bet.market.noPool
    if (winningPool > 0n) {
      const expectedWinnings = (bet.shares * totalPool) / winningPool
      return expectedWinnings - bet.amount
    }
    return 0n
  } else if (bet.result === 'lost') {
    return -bet.amount
  }
  return 0n
}

export interface BetHistoryProps {
  bets: Bet[]
  isLoading?: boolean
  pageSize?: number
  onLoadMore?: () => void
  hasMore?: boolean
}

type FilterOption = 'all' | 'won' | 'lost' | 'pending'
type SortOption = 'date' | 'amount' | 'pnl'

export function BetHistory({
  bets,
  isLoading,
  pageSize = 10,
  onLoadMore,
  hasMore,
}: BetHistoryProps) {
  const { t, locale } = useTranslation()
  const [filter, setFilter] = useState<FilterOption>('all')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [sortDesc, setSortDesc] = useState(true)
  const [page, setPage] = useState(0)

  const filteredBets = useMemo(() => {
    let filtered = bets
    if (filter !== 'all') {
      filtered = bets.filter((bet) => bet.result === filter)
    }
    return filtered.sort((a, b) => {
      const dir = sortDesc ? -1 : 1
      switch (sortBy) {
        case 'date':
          return (a.createdAt - b.createdAt) * dir
        case 'amount':
          return Number(a.amount - b.amount) * dir
        case 'pnl':
          const aPnl = calculateBetPnl(a)
          const bPnl = calculateBetPnl(b)
          return Number(aPnl - bPnl) * dir
        default:
          return 0
      }
    })
  }, [bets, filter, sortBy, sortDesc])

  const paginatedBets = useMemo(() => {
    const start = page * pageSize
    return filteredBets.slice(start, start + pageSize)
  }, [filteredBets, page, pageSize])

  const totalPages = Math.ceil(filteredBets.length / pageSize)

  const filterLabels: Record<FilterOption, string> = {
    all: t('dashboard.betHistory.filter.all'),
    won: t('dashboard.betHistory.filter.won'),
    lost: t('dashboard.betHistory.filter.lost'),
    pending: t('dashboard.betHistory.filter.pending'),
  }

  const sortLabels: Record<SortOption, string> = {
    date: t('dashboard.betHistory.sort.date'),
    amount: t('dashboard.betHistory.sort.amount'),
    pnl: t('dashboard.betHistory.sort.pnl'),
  }

  if (isLoading) {
    return <BetHistorySkeleton />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('dashboard.betHistory.title')}</CardTitle>
        <div className="flex items-center gap-2">
          <FilterDropdown value={filter} onChange={setFilter} labels={filterLabels} />
          <SortDropdown value={sortBy} onChange={setSortBy} desc={sortDesc} onToggle={() => setSortDesc(!sortDesc)} labels={sortLabels} />
        </div>
      </CardHeader>
      <CardContent>
        {filteredBets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('dashboard.betHistory.noBets')}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.betHistory.market')}</TableHead>
                  <TableHead>{t('dashboard.betHistory.outcome')}</TableHead>
                  <TableHead className="text-right">{t('dashboard.betHistory.amount')}</TableHead>
                  <TableHead>{t('dashboard.betHistory.result')}</TableHead>
                  <TableHead className="text-right">{t('dashboard.betHistory.pnl')}</TableHead>
                  <TableHead className="text-right">{t('dashboard.betHistory.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBets.map((bet) => (
                  <BetRow key={bet.id} bet={bet} locale={locale} />
                ))}
              </TableBody>
            </Table>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {t('common.showing', { start: page * pageSize + 1, end: Math.min((page + 1) * pageSize, filteredBets.length), total: filteredBets.length })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {t('common.page', { current: page + 1, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function BetRow({ bet, locale }: { bet: Bet; locale: string }) {
  const { t } = useTranslation()
  const pnl = calculateBetPnl(bet)
  const pnlClass = pnl > 0n ? 'text-success' : pnl < 0n ? 'text-destructive' : ''
  const resultBadgeVariant =
    bet.result === 'won' ? 'default' : bet.result === 'lost' ? 'destructive' : 'secondary'

  const localeMap: Record<string, string> = { en: 'en-US', ko: 'ko-KR' }

  const getResultLabel = () => {
    if (!bet.result) return t('dashboard.betHistory.filter.pending').toUpperCase()
    return t(`dashboard.betHistory.filter.${bet.result}`).toUpperCase()
  }

  return (
    <TableRow>
      <TableCell className="max-w-[200px] truncate">{bet.market.question}</TableCell>
      <TableCell>
        <Badge variant={bet.outcome === 'yes' ? 'default' : 'secondary'}>
          {bet.outcome === 'yes' ? t('common.yes').toUpperCase() : t('common.no').toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell className="text-right">{Number(formatEther(bet.amount)).toFixed(4)} VERY</TableCell>
      <TableCell>
        <Badge variant={resultBadgeVariant}>
          {getResultLabel()}
        </Badge>
      </TableCell>
      <TableCell className={`text-right ${pnlClass}`}>
        {pnl > 0n && '+'}
        {Number(formatEther(pnl)).toFixed(4)} VERY
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {new Date(bet.createdAt * 1000).toLocaleDateString(localeMap[locale] || 'en-US')}
      </TableCell>
    </TableRow>
  )
}

function FilterDropdown({ value, onChange, labels }: { value: FilterOption; onChange: (v: FilterOption) => void; labels: Record<FilterOption, string> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {labels[value]} <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {(Object.keys(labels) as FilterOption[]).map((opt) => (
          <DropdownMenuItem key={opt} onClick={() => onChange(opt)}>
            {labels[opt]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SortDropdown({
  value,
  onChange,
  desc,
  onToggle,
  labels,
}: {
  value: SortOption
  onChange: (v: SortOption) => void
  desc: boolean
  onToggle: () => void
  labels: Record<SortOption, string>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          {labels[value]} {desc ? '↓' : '↑'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {(Object.keys(labels) as SortOption[]).map((opt) => (
          <DropdownMenuItem key={opt} onClick={() => (value === opt ? onToggle() : onChange(opt))}>
            {labels[opt]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BetHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
