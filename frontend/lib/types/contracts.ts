// Contract types for Jokjipge prediction markets
import type { Address } from 'viem'
import type { MarketContractInfo, UserContractPosition } from './market'

// MarketFactory contract interface
export interface MarketFactoryContract {
  // Write functions
  createMarket: (
    question: string,
    category: string,
    resolutionTime: bigint
  ) => Promise<{ marketId: bigint; market: Address }>
  resolveMarket: (marketId: bigint, winningOutcome: 0 | 1) => Promise<void>

  // Read functions
  getMarket: (marketId: bigint) => Promise<MarketInfo>
  getMarketCount: () => Promise<bigint>
  getAllMarkets: () => Promise<bigint[]>
  getMarketsByCreator: (creator: Address) => Promise<bigint[]>
  owner: () => Promise<Address>
}

// PredictionMarket contract interface
export interface PredictionMarketContract {
  // Write functions (payable)
  placeBet: (outcome: 0 | 1) => Promise<void>
  claimWinnings: () => Promise<void>

  // Read functions
  getOdds: () => Promise<[bigint, bigint]>
  getTotalBets: () => Promise<[bigint, bigint]>
  getPosition: (user: Address) => Promise<UserContractPosition>
  getMarketInfo: () => Promise<MarketContractInfo>
  calculateShares: (outcome: 0 | 1, amount: bigint) => Promise<bigint>
  calculateWinnings: (user: Address) => Promise<bigint>
}

// Market info from factory contract (matches IMarketFactory.MarketInfo)
export interface MarketInfo {
  marketAddress: Address
  creator: Address
  question: string
  category: string
  resolutionTime: bigint
  resolved: boolean
  winningOutcome: number
}

// Note: MarketContractInfo and UserContractPosition types are defined in market.ts
// to avoid duplicate exports

// Contract addresses config
export interface ContractAddresses {
  marketFactory: Address
}

// Get contract addresses for a chain
export function getContractAddresses(chainId: number): ContractAddresses | null {
  const addresses: Record<number, ContractAddresses> = {
    4613: {
      marketFactory:
        (process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS as Address) ||
        '0x581456618D817a834CBaFC26250c18DEaAC76025',
    },
  }

  return addresses[chainId] || null
}
