import { BigInt, Bytes, Address } from '@graphprotocol/graph-ts'
import {
  BetPlaced,
  Claimed,
  MarketResolved as MarketResolvedEvent
} from '../../generated/templates/PredictionMarket/PredictionMarket'
import { Market, Bet, BetEvent, Position } from '../../generated/schema'
import {
  getOrCreateUser,
  getOrCreatePosition,
  getOrCreateGlobalStats,
  getOrCreateDailyStats,
  createEventId,
  createBetId
} from './utils'

// ============ Event Handlers ============

export function handleBetPlaced(event: BetPlaced): void {
  let marketAddress = event.address
  let marketId = marketAddress.toHexString().toLowerCase()
  let market = Market.load(marketId)

  if (!market) return

  let userAddress = event.params.bettor
  let user = getOrCreateUser(Bytes.fromHexString(userAddress.toHexString()))
  let position = getOrCreatePosition(user, market, event.params.outcome)

  // Calculate approximate odds at time of bet
  let totalPool = market.yesPool.plus(market.noPool)
  let odds = BigInt.zero()
  if (totalPool.gt(BigInt.zero())) {
    if (event.params.outcome == 1) {
      odds = market.noPool.times(BigInt.fromI64(1000000000000000000)).div(totalPool)
    } else {
      odds = market.yesPool.times(BigInt.fromI64(1000000000000000000)).div(totalPool)
    }
  } else {
    odds = BigInt.fromI64(500000000000000000) // 50%
  }

  // Create bet entity
  let betId = createBetId(event)
  let bet = new Bet(betId)
  bet.market = market.id
  bet.user = user.id
  bet.outcome = event.params.outcome
  bet.amount = event.params.amount
  bet.shares = event.params.shares
  bet.odds = odds
  bet.createdAt = event.block.timestamp
  bet.claimed = false
  bet.claimedAmount = null
  bet.save()

  // Update position (outcome is already set in getOrCreatePosition)
  position.amount = position.amount.plus(event.params.amount)
  position.shares = position.shares.plus(event.params.shares)
  position.save()

  // Track position ID in market for resolution updates
  let positionIds = market.positionIds
  if (!positionIds.includes(position.id)) {
    positionIds.push(position.id)
    market.positionIds = positionIds
  }

  // Update market pools
  if (event.params.outcome == 1) {
    market.yesPool = market.yesPool.plus(event.params.shares)
  } else {
    market.noPool = market.noPool.plus(event.params.shares)
  }
  market.totalVolume = market.totalVolume.plus(event.params.amount)
  market.save()

  // Update user stats
  user.totalBets = user.totalBets.plus(BigInt.fromI32(1))
  user.totalWagered = user.totalWagered.plus(event.params.amount)
  user.save()

  // Create immutable event log
  let eventId = createEventId(event)
  let betEvent = new BetEvent(eventId)
  betEvent.user = userAddress
  betEvent.market = marketAddress
  betEvent.outcome = event.params.outcome
  betEvent.amount = event.params.amount
  betEvent.timestamp = event.block.timestamp
  betEvent.blockNumber = event.block.number
  betEvent.transactionHash = event.transaction.hash
  betEvent.save()

  // Update global stats
  let globalStats = getOrCreateGlobalStats()
  globalStats.totalBets = globalStats.totalBets.plus(BigInt.fromI32(1))
  globalStats.totalVolume = globalStats.totalVolume.plus(event.params.amount)
  globalStats.save()

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp)
  dailyStats.betsPlaced = dailyStats.betsPlaced.plus(BigInt.fromI32(1))
  dailyStats.volumeTraded = dailyStats.volumeTraded.plus(event.params.amount)
  dailyStats.save()
}

export function handleClaimed(event: Claimed): void {
  let marketAddress = event.address
  let marketId = marketAddress.toHexString().toLowerCase()
  let market = Market.load(marketId)

  if (!market || market.result === null) return

  let userAddress = event.params.claimer
  let userId = userAddress.toHexString().toLowerCase()
  let user = getOrCreateUser(Bytes.fromHexString(userAddress.toHexString()))

  // Find the winning position (outcome matches market result)
  let winningOutcome = market.result as i32
  let positionId = userId + '-' + marketId + '-' + winningOutcome.toString()
  let position = Position.load(positionId)

  if (position) {
    position.claimed = true
    position.save()

    // Only update totalWon here - pnl and winCount already set in handleMarketResolved
    user.totalWon = user.totalWon.plus(event.params.amount)
    user.save()
  }
}

// Note: Market resolution is handled by MarketFactory.handleMarketResolved
// This handler is kept for backwards compatibility but does minimal work
export function handleMarketResolved(event: MarketResolvedEvent): void {
  // Resolution logic moved to market-factory.ts to update user stats
  // This event fires from individual market contracts but the factory
  // event has all the same data and handles position updates
}
