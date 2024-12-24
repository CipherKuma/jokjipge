# Jokjipge (족집게) — Product Requirements Document

## Sybil-Resistant Prediction Markets

---

## 1. Executive Summary

**Product Name:** Jokjipge (족집게)
**Tagline:** "예측하고, 증명하세요" (Predict and Prove It)
**Category:** Prediction Markets / Social Gaming

Jokjipge is a prediction market platform where KYC verification ensures one person = one identity, preventing Sybil attacks and market manipulation that plague other prediction platforms.

---

## 2. Problem Statement

### The Prediction Market Manipulation Problem

Prediction markets should aggregate collective intelligence. Instead, they're gaming playgrounds.

**Current Pain Points:**

| Problem | Impact |
|---------|--------|
| **Sybil Attacks** | One person, many accounts, distorted odds |
| **Wash Trading** | Fake volume to attract real bettors |
| **Bot Manipulation** | Automated exploitation of markets |
| **Whale Dominance** | Rich actors move markets unfairly |
| **Legal Grey Areas** | Anonymous = unregulated = risky |

### The Opportunity

VeryChat's KYC creates unique advantages:
- One identity per person
- Accountability for market manipulation
- Legal defensibility in regulated markets

---

## 3. Solution Overview

Jokjipge creates fair prediction markets where:

1. **One Person, One Identity** — KYC prevents multiple accounts
2. **Position Limits** — Max bet per person, not per account
3. **Transparent Participation** — See who's betting (optional)
4. **Social Predictions** — Friend groups, communities
5. **Fair Resolution** — Decentralized oracle with staked reporters

---

## 4. Target Users

### Primary: Casual Predictors
- Sports fans
- K-drama enthusiasts
- Pop culture followers
- Want friendly stakes

### Secondary: Serious Forecasters
- Data-driven predictors
- Build prediction reputation
- Participate in high-stakes markets

### Tertiary: Market Creators
- Create custom markets
- Earn fees as market maker
- Community leaders

---

## 5. Market Categories

| Category | Examples |
|----------|----------|
| **Sports** | K-League, KBO, EPL, MLB results |
| **Entertainment** | K-drama ratings, music chart positions |
| **Politics** | Election outcomes, policy decisions |
| **Crypto** | Price predictions, protocol outcomes |
| **Economy** | Interest rates, unemployment figures |
| **Events** | Weather, celebrity news, tech releases |
| **Custom** | User-created markets |

---

## 6. User Flows

### Flow 1: Making a Prediction

```
1. User opens Jokjipge
2. Logs in with VeryChat
3. Browses markets or searches
4. Opens market:
   - "Will BTS release new album in Q1 2025?"
   - Current odds: Yes 65%, No 35%
   - Volume: 50,000 VERY
   - Closes: Dec 31, 2024
5. Selects position: "Yes"
6. Enters amount: 100 VERY
7. Reviews potential payout
8. Connects Wepin wallet
9. Confirms prediction
10. Position recorded
```

### Flow 2: Creating a Market

```
1. User clicks "마켓 만들기" (Create Market)
2. Fills details:
   - Question (clear, binary or multiple choice)
   - Category
   - Resolution date
   - Resolution source
   - Initial liquidity (optional)
3. Sets parameters:
   - Market type (binary/multiple/scalar)
   - Min/max bet
   - Fee percentage (0-5%)
4. Deposits initial liquidity (optional)
5. Market goes to review
6. If approved, goes live
7. Creator earns fees on trades
```

### Flow 3: Market Resolution

```
1. Resolution date arrives
2. Resolution options:
   a. Automated (for data-feed markets)
   b. Reporter-based
   c. DAO vote

For Reporter-based:
3. Staked reporters propose outcome
4. Challenge period (24h)
5. If challenged:
   - Additional reporters weigh in
   - Majority wins
   - Wrong reporters slashed
6. Market resolves
7. Winners can claim
```

### Flow 4: Social Betting

```
1. User in VeryChat group
2. Creates group market:
   - "Who wins poker night?"
   - Participants: Group members only
   - Each person votes/bets
3. Shares to group
4. Group members place predictions
5. Results visible to group
6. Winner takes pot (minus small fee)
```

### Flow 5: Leaderboard Competition

```
1. User checks leaderboard
2. Sees top predictors:
   - Win rate
   - ROI
   - Streak
   - Categories
3. Can follow top predictors
4. Gets alerts on their predictions
5. Competes for monthly prizes
```

---

## 7. Feature Breakdown

### Core Features (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Market Browser** | Discover and search markets | P0 |
| **Binary Markets** | Yes/No predictions | P0 |
| **Position Taking** | Place predictions with VERY | P0 |
| **Portfolio View** | Track open positions | P0 |
| **Market Resolution** | Automated + manual resolution | P0 |
| **Claim Winnings** | Withdraw after resolution | P0 |
| **Position Limits** | Per-person betting caps | P0 |
| **Basic Leaderboard** | Top predictors | P0 |

### Market Types

| Type | Description | Example |
|------|-------------|---------|
| **Binary** | Yes/No | "Will X happen?" |
| **Multiple Choice** | Select one of N | "Who will win?" |
| **Scalar** | Numeric range | "What will price be?" |
| **Conditional** | If X, then Y | "If elected, will they...?" |

### Secondary Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Market Creation** | User-generated markets | P1 |
| **Social Markets** | Private group predictions | P1 |
| **Multi-choice Markets** | More than 2 outcomes | P1 |
| **Follow System** | Track top predictors | P1 |
| **Market Alerts** | Price movement notifications | P2 |
| **Prediction Sharing** | Share positions to social | P2 |

### Anti-Manipulation Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **KYC Requirement** | One account per person | P0 |
| **Position Limits** | Max bet per person/market | P0 |
| **Velocity Limits** | Rate limiting on trades | P1 |
| **Whale Alerts** | Flag large positions | P1 |
| **Market Circuit Breakers** | Pause on extreme swings | P2 |

---

## 8. Technical Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  - Market Browser                                           │
│  - Trading Interface                                        │
│  - Portfolio Dashboard                                      │
│  - Leaderboards                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Services                       │
│  - Market Management                                        │
│  - Order Processing                                         │
│  - Leaderboard Engine                                       │
│  - Notification Service                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────┬─────────────────┬───────────────────────┐
│   VeryChat Auth   │   Wepin Wallet  │   VeryChain (EVM)     │
│   - KYC           │   - Buy shares  │   - MarketFactory     │
│   - Identity      │   - Claim wins  │   - PredictionMarket  │
│                   │                 │   - OracleRegistry    │
└───────────────────┴─────────────────┴───────────────────────┘
```

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| **MarketFactory** | Create new prediction markets |
| **PredictionMarket** | Individual market logic |
| **AMM** | Automated market maker for liquidity |
| **OracleRegistry** | Resolution sources and reporters |
| **PositionManager** | Track per-person limits |

### Data Model

**Market:**
- marketId
- question
- category
- outcomes[]
- resolutionDate
- resolutionSource
- creator
- totalVolume
- status (open/closed/resolved)
- result

**Position:**
- positionId
- marketId
- userId
- outcome (selected option)
- amount
- sharesBought
- createdAt
- claimed

**User Stats:**
- userId
- totalPredictions
- wins
- losses
- totalWagered
- totalWon
- winRate
- roi
- streak

---

## 9. Resolution Mechanisms

### Automated Resolution

| Source | Markets |
|--------|---------|
| **Sports APIs** | Game scores, match results |
| **Price Feeds** | Crypto prices, stocks |
| **Government Data** | Election results, economic indicators |

### Reporter-Based Resolution

| Step | Process |
|------|---------|
| 1 | Market closes |
| 2 | Staked reporters (500+ VERY stake) can submit |
| 3 | First reporter posts outcome + evidence |
| 4 | 24h challenge period |
| 5 | If unchallenged, reporter wins fee |
| 6 | If challenged, more reporters weigh in |
| 7 | Majority wins, losers slashed |

### DAO Resolution

For contentious/subjective markets:
- All VERY holders can vote
- Weighted by stake
- Used as last resort

---

## 10. Success Metrics

### Primary KPIs

| Metric | Target (3 months) |
|--------|-------------------|
| Markets created | 500+ |
| Unique predictors | 3,000+ |
| Total volume | 2M+ VERY |
| Correct resolution rate | >99% |
| Dispute rate | <1% |

### Secondary KPIs

| Metric | Target |
|--------|--------|
| Avg market volume | 5,000+ VERY |
| Repeat users (weekly) | 50% |
| Social markets created | 200+ |
| User-created markets | 100+ |

---

## 11. Korean Market Positioning

### Messaging

**Primary:** "공정한 예측, 실력으로 증명"  
(Fair predictions, prove your skill)

**Secondary:** "조작 없는 예측 마켓"  
(Manipulation-free prediction market)

### Cultural Alignment

| Korean Trend | Jokjipge Feature |
|--------------|---------------------|
| Sports betting culture | K-League, KBO markets |
| K-drama obsession | Entertainment predictions |
| Esports popularity | Gaming outcome markets |
| Group activities | Social/group predictions |

### Market Ideas (Korea-specific)

| Market | Example |
|--------|---------|
| **K-Drama** | "Will 'Squid Game 3' beat Season 2 ratings?" |
| **K-Pop** | "Will NewJeans win MAMA Daesang?" |
| **Politics** | "Will minimum wage increase in 2025?" |
| **Sports** | "KBO Championship winner?" |
| **Tech** | "Will Samsung Galaxy S25 outsell iPhone 16?" |

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Regulatory issues | High | High | Focus on non-financial predictions first |
| Manipulation attempts | Medium | High | KYC + position limits + monitoring |
| Low liquidity | Medium | Medium | AMM for consistent trading |
| Resolution disputes | Medium | Medium | Clear rules, staked reporters |
| Addiction concerns | Medium | Medium | Betting limits, cool-off periods |

---

## 13. Legal Considerations

### Korean Law

- Pure gambling is illegal
- Skill-based prediction may be defensible
- Focus on non-monetary outcomes initially
- Consult legal before launch

### Platform Positioning

- "Social prediction game"
- Emphasis on skill and knowledge
- Leaderboards over gambling
- Community competition

---

## 14. Demo Script (For Hackathon)

### Scene 1: The Problem (20 sec)
- "Prediction markets: Sybil attacks, manipulation"
- "One person, 10 accounts, distorted odds"

### Scene 2: Fair Market (40 sec)
- Browse markets
- Show KYC verified badge
- "One person, one identity"
- Place prediction

### Scene 3: Position Limits (30 sec)
- Show max bet per person
- "No whales manipulating"
- Fair participation

### Scene 4: Social Betting (30 sec)
- Create group prediction
- Friends participate
- Fun competition

### Scene 5: Resolution (20 sec)
- Market resolves
- Claim winnings
- Leaderboard update

### Closing (10 sec)
- "조작 없는 예측 마켓. Jokjipge"

---

## 15. Timeline Estimate

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Design | 2 days | UI/UX, market mechanics |
| Smart Contracts | 5 days | Markets, AMM, resolution |
| Backend | 4 days | Market mgmt, leaderboards |
| Frontend | 5 days | All screens, trading UX |
| Oracle System | 2 days | Resolution mechanisms |
| Integration | 2 days | VeryChat, Wepin |
| Testing | 2 days | Market testing |
| Demo Prep | 1 day | Recording |
| **Total** | **~3 weeks** | |

---

## 16. Open Questions

1. Position limits: Flat amount or percentage of pool?
2. Should prediction history be public or private?
3. Minimum liquidity for market to go live?
4. What categories to avoid for legal reasons?
5. Reporter stake amount for resolution?
