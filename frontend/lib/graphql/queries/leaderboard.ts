// GraphQL queries for leaderboard

export const GET_LEADERBOARD = `
  query GetLeaderboard($first: Int!, $skip: Int!, $orderBy: String!, $orderDirection: String!) {
    users(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { totalBets_gt: "0" }
    ) {
      id
      totalBets
      totalWagered
      totalWon
      totalLost
      pnl
      winCount
      lossCount
    }
  }
`

export const GET_TOP_PREDICTORS_BY_PNL = `
  query GetTopPredictorsByPnL($first: Int!) {
    users(
      first: $first
      orderBy: pnl
      orderDirection: desc
      where: { totalBets_gt: "0" }
    ) {
      id
      totalBets
      totalWagered
      totalWon
      pnl
      winCount
    }
  }
`

export const GET_TOP_PREDICTORS_BY_WIN_COUNT = `
  query GetTopPredictorsByWinCount($first: Int!) {
    users(
      first: $first
      orderBy: winCount
      orderDirection: desc
      where: { totalBets_gt: "0" }
    ) {
      id
      totalBets
      totalWagered
      totalWon
      pnl
      winCount
    }
  }
`

export const GET_TOP_PREDICTORS_BY_VOLUME = `
  query GetTopPredictorsByVolume($first: Int!) {
    users(
      first: $first
      orderBy: totalWagered
      orderDirection: desc
      where: { totalBets_gt: "0" }
    ) {
      id
      totalBets
      totalWagered
      totalWon
      pnl
      winCount
    }
  }
`

export const GET_GLOBAL_STATS = `
  query GetGlobalStats {
    globalStats(id: "global") {
      totalMarkets
      totalBets
      totalVolume
      activeMarkets
    }
  }
`

// Response types
export interface LeaderboardUser {
  id: string
  totalBets: string
  totalWagered: string
  totalWon: string
  totalLost: string
  pnl: string
  winCount: string
  lossCount: string
}

export interface GlobalStats {
  totalMarkets: string
  totalBets: string
  totalVolume: string
  activeMarkets: string
}

export interface GetLeaderboardResponse {
  users: LeaderboardUser[]
}

export interface GetGlobalStatsResponse {
  globalStats: GlobalStats | null
}
