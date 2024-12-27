import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import {
  MarketCreated,
  MarketResolved
} from '../../generated/MarketFactory/MarketFactory'
import { Market, MarketEvent, Position, User } from '../../generated/schema'
import { PredictionMarket as PredictionMarketTemplate } from '../../generated/templates'
import {
  getOrCreateGlobalStats,
  getOrCreateDailyStats,
  createEventId
} from './utils'

// ============ Event Handlers ============

export function handleMarketCreated(event: MarketCreated): void {
  let marketAddress = event.params.market
  let marketId = marketAddress.toHexString().toLowerCase()

  // Create market entity
  let market = new Market(marketId)
  market.marketId = event.params.marketId
  market.creator = event.params.creator
  market.question = event.params.question
  market.category = event.params.category
  market.outcomes = ['NO', 'YES']
  market.resolutionDate = event.params.resolutionTime
  market.totalVolume = BigInt.zero()
  market.yesPool = BigInt.zero()
  market.noPool = BigInt.zero()
  market.status = 'OPEN'
  market.result = null
  market.createdAt = event.block.timestamp
  market.resolvedAt = null
  market.positionIds = []
  market.save()

  // Create dynamic data source for PredictionMarket
  PredictionMarketTemplate.create(marketAddress)

  // Create immutable event log
  let eventId = createEventId(event)
  let marketEvent = new MarketEvent(eventId)
  marketEvent.eventType = 'CREATED'
  marketEvent.market = marketAddress
  marketEvent.timestamp = event.block.timestamp
  marketEvent.blockNumber = event.block.number
  marketEvent.transactionHash = event.transaction.hash
  marketEvent.save()

  // Update global stats
  let globalStats = getOrCreateGlobalStats()
  globalStats.totalMarkets = globalStats.totalMarkets.plus(BigInt.fromI32(1))
  globalStats.activeMarkets = globalStats.activeMarkets.plus(BigInt.fromI32(1))
  globalStats.save()

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp)
  dailyStats.marketsCreated = dailyStats.marketsCreated.plus(BigInt.fromI32(1))
  dailyStats.save()
}

export function handleMarketResolved(event: MarketResolved): void {
  let marketAddress = event.params.market
  let marketId = marketAddress.toHexString().toLowerCase()
  let market = Market.load(marketId)

  if (!market) return

  let winningOutcome = event.params.winningOutcome

  market.status = 'RESOLVED'
  market.result = winningOutcome
  market.resolvedAt = event.block.timestamp
  market.save()

  // Update user stats for all positions in this market
  let positionIds = market.positionIds
  for (let i = 0; i < positionIds.length; i++) {
    let position = Position.load(positionIds[i])
    if (!position) continue

    let user = User.load(position.user)
    if (!user) continue

    // Check if user won or lost
    let userWon = position.outcome == winningOutcome

    if (userWon) {
      user.winCount = user.winCount.plus(BigInt.fromI32(1))
      // Calculate expected winnings: (userShares * totalPool) / totalWinningShares
      let totalPool = market.yesPool.plus(market.noPool)
      let winningShares = winningOutcome == 1 ? market.yesPool : market.noPool
      if (winningShares.gt(BigInt.zero())) {
        let expectedWinnings = position.shares.times(totalPool).div(winningShares)
        let pnl = expectedWinnings.minus(position.amount)
        user.pnl = user.pnl.plus(pnl)
        position.pnl = pnl
      }
    } else {
      user.lossCount = user.lossCount.plus(BigInt.fromI32(1))
      user.totalLost = user.totalLost.plus(position.amount)
      user.pnl = user.pnl.minus(position.amount)
      position.pnl = BigInt.zero().minus(position.amount)
    }

    user.save()
    position.save()
  }

  // Create immutable event log
  let eventId = createEventId(event)
  let marketEvent = new MarketEvent(eventId)
  marketEvent.eventType = 'RESOLVED'
  marketEvent.market = marketAddress
  marketEvent.timestamp = event.block.timestamp
  marketEvent.blockNumber = event.block.number
  marketEvent.transactionHash = event.transaction.hash
  marketEvent.save()

  // Update global stats
  let globalStats = getOrCreateGlobalStats()
  globalStats.activeMarkets = globalStats.activeMarkets.minus(BigInt.fromI32(1))
  globalStats.save()
}
