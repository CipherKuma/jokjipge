import type { SubgraphConfig } from '../index'

export const predictionmarketSubgraph: SubgraphConfig = {
  name: 'predictionmarket',
  deployedName: 'jokjipge', // Actual name used in graph-node deployment
  description: 'Indexes prediction market bets, positions, and user statistics on VeryChain Mainnet',
  thegraph: {
    endpoint: '', // No longer used - URL is constructed from NEXT_PUBLIC_INDEXER_URL
  },
  goldsky: {
    endpoint: '',
    versionEndpoint: '',
  },
  activeProvider: 'thegraph',
  contracts: [
    {
      name: 'MarketFactory',
      address: '0x581456618D817a834CBaFC26250c18DEaAC76025',
      chainId: 4613,
      chainName: 'VeryChain Mainnet',
      explorerUrl: 'https://explorer.verylabs.io/address/0x581456618D817a834CBaFC26250c18DEaAC76025',
      startBlock: 4151713,
    },
  ],
  schemaContent: `
type Market @entity {
  id: ID!
  marketId: BigInt!
  creator: Bytes!
  question: String!
  category: String!
  outcomes: [String!]!
  resolutionDate: BigInt!
  totalVolume: BigInt!
  yesPool: BigInt!
  noPool: BigInt!
  status: String!
  result: Int
  createdAt: BigInt!
  resolvedAt: BigInt
  bets: [Bet!]! @derivedFrom(field: "market")
}

type Bet @entity {
  id: ID!
  market: Market!
  user: User!
  outcome: Int!
  amount: BigInt!
  shares: BigInt!
  odds: BigInt!
  createdAt: BigInt!
  claimed: Boolean!
  claimedAmount: BigInt
}

type User @entity {
  id: ID!
  totalBets: BigInt!
  totalWagered: BigInt!
  totalWon: BigInt!
  totalLost: BigInt!
  pnl: BigInt!
  winCount: BigInt!
  lossCount: BigInt!
  bets: [Bet!]! @derivedFrom(field: "user")
  positions: [Position!]! @derivedFrom(field: "user")
}

type Position @entity {
  id: ID!
  user: User!
  market: Market!
  outcome: Int!
  amount: BigInt!
  shares: BigInt!
  claimed: Boolean!
  pnl: BigInt
}
`,
}
