// GraphQL queries for user positions and bets

export const GET_USER_POSITIONS = `
  query GetUserPositions($userId: ID!) {
    user(id: $userId) {
      id
      totalBets
      totalWagered
      totalWon
      pnl
      winCount
      lossCount
      positions(where: { claimed: false }) {
        id
        market {
          id
          question
          status
          resolutionDate
          yesPool
          noPool
          result
        }
        outcome
        amount
        shares
        claimed
      }
    }
  }
`

export const GET_USER_BETS = `
  query GetUserBets($userId: ID!, $first: Int, $skip: Int) {
    bets(
      where: { user: $userId }
      orderBy: createdAt
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      market {
        id
        question
        status
        result
        resolutionDate
        yesPool
        noPool
      }
      outcome
      amount
      shares
      claimed
      claimedAmount
      createdAt
    }
  }
`

// Query for YES wins (outcome=1, result=1)
export const GET_CLAIMABLE_YES_WINS = `
  query GetClaimableYesWins($userId: ID!) {
    positions(
      where: {
        user: $userId,
        claimed: false,
        outcome: 1,
        market_: { status: "RESOLVED", result: 1 }
      }
    ) {
      id
      market {
        id
        question
        result
        yesPool
        noPool
        resolutionDate
        status
      }
      outcome
      amount
      shares
      claimed
    }
  }
`

// Query for NO wins (outcome=0, result=0)
export const GET_CLAIMABLE_NO_WINS = `
  query GetClaimableNoWins($userId: ID!) {
    positions(
      where: {
        user: $userId,
        claimed: false,
        outcome: 0,
        market_: { status: "RESOLVED", result: 0 }
      }
    ) {
      id
      market {
        id
        question
        result
        yesPool
        noPool
        resolutionDate
        status
      }
      outcome
      amount
      shares
      claimed
    }
  }
`

// Query for ALL unclaimed positions from resolved markets (for contract-based claim check)
export const GET_RESOLVED_UNCLAIMED_POSITIONS = `
  query GetResolvedUnclaimedPositions($userId: ID!) {
    positions(
      where: {
        user: $userId,
        claimed: false,
        market_: { status: "RESOLVED" }
      }
    ) {
      id
      market {
        id
        question
        result
        yesPool
        noPool
        resolutionDate
        status
      }
      outcome
      amount
      shares
      claimed
    }
  }
`

// Response types
export interface SubgraphMarket {
  id: string
  question: string
  status: string
  resolutionDate: string
  yesPool: string
  noPool: string
  result: number | null // 0=NO, 1=YES
}

export interface SubgraphPosition {
  id: string
  market: SubgraphMarket
  outcome: number // 0=NO, 1=YES
  amount: string
  shares: string
  claimed: boolean
  claimedAmount?: string
  createdAt?: string // Only available on Bet entity, not Position
}

export interface SubgraphUser {
  id: string
  totalBets: string
  totalWagered: string
  totalWon: string
  pnl: string
  winCount: string
  lossCount: string
  positions: SubgraphPosition[]
}

export interface GetUserPositionsResponse {
  user: SubgraphUser | null
}

export interface GetUserBetsResponse {
  bets: SubgraphPosition[]
}

export interface GetClaimableWinningsResponse {
  positions: SubgraphPosition[]
}
