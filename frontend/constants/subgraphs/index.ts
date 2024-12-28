// Subgraph endpoint configurations
// Each subgraph supports both TheGraph and Goldsky endpoints

export interface IndexedContract {
  name: string
  address: string
  chainId: number
  chainName: string
  explorerUrl: string
  startBlock: number
}

export interface SubgraphConfig {
  name: string
  deployedName?: string // The actual name used in the graph-node deployment
  description?: string
  thegraph: {
    endpoint: string
  }
  goldsky: {
    endpoint: string
    versionEndpoint?: string
  }
  activeProvider: 'thegraph' | 'goldsky'
  // Contracts indexed by this subgraph
  contracts: IndexedContract[]
  schemaContent?: string
}

// Import chain-specific configs
// VeryChain-only support (chain ID: 4613)
import { predictionmarketSubgraph as predictionmarketVerychainSubgraph } from './4613/predictionmarket'

// Subgraph registry by chainId
export const subgraphs: Record<number, Record<string, SubgraphConfig>> = {
  4613: {
    predictionmarket: predictionmarketVerychainSubgraph,
  },
}

/**
 * Get the active endpoint URL for a subgraph
 * Constructs the full URL from NEXT_PUBLIC_INDEXER_URL base + subgraph path
 */
export function getSubgraphEndpoint(chainId: number, name: string): string {
  const chainSubgraphs = subgraphs[chainId]
  if (!chainSubgraphs) {
    throw new Error(`No subgraphs configured for chain ${chainId}`)
  }

  const config = chainSubgraphs[name]
  if (!config) {
    throw new Error(`Subgraph "${name}" not found for chain ${chainId}`)
  }

  // Get base URL from environment variable
  const baseUrl = process.env.NEXT_PUBLIC_INDEXER_URL
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_INDEXER_URL environment variable is required')
  }

  // Construct full URL: base URL + /subgraphs/name/{subgraph-name}
  // Use deployedName if specified, otherwise fall back to name
  const cleanBaseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
  const subgraphName = config.deployedName || config.name
  return `${cleanBaseUrl}/subgraphs/name/${subgraphName}`
}

/**
 * Get all subgraph configs for a chain
 */
export function getChainSubgraphs(chainId: number): Record<string, SubgraphConfig> {
  return subgraphs[chainId] ?? {}
}

/**
 * Check if a subgraph exists for a chain
 */
export function hasSubgraph(chainId: number, name: string): boolean {
  return Boolean(subgraphs[chainId]?.[name])
}

/**
 * Get all subgraphs that have a valid endpoint for the specified provider
 */
export function getSubgraphsByProvider(provider: 'thegraph' | 'goldsky'): SubgraphConfig[] {
  const result: SubgraphConfig[] = []
  for (const chainSubgraphs of Object.values(subgraphs)) {
    for (const config of Object.values(chainSubgraphs)) {
      // Include if the provider has a valid endpoint
      if (config[provider].endpoint) {
        result.push(config)
      }
    }
  }
  return result
}

/**
 * Get all configured subgraphs as a flat array
 */
export function getAllSubgraphs(): SubgraphConfig[] {
  const result: SubgraphConfig[] = []
  for (const chainSubgraphs of Object.values(subgraphs)) {
    for (const config of Object.values(chainSubgraphs)) {
      result.push(config)
    }
  }
  return result
}
