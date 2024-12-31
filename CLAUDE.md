# Jokjipge (족집게) - VeryChain dApp

**⭐ Reference Implementation: `../04-shinroe/`**

Always look at Shinroe for patterns, code structure, and implementation details. Copy and adapt from Shinroe, not from template/.

---

## Stack Overview

| Layer | Technology | Notes |
|-------|------------|-------|
| **Auth** | WEPIN | Only auth layer supporting VeryChain mainnet |
| **Chat** | VeryChat API | Messaging integration |
| **Indexing** | TheGraph (self-hosted) | No external indexers support VeryChain |
| **Contracts** | Foundry | EVM compatible |
| **Frontend** | Next.js + shadcn/ui | Standard template |

---

## Critical Rules

**NEVER mock or create placeholder code.** If blocked, STOP and explain why.

- No scope creep - only implement what's requested
- No assumptions - ask for clarification
- Follow existing patterns in Shinroe (`../04-shinroe/`)
- Verify work before completing
- Use conventional commits (`feat:`, `fix:`, `refactor:`)

---

## Before Starting Any Work

1. **Read the PRD:** `../../prds/06-jokjipge-prd.md`
2. **Reference Shinroe:** Look at `../04-shinroe/` for all patterns
3. **Load required skills** before starting tasks

---

## File Size Limits (CRITICAL)

**HARD LIMIT: 300 lines per file maximum. NO EXCEPTIONS.**

---

## Documentation Lookup (MANDATORY)

**ALWAYS use Context7 MCP for documentation. NEVER use WebFetch for docs.**

---

## DO NOT

- **Create files over 300 lines**
- **Use WebFetch for documentation** - Use Context7
- **Skip loading skills**
- Mock WEPIN/VeryChat implementations
- Use `template/` as reference - use `04-shinroe/` instead

## DO

- **Reference `../04-shinroe/`** for all patterns and code
- **Use `/strategy`** to plan multi-step integrations
- **Use Context7 MCP** for all documentation
- Keep files under 300 lines

---

## Issues & Learnings (READ BEFORE STARTING)

### Before Starting These Tasks, Read Relevant Issues:

| Task Type | Read First |
|-----------|------------|
| Contract deployment | `docs/issues/contracts/README.md` → CONTRACT-001 (get PRIVATE_KEY first!) |
| Contract testing | `docs/issues/contracts/README.md` → CONTRACT-001 |
| Subgraph deployment | `docs/issues/subgraph/README.md` → SUBGRAPH-001 (local graph-node only!) |
| Subgraph integration | `docs/issues/subgraph/README.md` → SUBGRAPH-001 |
| i18n / multilingual | `docs/issues/ui/README.md` |
| VeryChain specifics | `docs/issues/verychain/README.md` |

### Key Learnings Summary

1. **Contract Deployment**: Copy `.env` from `../04-shinroe/contracts/.env` for `PRIVATE_KEY`. Deploy to **VeryChain Mainnet** (chain ID: 4613).

2. **Subgraph Deployment**: ALWAYS deploy to local graph-node at `/Users/gabrielantonyxaviour/Documents/starters/very/graph-node/`, NEVER to Graph Studio.
   ```bash
   graph create --node http://localhost:8020/ <project-name>
   graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 <project-name>
   ```

---

## Market Operations (Demo Scripts)

Scripts are in `scripts/` folder. **ALWAYS run from `scripts/` directory.**

### Prerequisites
```bash
cd scripts && npm install
```

Requires `PRIVATE_KEY` in `scripts/.env` (copy from `../contracts/.env`).

### List All Markets
```bash
cd scripts && npm run list-markets
```
Shows all markets with: ID, question, category, status, pool size, resolution date.

### Create a Market
```bash
cd scripts && npm run create-market "<question>" "<category>" <days>
```

**Parameters:**
- `question`: The prediction question (in quotes)
- `category`: One of `crypto`, `sports`, `entertainment`, `politics`, `gaming`
- `days`: Days until resolution (positive integer)

**Example:**
```bash
npm run create-market "Will BTC hit 200k by end of 2025?" "crypto" 30
```

### Resolve a Market (Foundry - Recommended)
```bash
cd contracts && source .env && cast send 0x581456618D817a834CBaFC26250c18DEaAC76025 \
  "resolveMarket(uint256,uint8)" <market_id> <outcome> \
  --rpc-url https://rpc.verylabs.io \
  --private-key $PRIVATE_KEY \
  --chain-id 4613
```

**Parameters:**
- `market_id`: The market ID (0, 1, 2, etc.) from `list-markets`
- `outcome`: `0` = NO wins, `1` = YES wins

**Examples:**
```bash
# Market #3, YES wins
cd contracts && source .env && cast send 0x581456618D817a834CBaFC26250c18DEaAC76025 \
  "resolveMarket(uint256,uint8)" 3 1 \
  --rpc-url https://rpc.verylabs.io \
  --private-key $PRIVATE_KEY --chain-id 4613

# Market #0, NO wins
cd contracts && source .env && cast send 0x581456618D817a834CBaFC26250c18DEaAC76025 \
  "resolveMarket(uint256,uint8)" 0 0 \
  --rpc-url https://rpc.verylabs.io \
  --private-key $PRIVATE_KEY --chain-id 4613
```

### Create a Market (Foundry)
```bash
cd contracts && source .env && cast send 0x581456618D817a834CBaFC26250c18DEaAC76025 \
  "createMarket(string,string,uint256)" "<question>" "<category>" <resolution_timestamp> \
  --rpc-url https://rpc.verylabs.io \
  --private-key $PRIVATE_KEY --chain-id 4613
```

**Calculate resolution timestamp:**
```bash
# 30 days from now
echo $(($(date +%s) + 30*24*60*60))
```

**Example:**
```bash
cd contracts && source .env && cast send 0x581456618D817a834CBaFC26250c18DEaAC76025 \
  "createMarket(string,string,uint256)" "Will BTC hit 200k?" "crypto" 1738000000 \
  --rpc-url https://rpc.verylabs.io \
  --private-key $PRIVATE_KEY --chain-id 4613
```

**IMPORTANT:** Only the contract deployer can resolve markets. After resolution:
1. Subgraph indexes the `MarketResolved` event
2. Market status changes to `RESOLVED`
3. Users can claim winnings from `/my-bets` page
