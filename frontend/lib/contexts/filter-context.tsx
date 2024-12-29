'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { MarketFilter } from '@/lib/types/market'

interface FilterContextValue {
  filters: MarketFilter
  setFilters: (filters: MarketFilter) => void
  updateFilter: <K extends keyof MarketFilter>(key: K, value: MarketFilter[K]) => void
  resetFilters: () => void
}

const defaultFilters: MarketFilter = {
  sortBy: 'newest',
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<MarketFilter>(defaultFilters)

  const setFilters = useCallback((newFilters: MarketFilter) => {
    setFiltersState(newFilters)
  }, [])

  const updateFilter = useCallback(<K extends keyof MarketFilter>(
    key: K,
    value: MarketFilter[K]
  ) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters)
  }, [])

  return (
    <FilterContext.Provider value={{ filters, setFilters, updateFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilterContext() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider')
  }
  return context
}
