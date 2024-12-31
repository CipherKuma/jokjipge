# Jokjipge (족집게) - Hackathon Submission

## 1. One-Liner Vision

**Sybil-resistant prediction markets where KYC ensures one person = one identity, eliminating manipulation and creating fair collective intelligence.**

---

## 2. GitHub URL

**GitHub:** https://github.com/CipherKuma/jokjipge

---

## 3. Key Innovation Domains

1. **DeFi / Prediction Markets**
2. **Digital Identity & Sybil Resistance**
3. **Social Gaming**

---

## 4. Detailed Description

### The Problem

Prediction markets should aggregate collective intelligence—but they've become manipulation playgrounds:

| Problem | Impact |
|---------|--------|
| **Sybil Attacks** | One person creates many accounts, distorting odds |
| **Wash Trading** | Fake volume attracting real bettors |
| **Bot Manipulation** | Automated exploitation of markets |
| **Whale Dominance** | Rich actors moving markets unfairly |

Traditional prediction platforms have no way to enforce "one person, one vote" because they lack identity verification.

### Our Solution: Jokjipge (족집게)

Jokjipge ("precision tweezers" in Korean) leverages VeryChat's KYC infrastructure to create the first truly fair prediction market platform:

**Core Innovation: Identity-Bound Prediction Markets**

- **One Person = One Identity**: VeryChat KYC verification ensures each participant has exactly one account
- **Position Limits Per Person**: Maximum 100 VERY bet per person per market (not per account)
- **Transparent Participation**: Accountability prevents market manipulation
- **AMM-Based Odds**: Constant-product automated market maker ensures fair pricing

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                        │
│  • Market Browser with category filtering                   │
│  • Trading interface with real-time odds                    │
│  • Portfolio dashboard (My Bets)                            │
│  • Leaderboard with win rates & ROI                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────┬─────────────────┬───────────────────────┐
│   VeryChat Auth   │   WEPIN Wallet  │   Smart Contracts     │
│   • KYC verified  │   • Native tx   │   • MarketFactory     │
│   • 1 identity    │   • Claim wins  │   • PredictionMarket  │
└───────────────────┴─────────────────┴───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                TheGraph Subgraph (Self-hosted)              │
│  • Real-time market indexing                                │
│  • User positions & leaderboards                            │
│  • Market resolution events                                 │
└─────────────────────────────────────────────────────────────┘
```

### Smart Contract Features

**PredictionMarket.sol:**
- Binary outcome markets (Yes/No predictions)
- Constant-product AMM for fair odds calculation
- Position limits: MAX_POSITION = 100 VERY per user
- Proportional payout calculation on resolution
- ReentrancyGuard for security

**MarketFactory.sol:**
- Creates new prediction markets
- Market resolution by authorized resolvers
- Category-based market organization

### Key Features

| Feature | Description |
|---------|-------------|
| **Market Browser** | Discover markets by category (Crypto, Sports, Entertainment, Politics, Gaming) |
| **Real-time Odds** | AMM-based odds update with each trade |
| **Position Tracking** | "My Bets" dashboard shows all open/resolved positions |
| **Leaderboard** | Track top predictors by win rate and ROI |
| **Claim Winnings** | One-click claim after market resolution |

### Market Categories

- **Crypto**: "Will BTC hit 200k by end of 2025?"
- **Sports**: K-League, KBO, EPL match outcomes
- **Entertainment**: K-drama ratings, award predictions
- **Politics**: Election outcomes, policy decisions
- **Gaming**: Esports tournament results

### Why VeryChain?

VeryChain's ecosystem provides unique advantages:
1. **VeryChat KYC**: Built-in identity verification eliminates Sybil attacks
2. **WEPIN Wallet**: Seamless onboarding for Korean users
3. **Native Integration**: Direct access to VeryChat social features

### Anti-Manipulation Mechanisms

1. **KYC Requirement**: One verified account per person
2. **Position Limits**: 100 VERY max per person per market
3. **Transparent History**: All bets recorded on-chain
4. **Fair Resolution**: Decentralized oracle with staked reporters

### Demo Flow

1. **Browse Markets**: Filter by category, see live odds
2. **Place Prediction**: Select outcome, enter amount, confirm via WEPIN
3. **Track Position**: Monitor odds changes in "My Bets"
4. **Claim Winnings**: After resolution, one-click claim

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contracts** | Solidity (Foundry) |
| **Frontend** | Next.js 14, TypeScript, shadcn/ui |
| **Wallet** | WEPIN SDK |
| **Auth** | VeryChat OAuth |
| **Indexing** | TheGraph (self-hosted) |
| **Styling** | Tailwind CSS, dark theme |

---

## Korean Market Positioning

**Tagline:** "조작 없는 예측 마켓" (Manipulation-free prediction market)

**Cultural Fit:**
- Sports betting culture → K-League, KBO markets
- K-drama obsession → Entertainment predictions
- Esports popularity → Gaming outcome markets
- Group activities → Social prediction features

---

*Jokjipge (족집게) - Fair predictions, prove your skill.*
