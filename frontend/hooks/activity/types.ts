export type ActivityType = 'BET' | 'CLAIM' | 'MARKET_CREATED' | 'MARKET_RESOLVED'

export interface ActivityItem {
  id: string
  type: ActivityType
  user: string
  market: {
    id: string
    question: string
  }
  outcome?: 'yes' | 'no'
  amount?: bigint
  timestamp: number
}

export interface TrendingMarket {
  id: string
  question: string
  totalVolume: bigint
  yesPool: bigint
  noPool: bigint
  resolutionDate: number
  betCount: number
}

export interface EndingSoonMarket {
  id: string
  question: string
  resolutionDate: number
  yesPool: bigint
  noPool: bigint
  yesOdds: number
  noOdds: number
}

export interface ActivityFeedState {
  items: ActivityItem[]
  loading: boolean
  error: string | null
}

export interface TrendingMarketsState {
  markets: TrendingMarket[]
  loading: boolean
  error: string | null
}

export interface EndingSoonState {
  markets: EndingSoonMarket[]
  loading: boolean
  error: string | null
}
