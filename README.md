# Jokjipge (족집게)

**Sybil-Resistant Prediction Markets**

> "예측하고, 증명하세요" — Predict and Prove It

Jokjipge is a prediction market platform where KYC verification ensures one person = one identity, preventing Sybil attacks and market manipulation that plague other prediction platforms.

## The Problem

Traditional prediction markets suffer from critical vulnerabilities:

| Problem | Impact |
|---------|--------|
| **Sybil Attacks** | One person creates multiple accounts to distort odds |
| **Wash Trading** | Fake volume attracts unsuspecting bettors |
| **Whale Dominance** | Wealthy actors manipulate markets unfairly |
| **Bot Manipulation** | Automated exploitation of pricing inefficiencies |

## The Solution

Jokjipge leverages VeryChat's KYC infrastructure to create fair prediction markets:

- **One Person, One Identity** — KYC verification prevents multiple accounts
- **Position Limits** — Maximum 100 VERY per user per market outcome
- **Transparent Participation** — All bets recorded on-chain
- **Fair Pricing** — AMM-based odds ensure consistent, mathematical pricing

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contracts** | Solidity 0.8.26, Foundry |
| **Frontend** | Next.js 16, TypeScript, React 19 |
| **UI Components** | shadcn/ui, Tailwind CSS |
| **Authentication** | VeryChat OAuth + WEPIN Wallet |
| **Indexing** | TheGraph (self-hosted) |
| **Chains** | VeryChain (mainnet) |

## Project Structure

```
jokjipge/
├── contracts/           # Solidity smart contracts (Foundry)
│   ├── src/             # Contract source files
│   ├── script/          # Deployment scripts
│   └── test/            # Contract tests
├── frontend/            # Next.js application
│   ├── app/             # Pages and API routes
│   ├── components/      # React components
│   ├── lib/             # Utilities, hooks, types
│   └── constants/       # Configuration
├── subgraph/            # TheGraph indexer
│   ├── src/mappings/    # Event handlers
│   └── schema.graphql   # Data schema
├── scripts/             # Market operation scripts
└── docs/                # Documentation
```

## Smart Contracts

### MarketFactory

Central factory for creating and managing prediction markets.

```solidity
// Create a new market
createMarket(question, category, metadataUri, resolutionTime) → (marketId, marketAddress)

// Resolve a market (owner only)
resolveMarket(marketId, winningOutcome)

// Query markets
getMarket(marketId) → MarketInfo
getAllMarkets() → marketIds[]
```

### PredictionMarket

Individual market contract handling bets, odds calculation, and payouts.

**Key Features:**
- Binary outcomes (Yes/No)
- Constant-product AMM for fair odds
- Position limits (100 VERY max per user)
- Proportional winner payouts

```solidity
// Place a bet
placeBet(outcome) payable  // outcome: 0=No, 1=Yes

// Claim winnings after resolution
claimWinnings()

// Get current odds
getOdds() → (yesOdds, noOdds)
```

**AMM Formula:**
```
shares = (betAmount × otherShares) / (currentShares + betAmount)
odds = otherShares / (currentShares + otherShares)
```

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Market Browser | `/` | Browse, filter, and search markets |
| Market Detail | `/market/[id]` | View odds, place bets, claim winnings |
| My Bets | `/my-bets` | Track positions and P&L |
| Leaderboard | `/leaderboard` | Top predictors by ROI |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- Foundry (for contracts)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/CipherKuma/jokjipge.git
cd jokjipge

# Install frontend dependencies
cd frontend && npm install

# Install contract dependencies
cd ../contracts && forge install

# Install script dependencies
cd ../scripts && npm install
```

### Environment Setup

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_APP_MODE=testnet
NEXT_PUBLIC_INDEXER_URL=http://localhost:8000/subgraphs/name/jokjipge
```

**Contracts** (`contracts/.env`):
```env
PRIVATE_KEY=your_deployer_private_key
```

**Scripts** (`scripts/.env`):
```env
PRIVATE_KEY=your_private_key
```

### Running Locally

```bash
# Start the frontend
cd frontend && npm run dev

# Run contract tests
cd contracts && forge test

# Deploy contracts to testnet
cd contracts && make deploy-testnet
```

## Deployed Contracts

| Network | Chain ID | MarketFactory Address |
|---------|----------|----------------------|
| VeryChain | 4613 | `0x581456618D817a834CBaFC26250c18DEaAC76025` |

## Market Operations

### List All Markets

```bash
cd scripts && npm run list-markets
```

### Create a Market

```bash
cd scripts && npm run create-market "<question>" "<category>" <days_until_resolution>
```

**Categories:** `crypto`, `sports`, `entertainment`, `politics`, `gaming`

**Example:**
```bash
npm run create-market "Will BTC hit 200k?" "crypto" 30
```

### Resolve a Market

Using Foundry (recommended):
```bash
cd contracts && source .env
cast send 0x581456618D817a834CBaFC26250c18DEaAC76025 \
  "resolveMarket(uint256,uint8)" <market_id> <outcome> \
  --rpc-url https://rpc.verylabs.io \
  --private-key $PRIVATE_KEY --chain-id 4613
```

**Outcome values:** `0` = No wins, `1` = Yes wins

## Subgraph

The subgraph indexes all on-chain events for efficient querying.

### Entities

- **Market** — Market details, pools, status
- **Bet** — Individual bet records
- **User** — User stats, positions, P&L
- **Position** — Aggregated user positions per market

### Deployment

Deploy to local graph-node:
```bash
cd subgraph
graph create --node http://localhost:8020/ jokjipge
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 jokjipge
```

## Market Mechanics

### Position Limits (Anti-Sybil)

```
MAX_POSITION = 100 VERY per user per outcome
```

This prevents whale manipulation while allowing meaningful participation.

### Odds Calculation

Using constant-product AMM:
```
yesOdds = totalNoShares / (totalYesShares + totalNoShares)
noOdds = totalYesShares / (totalYesShares + totalNoShares)
```

### Payout Calculation

```
winnings = (userShares / totalWinningShares) × totalPool
```

## Market Categories

| Category | Examples |
|----------|----------|
| **Crypto** | Price predictions, protocol outcomes |
| **Sports** | K-League, KBO, international matches |
| **Entertainment** | K-drama ratings, music charts |
| **Politics** | Election outcomes, policy decisions |
| **Gaming** | Esports, game releases |

## Security

- **ReentrancyGuard** — Prevents reentrancy attacks on claims
- **Position Limits** — Contract-enforced 100 VERY max
- **Access Control** — Only factory owner can resolve markets
- **KYC Verification** — VeryChat ensures one identity per person

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  Market Browser │ Trading UI │ Portfolio │ Leaderboard       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────┬─────────────────┬───────────────────────┐
│   VeryChat Auth   │   WEPIN Wallet  │   VeryChain (EVM)     │
│   KYC Identity    │   Transactions  │   Smart Contracts     │
└───────────────────┴─────────────────┴───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   TheGraph Subgraph                          │
│          Event Indexing │ GraphQL API │ Analytics            │
└─────────────────────────────────────────────────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Use conventional commits:
- `feat:` — New features
- `fix:` — Bug fixes
- `refactor:` — Code refactoring
- `docs:` — Documentation updates
- `test:` — Test additions/updates

## License

This project is licensed under the MIT License.

## Links

- **Repository:** [github.com/CipherKuma/jokjipge](https://github.com/CipherKuma/jokjipge)
- **VeryChain:** [verylabs.io](https://verylabs.io)
- **VeryChat:** [verychat.io](https://verychat.io)
