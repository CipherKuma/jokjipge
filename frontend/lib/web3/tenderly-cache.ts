/**
 * Tenderly simulation cache to prevent duplicate API calls
 * Caches simulation results based on transaction parameters
 */

import type { Address } from 'viem'
import type { SimulationResponse } from './tenderly'

interface CacheKey {
  from: Address
  to: Address
  input?: string
  value?: string
  network_id: number
  block_number?: number
}

interface CacheEntry {
  result: SimulationResponse
  timestamp: number
  expiresAt: number
}

class TenderlySimulationCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly CACHE_DURATION_MS = 60 * 1000 // 60 seconds cache
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  /**
   * Generate a cache key from simulation parameters
   */
  private generateKey(params: CacheKey): string {
    const keyParams = {
      from: params.from.toLowerCase(),
      to: params.to.toLowerCase(),
      input: params.input || '0x',
      value: params.value || '0x0',
      network_id: params.network_id,
    }

    return JSON.stringify(keyParams)
  }

  /**
   * Get cached simulation result if available
   */
  get(params: CacheKey): SimulationResponse | null {
    const key = this.generateKey(params)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    console.log('Returning cached Tenderly simulation')
    return entry.result
  }

  /**
   * Store simulation result in cache
   */
  set(params: CacheKey, result: SimulationResponse): void {
    const key = this.generateKey(params)
    const now = Date.now()

    this.cache.set(key, {
      result,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION_MS,
    })

    console.log('Cached Tenderly simulation result')
  }

  /**
   * Clear expired entries from cache
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Start auto-cleanup interval (call from useEffect)
   */
  startAutoCleanup(): void {
    if (typeof window === 'undefined') return
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000) // 5 minutes
  }

  /**
   * Stop auto-cleanup interval (call from useEffect cleanup)
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Lazy singleton - only created when first accessed
let _tenderlyCache: TenderlySimulationCache | null = null

export function getTenderlyCache(): TenderlySimulationCache {
  if (!_tenderlyCache) {
    _tenderlyCache = new TenderlySimulationCache()
  }
  return _tenderlyCache
}

// For backwards compatibility (but consumers should migrate to getTenderlyCache)
export const tenderlyCache = {
  get(params: CacheKey) { return getTenderlyCache().get(params) },
  set(params: CacheKey, result: SimulationResponse) { getTenderlyCache().set(params, result) },
  cleanup() { getTenderlyCache().cleanup() },
  clear() { getTenderlyCache().clear() },
  size() { return getTenderlyCache().size() },
  startAutoCleanup() { getTenderlyCache().startAutoCleanup() },
  stopAutoCleanup() { getTenderlyCache().stopAutoCleanup() },
}
