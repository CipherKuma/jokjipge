// Market types for the prediction market
import type { Address } from 'viem'

export type MarketStatus = 'active' | 'resolved' | 'pending'
export type MarketCategory = 'sports' | 'entertainment' | 'politics' | 'crypto' | 'other'
export type BetOutcome = 'yes' | 'no'

// Contract outcome values (0 = No, 1 = Yes)
export const OUTCOME_NO = 0
export const OUTCOME_YES = 1

// Max position limit from contract (100 ether)
export const MAX_POSITION = BigInt('100000000000000000000')

export interface Market {
  id: string
  address?: Address // Contract address for this market
  question: string
  category: MarketCategory
  yesPool: bigint
  noPool: bigint
  totalVolume: bigint
  resolutionDate: number // Unix timestamp
  status: MarketStatus
  creator: string
  createdAt: number
  resolvedAt?: number
  outcome?: boolean // true = Yes, false = No, undefined = unresolved
  betCount?: number // Number of bets placed on this market
}

// User bet/position types
export interface Position {
  id: string
  marketId: string
  market: Market
  outcome: BetOutcome
  amount: bigint
  shares: bigint
  entryOdds: number // Odds when bet was placed
  currentOdds?: number // Current odds (for active markets)
  claimed: boolean
  claimedAmount?: bigint
  createdAt: number
}

export interface UserStats {
  totalBets: number
  totalWagered: bigint
  totalWon: bigint
  pnl: bigint
  winCount: number
  lossCount: number
}

export interface Bet extends Position {
  result?: 'won' | 'lost' | 'pending'
}

export interface MarketStats {
  totalMarkets: number
  totalVolume: bigint
  activeBets: number
  userPnL?: bigint
}

export interface MarketFilter {
  category?: MarketCategory | 'all'
  status?: MarketStatus | 'live' | 'upcoming' | 'all'
  sortBy?: 'volume' | 'endingSoon' | 'newest'
  search?: string
}

// Helper functions
export function getOddsPercentage(yesPool: bigint, noPool: bigint): { yes: number; no: number } {
  const total = yesPool + noPool
  if (total === 0n) return { yes: 50, no: 50 }

  const yesPercent = Number((yesPool * 100n) / total)
  const noPercent = 100 - yesPercent
  return { yes: yesPercent, no: noPercent }
}

export function isMarketLive(market: Market): boolean {
  const now = Date.now()
  return market.status === 'active' && market.resolutionDate * 1000 > now
}

export function getTimeRemaining(resolutionDate: number): string {
  const now = Date.now()
  const remaining = resolutionDate * 1000 - now

  if (remaining <= 0) return 'Ended'

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Market info from contract (matches IPredictionMarket.MarketInfo)
export interface MarketContractInfo {
  question: string
  category: string
  resolutionTime: bigint
  resolved: boolean
  winningOutcome: number
  totalYesShares: bigint
  totalNoShares: bigint
  totalPool: bigint
}

// User position from contract (matches IPredictionMarket.Position)
export interface UserContractPosition {
  yesShares: bigint
  noShares: bigint
  claimed: boolean
}
