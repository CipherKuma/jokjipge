import { BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { User, Market, Position, GlobalStats, DailyStats } from '../../generated/schema'

// ============ Constants ============

const GLOBAL_STATS_ID = 'global'
const SECONDS_PER_DAY = 86400

// ============ User Helpers ============

export function getOrCreateUser(address: Bytes): User {
  let id = address.toHexString().toLowerCase()
  let user = User.load(id)

  if (!user) {
    user = new User(id)
    user.totalBets = BigInt.zero()
    user.totalWagered = BigInt.zero()
    user.totalWon = BigInt.zero()
    user.totalLost = BigInt.zero()
    user.pnl = BigInt.zero()
    user.winCount = BigInt.zero()
    user.lossCount = BigInt.zero()
    user.save()
  }

  return user
}

// ============ Market Helpers ============

export function getOrCreateMarket(marketAddress: Bytes): Market | null {
  let id = marketAddress.toHexString().toLowerCase()
  return Market.load(id)
}

// ============ Position Helpers ============

export function getOrCreatePosition(user: User, market: Market, outcome: i32): Position {
  // ID includes outcome so YES and NO positions are tracked separately
  let id = user.id + '-' + market.id + '-' + outcome.toString()
  let position = Position.load(id)

  if (!position) {
    position = new Position(id)
    position.user = user.id
    position.market = market.id
    position.outcome = outcome
    position.amount = BigInt.zero()
    position.shares = BigInt.zero()
    position.claimed = false
    position.pnl = null
    position.save()
  }

  return position
}

// ============ Global Stats Helpers ============

export function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load(GLOBAL_STATS_ID)

  if (!stats) {
    stats = new GlobalStats(GLOBAL_STATS_ID)
    stats.totalMarkets = BigInt.zero()
    stats.totalBets = BigInt.zero()
    stats.totalVolume = BigInt.zero()
    stats.activeMarkets = BigInt.zero()
    stats.save()
  }

  return stats
}

// ============ Daily Stats Helpers ============

export function getOrCreateDailyStats(timestamp: BigInt): DailyStats {
  let dayTimestamp = timestamp.div(BigInt.fromI32(SECONDS_PER_DAY))
    .times(BigInt.fromI32(SECONDS_PER_DAY))
  let id = dayTimestamp.toString()

  let stats = DailyStats.load(id)

  if (!stats) {
    stats = new DailyStats(id)
    stats.date = dayTimestamp
    stats.marketsCreated = BigInt.zero()
    stats.betsPlaced = BigInt.zero()
    stats.volumeTraded = BigInt.zero()
    stats.save()
  }

  return stats
}

// ============ ID Helpers ============

export function createEventId(event: ethereum.Event): Bytes {
  return event.transaction.hash.concatI32(event.logIndex.toI32())
}

export function createBetId(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
}
