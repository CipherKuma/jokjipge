'use client'

import { useState, useEffect, useCallback } from 'react'
import { SubgraphConfig } from './types'

const STORAGE_KEY = 'subgraph_configs'

function loadFromStorage(): SubgraphConfig[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored).map((config: any) => ({
        ...config,
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt)
      }))
    }
  } catch (error) {
    console.error('Failed to load subgraph configs from storage:', error)
  }
  return []
}

function saveToStorage(configs: SubgraphConfig[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
  } catch (error) {
    console.error('Failed to save subgraph configs to storage:', error)
  }
}

// Hook for React components - properly handles SSR
export function useSubgraphConfigs() {
  const [configs, setConfigs] = useState<SubgraphConfig[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from storage only after mount
  useEffect(() => {
    const storedConfigs = loadFromStorage()
    setConfigs(storedConfigs)
    setIsLoaded(true)
  }, [])

  // Save to storage whenever configs change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(configs)
    }
  }, [configs, isLoaded])

  const addConfig = useCallback((
    config: Omit<SubgraphConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): SubgraphConfig => {
    const newConfig: SubgraphConfig = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setConfigs(prev => [...prev, newConfig])
    return newConfig
  }, [])

  const updateConfig = useCallback((
    id: string,
    updates: Partial<SubgraphConfig>
  ): SubgraphConfig | undefined => {
    let updatedConfig: SubgraphConfig | undefined

    setConfigs(prev => {
      const index = prev.findIndex(config => config.id === id)
      if (index === -1) return prev

      updatedConfig = {
        ...prev[index],
        ...updates,
        updatedAt: new Date()
      }

      const newConfigs = [...prev]
      newConfigs[index] = updatedConfig
      return newConfigs
    })

    return updatedConfig
  }, [])

  const deleteConfig = useCallback((id: string): boolean => {
    let deleted = false

    setConfigs(prev => {
      const index = prev.findIndex(config => config.id === id)
      if (index === -1) return prev
      deleted = true
      return prev.filter(config => config.id !== id)
    })

    return deleted
  }, [])

  const getConfig = useCallback((id: string): SubgraphConfig | undefined => {
    return configs.find(config => config.id === id)
  }, [configs])

  const clearAll = useCallback((): void => {
    setConfigs([])
  }, [])

  return {
    configs,
    activeConfigs: configs.filter(config => config.isActive),
    isLoaded,
    addConfig,
    updateConfig,
    deleteConfig,
    getConfig,
    clearAll
  }
}
