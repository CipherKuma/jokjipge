/**
 * Create Market Script
 *
 * Usage: npx tsx create-market.ts "Question?" "category" <days_until_resolution>
 *
 * Example:
 *   npx tsx create-market.ts "Will BTC hit 200k in 2025?" "crypto" 30
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
  'function createMarket(string question, string category, uint256 resolutionTime) external returns (uint256 marketId, address market)',
  'function getMarketCount() external view returns (uint256)',
  'event MarketCreated(uint256 indexed marketId, address indexed market, address indexed creator, string question, string category, uint256 resolutionTime)',
])

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.log('Usage: npx tsx create-market.ts "Question?" "category" <days_until_resolution>')
    console.log('')
    console.log('Categories: crypto, sports, entertainment, politics, gaming')
    console.log('')
    console.log('Example:')
    console.log('  npx tsx create-market.ts "Will BTC hit 200k in 2025?" "crypto" 30')
    process.exit(1)
  }

  const [question, category, daysStr] = args
  const days = parseInt(daysStr)

  if (isNaN(days) || days <= 0) {
    console.error('Error: days_until_resolution must be a positive number')
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

  // Calculate resolution time (current time + days)
  const resolutionTime = BigInt(Math.floor(Date.now() / 1000) + days * 24 * 60 * 60)

  console.log('Creating market...')
  console.log(`  Question: ${question}`)
  console.log(`  Category: ${category}`)
  console.log(`  Resolution: ${new Date(Number(resolutionTime) * 1000).toISOString()}`)
  console.log(`  Creator: ${account.address}`)
  console.log('')

  try {
    const hash = await walletClient.writeContract({
      address: MARKET_FACTORY_ADDRESS,
      abi: MarketFactoryABI,
      functionName: 'createMarket',
      args: [question, category, resolutionTime],
    })

    console.log(`Transaction submitted: ${hash}`)
    console.log('Waiting for confirmation...')

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'success') {
      // Parse the MarketCreated event
      const log = receipt.logs.find(l =>
        l.address.toLowerCase() === MARKET_FACTORY_ADDRESS.toLowerCase()
      )

      if (log && log.topics[1] && log.topics[2]) {
        const marketId = BigInt(log.topics[1])
        const marketAddress = '0x' + log.topics[2].slice(26)

        console.log('')
        console.log('Market created successfully!')
        console.log(`  Market ID: ${marketId}`)
        console.log(`  Market Address: ${marketAddress}`)
        console.log(`  Block: ${receipt.blockNumber}`)
        console.log('')
        console.log(`View on explorer: https://www.veryscan.io/tx/${hash}`)
      } else {
        console.log('Market created! Check transaction for details.')
      }
    } else {
      console.error('Transaction failed!')
    }
  } catch (error) {
    console.error('Error creating market:', error)
    process.exit(1)
  }
}

main()
