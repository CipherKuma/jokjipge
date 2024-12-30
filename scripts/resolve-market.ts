/**
 * Resolve Market Script
 *
 * Usage: npx tsx resolve-market.ts <market_id> <outcome>
 *
 * Outcome: 0 = NO wins, 1 = YES wins
 *
 * Example:
 *   npx tsx resolve-market.ts 0 1   # Market 0, YES wins
 *   npx tsx resolve-market.ts 1 0   # Market 1, NO wins
 */

import { createWalletClient, createPublicClient, http, parseAbi, type Chain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
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
  'function resolveMarket(uint256 marketId, uint8 winningOutcome) external',
  'function getMarket(uint256 marketId) external view returns ((address marketAddress, address creator, string question, string category, uint256 resolutionTime, bool resolved, uint8 winningOutcome))',
  'event MarketResolved(uint256 indexed marketId, address indexed market, uint8 winningOutcome)',
])

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log('Usage: npx tsx resolve-market.ts <market_id> <outcome>')
    console.log('')
    console.log('Outcome: 0 = NO wins, 1 = YES wins')
    console.log('')
    console.log('Examples:')
    console.log('  npx tsx resolve-market.ts 0 1   # Market 0, YES wins')
    console.log('  npx tsx resolve-market.ts 1 0   # Market 1, NO wins')
    process.exit(1)
  }

  const [marketIdStr, outcomeStr] = args
  const marketId = BigInt(marketIdStr)
  const outcome = parseInt(outcomeStr)

  if (outcome !== 0 && outcome !== 1) {
    console.error('Error: outcome must be 0 (NO) or 1 (YES)')
    process.exit(1)
  }

  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey) {
    console.error('Error: PRIVATE_KEY not set in environment')
    console.log('Create a .env file with: PRIVATE_KEY=0x...')
    process.exit(1)
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`)

  const publicClient = createPublicClient({
    chain: verychain,
    transport: http('https://rpc.verylabs.io'),
  })

  const walletClient = createWalletClient({
    account,
    chain: verychain,
    transport: http('https://rpc.verylabs.io'),
  })

  // Get market info first
  console.log(`Fetching market ${marketId} info...`)

  try {
    const marketInfo = await publicClient.readContract({
      address: MARKET_FACTORY_ADDRESS,
      abi: MarketFactoryABI,
      functionName: 'getMarket',
      args: [marketId],
    })

    console.log('')
    console.log('Market Info:')
    console.log(`  Question: ${marketInfo.question}`)
    console.log(`  Category: ${marketInfo.category}`)
    console.log(`  Market Address: ${marketInfo.marketAddress}`)
    console.log(`  Already Resolved: ${marketInfo.resolved}`)

    if (marketInfo.resolved) {
      console.log(`  Previous Outcome: ${marketInfo.winningOutcome === 1 ? 'YES' : 'NO'}`)
      console.error('\nError: Market is already resolved!')
      process.exit(1)
    }

    console.log('')
    console.log(`Resolving market with outcome: ${outcome === 1 ? 'YES' : 'NO'}`)
    console.log(`Resolver: ${account.address}`)
    console.log('')

    const hash = await walletClient.writeContract({
      address: MARKET_FACTORY_ADDRESS,
      abi: MarketFactoryABI,
      functionName: 'resolveMarket',
      args: [marketId, outcome],
    })

    console.log(`Transaction submitted: ${hash}`)
    console.log('Waiting for confirmation...')

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'success') {
      console.log('')
      console.log('Market resolved successfully!')
      console.log(`  Market ID: ${marketId}`)
      console.log(`  Winning Outcome: ${outcome === 1 ? 'YES' : 'NO'}`)
      console.log(`  Block: ${receipt.blockNumber}`)
      console.log('')
      console.log(`View on explorer: https://www.veryscan.io/tx/${hash}`)
      console.log('')
      console.log('Users who bet on the winning outcome can now claim their payouts!')
    } else {
      console.error('Transaction failed!')
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
