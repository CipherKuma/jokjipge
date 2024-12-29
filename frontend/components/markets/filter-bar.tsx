'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import type { MarketFilter, MarketCategory } from '@/lib/types/market'

interface FilterBarProps {
  filters: MarketFilter
  onFiltersChange: (filters: MarketFilter) => void
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState(filters.search || '')

  const CATEGORIES: { value: MarketCategory | 'all'; labelKey: string }[] = [
    { value: 'all', labelKey: 'filters.allCategories' },
    { value: 'sports', labelKey: 'categories.sports' },
    { value: 'entertainment', labelKey: 'categories.entertainment' },
    { value: 'politics', labelKey: 'categories.politics' },
    { value: 'crypto', labelKey: 'categories.crypto' },
    { value: 'other', labelKey: 'categories.other' },
  ]

  const STATUS_OPTIONS: { value: string; labelKey: string }[] = [
    { value: 'all', labelKey: 'filters.all' },
    { value: 'live', labelKey: 'filters.live' },
    { value: 'upcoming', labelKey: 'filters.upcoming' },
    { value: 'resolved', labelKey: 'filters.resolved' },
  ]

  const SORT_OPTIONS: { value: string; labelKey: string }[] = [
    { value: 'newest', labelKey: 'filters.newest' },
    { value: 'volume', labelKey: 'stats.totalVolume' },
    { value: 'endingSoon', labelKey: 'filters.endingSoon' },
  ]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFiltersChange({ ...filters, search: searchValue || undefined })
  }

  const handleSearchClear = () => {
    setSearchValue('')
    onFiltersChange({ ...filters, search: undefined })
  }

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={filters.status === option.value || (!filters.status && option.value === 'all') ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              onFiltersChange({
                ...filters,
                status: option.value === 'all' ? undefined : (option.value as MarketFilter['status']),
              })
            }
            className={
              filters.status === option.value || (!filters.status && option.value === 'all')
                ? 'bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
            }
          >
            {option.value === 'live' && (
              <span className="w-2 h-2 rounded-full bg-live animate-pulse mr-2" />
            )}
            {t(option.labelKey)}
          </Button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('filters.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary"
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
        </form>

        {/* Category Dropdown */}
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              category: value === 'all' ? undefined : (value as MarketCategory),
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('filters.allCategories')} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {t(cat.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Dropdown */}
        <Select
          value={filters.sortBy || 'newest'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              sortBy: value as MarketFilter['sortBy'],
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[150px] bg-card border-border">
            <SelectValue placeholder={t('filters.newest')} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
