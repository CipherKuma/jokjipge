/**
 * List Markets Script
 *
 * Usage: npx tsx list-markets.ts
 *
 * Lists all markets with their status, useful for finding market IDs to resolve.
 */

import { createPublicClient, http, parseAbi, formatEther, type Chain } from 'viem'
import 'dotenv/config'

const MARKET_FACTORY_ADDRESS = '0x581456618D817a834CBaFC26250c18DEaAC76025' as const

// VeryChain definition
const verychain: Chain = {
  id: 4613,
  name: 'VeryChain',
  nativeCurrency: { name: 'VERY', symbol: 'VERY', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.verylabs.io'] },
  },
  blockExplorers: {
    default: { name: 'VeryScan', url: 'https://www.veryscan.io' },
  },
}

const MarketFactoryABI = parseAbi([
  'function getMarketCount() external view returns (uint256)',
  'function getMarket(uint256 marketId) external view returns ((address marketAddress, address creator, string question, string category, uint256 resolutionTime, bool resolved, uint8 winningOutcome))',
])

const PredictionMarketABI = parseAbi([
  'function totalPool() external view returns (uint256)',
  'function totalYesShares() external view returns (uint256)',
  'function totalNoShares() external view returns (uint256)',
])

async function main() {
  const publicClient = createPublicClient({
    chain: verychain,
    transport: http('https://rpc.verylabs.io'),
  })

  console.log('Fetching markets from MarketFactory...')
  console.log(`Factory: ${MARKET_FACTORY_ADDRESS}`)
  console.log('')

  try {
    const count = await publicClient.readContract({
      address: MARKET_FACTORY_ADDRESS,
      abi: MarketFactoryABI,
      functionName: 'getMarketCount',
    })

    console.log(`Total Markets: ${count}`)
    console.log('='.repeat(80))
    console.log('')

    for (let i = 0n; i < count; i++) {
      const market = await publicClient.readContract({
        address: MARKET_FACTORY_ADDRESS,
        abi: MarketFactoryABI,
        functionName: 'getMarket',
        args: [i],
      })

      // Get pool info from the market contract
      let poolInfo = { totalPool: 0n, yesShares: 0n, noShares: 0n }
      try {
        const [totalPool, yesShares, noShares] = await Promise.all([
          publicClient.readContract({
            address: market.marketAddress as `0x${string}`,
            abi: PredictionMarketABI,
            functionName: 'totalPool',
          }),
          publicClient.readContract({
            address: market.marketAddress as `0x${string}`,
            abi: PredictionMarketABI,
            functionName: 'totalYesShares',
          }),
          publicClient.readContract({
            address: market.marketAddress as `0x${string}`,
            abi: PredictionMarketABI,
            functionName: 'totalNoShares',
          }),
        ])
        poolInfo = { totalPool, yesShares, noShares }
      } catch {
        // Ignore errors reading pool info
      }

      const resolutionDate = new Date(Number(market.resolutionTime) * 1000)
      const isExpired = Date.now() > Number(market.resolutionTime) * 1000

      console.log(`Market #${i}`)
      console.log(`  Question: ${market.question}`)
      console.log(`  Category: ${market.category}`)
      console.log(`  Address: ${market.marketAddress}`)
      console.log(`  Resolution: ${resolutionDate.toISOString()} ${isExpired ? '(EXPIRED)' : ''}`)
      console.log(`  Status: ${market.resolved ? `RESOLVED - ${market.winningOutcome === 1 ? 'YES' : 'NO'} won` : 'OPEN'}`)
      console.log(`  Pool: ${formatEther(poolInfo.totalPool)} VERY`)
      console.log(`  Yes Shares: ${formatEther(poolInfo.yesShares)} | No Shares: ${formatEther(poolInfo.noShares)}`)
      console.log('')
    }

    console.log('='.repeat(80))
    console.log('')
    console.log('To resolve a market:')
    console.log('  npx tsx resolve-market.ts <market_id> <outcome>')
    console.log('  outcome: 0 = NO wins, 1 = YES wins')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
