# Makefile for Foundry Project
.PHONY: all test clean build install update

# Configuration
-include .env

# Colors for output
GREEN := \033[0;32m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
all: clean install build test

###################
# Setup & Install #
###################

# Install dependencies
install:
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@forge install foundry-rs/forge-std --no-commit
	@forge install OpenZeppelin/openzeppelin-contracts --no-commit
	@forge install OpenZeppelin/openzeppelin-contracts-upgradeable --no-commit
	@forge install transmissions11/solmate --no-commit
	@forge install Vectorized/solady --no-commit
	@forge soldeer install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

# Update dependencies
update:
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@forge update
	@forge soldeer update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

# Setup environment
setup:
	@echo "$(BLUE)Setting up environment...$(NC)"
	@cp -n .env.example .env || true
	@echo "$(GREEN)✓ Environment setup complete$(NC)"
	@echo "$(RED)⚠️  Don't forget to update .env with your values$(NC)"

###################
# Build & Compile #
###################

# Build contracts
build:
	@echo "$(BLUE)Building contracts...$(NC)"
	@forge build
	@echo "$(GREEN)✓ Build complete$(NC)"

# Build with specific profile
build-ci:
	@echo "$(BLUE)Building contracts (CI profile)...$(NC)"
	@FOUNDRY_PROFILE=ci forge build
	@echo "$(GREEN)✓ Build complete$(NC)"

# Build optimized for production
build-prod:
	@echo "$(BLUE)Building contracts (Production profile)...$(NC)"
	@FOUNDRY_PROFILE=production forge build
	@echo "$(GREEN)✓ Production build complete$(NC)"

# Clean build artifacts
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@forge clean
	@rm -rf cache out
	@echo "$(GREEN)✓ Clean complete$(NC)"

#############
# Testing   #
#############

# Run all tests
test:
	@echo "$(BLUE)Running tests...$(NC)"
	@forge test -vv
	@echo "$(GREEN)✓ Tests complete$(NC)"

# Run tests with gas report
test-gas:
	@echo "$(BLUE)Running tests with gas report...$(NC)"
	@forge test --gas-report
	@echo "$(GREEN)✓ Gas report complete$(NC)"

# Run tests with coverage
test-coverage:
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@forge coverage
	@echo "$(GREEN)✓ Coverage complete$(NC)"

###################
# Fork Testing    #
###################

# Get fork RPC URL based on network
get-fork-rpc:
	@echo $(shell \
		if [ "$(NETWORK)" = "sepolia" ]; then \
			echo "$(SEPOLIA_RPC_URL)"; \
		else \
			echo "$(SEPOLIA_RPC_URL)"; \
		fi)

# Run tests on forked network
test-fork:
	@echo "$(BLUE)Running tests on forked $(NETWORK)...$(NC)"
	@FORK_RPC=$$($(MAKE) -s get-fork-rpc); \
	forge test --fork-url $$FORK_RPC -vv
	@echo "$(GREEN)✓ Fork tests complete$(NC)"

# Run tests on forked network with gas report
test-fork-gas:
	@echo "$(BLUE)Running fork tests with gas report...$(NC)"
	@FORK_RPC=$$($(MAKE) -s get-fork-rpc); \
	forge test --fork-url $$FORK_RPC --gas-report
	@echo "$(GREEN)✓ Fork gas report complete$(NC)"

# Deploy to forked network
deploy-fork:
	@echo "$(BLUE)Deploying to forked $(NETWORK)...$(NC)"
	@echo "$(YELLOW)This is a FORK deployment - no real transactions$(NC)"
	@FORK_RPC=$$($(MAKE) -s get-fork-rpc); \
	forge script script/Deploy.s.sol:DeployScript --fork-url $$FORK_RPC --broadcast -vv
	@echo "$(GREEN)✓ Fork deployment complete$(NC)"

# Test deployment on fork
test-fork-deployment:
	@echo "$(BLUE)Testing deployment on forked $(NETWORK)...$(NC)"
	@FORK_RPC=$$($(MAKE) -s get-fork-rpc); \
	forge script script/ForkTest.s.sol:ForkTestScript --fork-url $$FORK_RPC -vv
	@echo "$(GREEN)✓ Fork deployment test complete$(NC)"

# Interact with fork deployment  
fork-interact:
	@echo "$(BLUE)Interacting with forked $(NETWORK) contracts...$(NC)"
	@FORK_RPC=$$($(MAKE) -s get-fork-rpc); \
	forge script script/Interactions.s.sol:InteractionsScript --fork-url $$FORK_RPC --broadcast -vv
	@echo "$(GREEN)✓ Fork interaction complete$(NC)"

# Test specific contract on fork
fork-test-contract:
	@echo "$(BLUE)Testing $(CONTRACT) on forked $(NETWORK)...$(NC)"
	@FORK_RPC=$$($(MAKE) -s get-fork-rpc); \
	forge test --fork-url $$FORK_RPC --match-contract $(CONTRACT) -vv
	@echo "$(GREEN)✓ Contract fork test complete$(NC)"

# Run fork tests with specific block number
test-fork-at-block:
	@echo "$(BLUE)Running tests on forked $(NETWORK) at block $(BLOCK)...$(NC)"
	@FORK_RPC=$$($(MAKE) -s get-fork-rpc); \
	forge test --fork-url $$FORK_RPC --fork-block-number $(BLOCK) -vv
	@echo "$(GREEN)✓ Fork tests at block $(BLOCK) complete$(NC)"

# Deploy with fork verification workflow
deploy-with-fork-test:
	@echo "$(BLUE)Full fork testing workflow for $(NETWORK)...$(NC)"
	@echo "$(YELLOW)Step 1: Fork testing...$(NC)"
	@$(MAKE) test-fork NETWORK=$(NETWORK)
	@echo "$(YELLOW)Step 2: Fork deployment...$(NC)"  
	@$(MAKE) deploy-fork NETWORK=$(NETWORK)
	@echo "$(YELLOW)Step 3: Fork deployment verification...$(NC)"
	@$(MAKE) test-fork-deployment NETWORK=$(NETWORK)
	@echo "$(GREEN)✓ Fork testing complete - ready for live deployment$(NC)"

# Run specific test
test-contract:
	@echo "$(BLUE)Running tests for $(CONTRACT)...$(NC)"
	@forge test --match-contract $(CONTRACT) -vvv

# Run specific test function
test-function:
	@echo "$(BLUE)Running test $(TEST)...$(NC)"
	@forge test --match-test $(TEST) -vvvv

# Run unit tests only
test-unit:
	@echo "$(BLUE)Running unit tests...$(NC)"
	@forge test --match-path "test/unit/*" -vv
	@echo "$(GREEN)✓ Unit tests complete$(NC)"

# Run integration tests only
test-integration:
	@echo "$(BLUE)Running integration tests...$(NC)"
	@forge test --match-path "test/integration/*" -vv
	@echo "$(GREEN)✓ Integration tests complete$(NC)"

# Run fuzz tests with more runs
test-fuzz:
	@echo "$(BLUE)Running fuzz tests (intensive)...$(NC)"
	@FOUNDRY_PROFILE=deep forge test --match-path "test/fuzz/*" -vv
	@echo "$(GREEN)✓ Fuzz tests complete$(NC)"

# Run invariant tests
test-invariant:
	@echo "$(BLUE)Running invariant tests...$(NC)"
	@forge test --match-path "test/invariant/*" -vv
	@echo "$(GREEN)✓ Invariant tests complete$(NC)"

# Watch mode for tests
test-watch:
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	@forge test --watch

#############
# Snapshot  #
#############

# Create gas snapshot
snapshot:
	@echo "$(BLUE)Creating gas snapshot...$(NC)"
	@forge snapshot
	@echo "$(GREEN)✓ Snapshot created$(NC)"

# Check gas snapshot
snapshot-check:
	@echo "$(BLUE)Checking gas snapshot...$(NC)"
	@forge snapshot --check
	@echo "$(GREEN)✓ Snapshot check complete$(NC)"

###################
# Formatting      #
###################

# Format code
format:
	@echo "$(BLUE)Formatting code...$(NC)"
	@forge fmt
	@echo "$(GREEN)✓ Formatting complete$(NC)"

# Check formatting
format-check:
	@echo "$(BLUE)Checking formatting...$(NC)"
	@forge fmt --check
	@echo "$(GREEN)✓ Format check complete$(NC)"

###################
# Documentation   #
###################

# Generate documentation
docs:
	@echo "$(BLUE)Generating documentation...$(NC)"
	@forge doc
	@echo "$(GREEN)✓ Documentation generated$(NC)"

# Serve documentation locally
docs-serve:
	@echo "$(BLUE)Serving documentation...$(NC)"
	@forge doc --serve --port 4000

###################
# Deployment      #
###################

# ===========================================
# VERYCHAIN MAINNET DEPLOYMENT WORKFLOW
# ===========================================
# 1. make simulate          - Test on local Anvil
# 2. make simulate-full     - Full simulation with bets
# 3. make deploy-verychain  - Deploy to VeryChain mainnet
# ===========================================

# Start Anvil for simulation
anvil-sim:
	@echo "$(BLUE)Starting Anvil for simulation...$(NC)"
	@anvil --chain-id 31337 --block-time 2

# Simulate deployment on local Anvil (deploy + seed only)
simulate:
	@echo "$(BLUE)Simulating deployment on Anvil...$(NC)"
	@forge script script/SimulateDeployment.s.sol:SimulateDeploymentScript \
		--sig "runDeployOnly()" \
		--rpc-url localhost \
		--broadcast \
		-vvvv
	@echo "$(GREEN)✓ Simulation complete$(NC)"

# Full simulation (deploy + seed + bets + resolution + claims)
simulate-full:
	@echo "$(BLUE)Running full simulation on Anvil...$(NC)"
	@forge script script/SimulateDeployment.s.sol:SimulateDeploymentScript \
		--rpc-url localhost \
		--broadcast \
		-vvvv
	@echo "$(GREEN)✓ Full simulation complete$(NC)"

# Dry run on VeryChain (no broadcast)
dry-run-verychain:
	@echo "$(BLUE)Dry run on VeryChain (no broadcast)...$(NC)"
	@forge script script/DeployAndSeed.s.sol:DeployAndSeedScript \
		--rpc-url verychain \
		-vvvv
	@echo "$(GREEN)✓ Dry run complete$(NC)"

# Deploy to VeryChain mainnet with seeding
deploy-verychain:
	@echo "$(RED)⚠️  DEPLOYING TO VERYCHAIN MAINNET...$(NC)"
	@echo "$(YELLOW)This will deploy MarketFactory and seed 6 markets$(NC)"
	@forge script script/DeployAndSeed.s.sol:DeployAndSeedScript \
		--rpc-url verychain \
		--broadcast \
		--slow \
		-vvvv
	@echo "$(GREEN)✓ VeryChain deployment complete$(NC)"

# Deploy to VeryChain mainnet (no seeding)
deploy-verychain-only:
	@echo "$(RED)⚠️  DEPLOYING TO VERYCHAIN MAINNET (NO SEEDING)...$(NC)"
	@forge script script/DeployAndSeed.s.sol:DeployAndSeedScript \
		--sig "runDeployOnly()" \
		--rpc-url verychain \
		--broadcast \
		--slow \
		-vvvv
	@echo "$(GREEN)✓ VeryChain deployment complete$(NC)"

# Deploy to VeryChain with verification
deploy-verychain-verify:
	@echo "$(RED)⚠️  DEPLOYING TO VERYCHAIN MAINNET WITH VERIFICATION...$(NC)"
	@forge script script/DeployAndSeed.s.sol:DeployAndSeedScript \
		--rpc-url verychain \
		--broadcast \
		--verify \
		--verifier blockscout \
		--verifier-url https://scan.verylabs.io/api \
		--slow \
		-vvvv
	@echo "$(GREEN)✓ VeryChain deployment with verification complete$(NC)"

# Seed existing VeryChain deployment
seed-verychain:
	@echo "$(BLUE)Seeding markets on VeryChain...$(NC)"
	@forge script script/DeployAndSeed.s.sol:DeployAndSeedScript \
		--sig "runSeedOnly(address)" $(FACTORY) \
		--rpc-url verychain \
		--broadcast \
		--slow \
		-vvvv
	@echo "$(GREEN)✓ Seeding complete$(NC)"

# Verify contract on VeryChain Blockscout
verify-verychain:
	@echo "$(BLUE)Verifying contract on VeryChain Blockscout...$(NC)"
	@forge verify-contract $(ADDRESS) $(CONTRACT) \
		--chain 713715 \
		--verifier blockscout \
		--verifier-url https://scan.verylabs.io/api \
		--watch
	@echo "$(GREEN)✓ Verification complete$(NC)"

# ===========================================
# END VERYCHAIN WORKFLOW
# ===========================================

# Deploy to local network
deploy-local:
	@echo "$(BLUE)Deploying to local network...$(NC)"
	@forge script script/Deploy.s.sol:DeployScript --rpc-url localhost --broadcast
	@echo "$(GREEN)✓ Local deployment complete$(NC)"

# Deploy to testnet with Blockscout verification
deploy-testnet:
	@echo "$(BLUE)Deploying to testnet ($(NETWORK))...$(NC)"
	@forge script script/Deploy.s.sol:DeployScript --rpc-url $(NETWORK) --broadcast --verify --verifier blockscout --slow
	@echo "$(GREEN)✓ Testnet deployment complete$(NC)"

# Deploy to mainnet with Blockscout verification
deploy-mainnet:
	@echo "$(RED)⚠️  Deploying to MAINNET ($(NETWORK))...$(NC)"
	@forge script script/Deploy.s.sol:DeployScript --rpc-url $(NETWORK) --broadcast --verify --verifier blockscout --slow
	@echo "$(GREEN)✓ Mainnet deployment complete$(NC)"

# Deploy to Tenderly DevNet
deploy-tenderly:
	@echo "$(BLUE)Deploying to Tenderly DevNet...$(NC)"
	@forge script script/TenderlyDebug.s.sol:TenderlyDebugScript --sig "deployToTenderly()" --rpc-url tenderly --broadcast --slow
	@echo "$(GREEN)✓ Tenderly deployment complete$(NC)"

# Deploy with deterministic addresses
deploy-deterministic:
	@echo "$(BLUE)Deploying with deterministic addresses...$(NC)"
	@forge script script/Deploy.s.sol:DeployScript --sig "runDeterministic()" --rpc-url $(NETWORK) --broadcast
	@echo "$(GREEN)✓ Deterministic deployment complete$(NC)"

# Verify deployment works correctly
verify-deployment:
	@echo "$(BLUE)Verifying deployment on $(NETWORK)...$(NC)"
	@forge script script/ForkTest.s.sol:ForkTestScript --rpc-url $(NETWORK) -vv
	@echo "$(GREEN)✓ Deployment verification complete$(NC)"

# Verify contract on Blockscout
verify:
	@echo "$(BLUE)Verifying contract on Blockscout...$(NC)"
	@forge verify-contract $(ADDRESS) $(CONTRACT) --chain $(NETWORK) --verifier blockscout --watch
	@echo "$(GREEN)✓ Verification complete$(NC)"

# Verify contract on Tenderly
# Note: Tenderly mimics Etherscan's API, so we must use --verifier etherscan even though it's Tenderly
verify-tenderly:
	@echo "$(BLUE)Verifying contract on Tenderly...$(NC)"
	@forge verify-contract $(ADDRESS) $(CONTRACT) --chain $(NETWORK) --verifier etherscan --verifier-url $(TENDERLY_VERIFIER_URL) --etherscan-api-key $(TENDERLY_ACCESS_TOKEN) --watch
	@echo "$(GREEN)✓ Tenderly verification complete$(NC)"

###################
# Interactions    #
###################

# Interact with deployed contract
interact-increment:
	@echo "$(BLUE)Incrementing counter...$(NC)"
	@forge script script/Interactions.s.sol:InteractionsScript --sig "increment()" --rpc-url $(NETWORK) --broadcast

interact-info:
	@echo "$(BLUE)Getting contract info...$(NC)"
	@forge script script/Interactions.s.sol:InteractionsScript --sig "getInfo()" --rpc-url $(NETWORK)

# Debug failed transaction
debug-tx:
	@echo "$(BLUE)Debugging transaction...$(NC)"
	@echo "$(YELLOW)First attempting cast debug...$(NC)"
	@cast run $(TX_HASH) --rpc-url $(RPC_URL) || echo "$(RED)Cast debug failed - use Tenderly$(NC)"
	@forge script script/TenderlyDebug.s.sol:DebugFailedTransaction --sig "debugTransaction(bytes32)" $(TX_HASH) --rpc-url $(NETWORK)

# Get detailed error info from Tenderly
debug-tx-details:
	@echo "$(BLUE)Getting detailed error info from Tenderly...$(NC)"
	@forge script script/TenderlyDebug.s.sol:DebugFailedTransaction --sig "getErrorDetails(bytes32)" $(TX_HASH) --rpc-url $(NETWORK)

# Show debugging workflow
debug-workflow:
	@echo "$(BLUE)Showing debugging workflow...$(NC)"
	@forge script script/DebugHelper.s.sol:DebugHelper --sig "showDebugWorkflow()"

# Simulate failure for debugging
simulate-failure:
	@echo "$(BLUE)Simulating transaction failure...$(NC)"
	@forge script script/TenderlyDebug.s.sol:DebugFailedTransaction --sig "simulateFailure(address,bytes)" $(TARGET) $(DATA) --rpc-url $(NETWORK) --broadcast

###################
# Security        #
###################

# Run slither
slither:
	@echo "$(BLUE)Running Slither analysis...$(NC)"
	@slither . --config-file slither.config.json || true
	@echo "$(GREEN)✓ Slither analysis complete$(NC)"

# Run mythril
mythril:
	@echo "$(BLUE)Running Mythril analysis...$(NC)"
	@myth analyze src/Counter.sol
	@echo "$(GREEN)✓ Mythril analysis complete$(NC)"

###################
# Utilities       #
###################

# Start local node
anvil:
	@echo "$(BLUE)Starting Anvil...$(NC)"
	@anvil --fork-url $(MAINNET_RPC_URL) --fork-block-number $(FORK_BLOCK)

# Start local node (basic)
anvil-basic:
	@echo "$(BLUE)Starting Anvil (basic)...$(NC)"
	@anvil

# Generate remappings
remappings:
	@echo "$(BLUE)Generating remappings...$(NC)"
	@forge remappings > remappings.txt
	@echo "$(GREEN)✓ Remappings generated$(NC)"

# Show storage layout
storage:
	@echo "$(BLUE)Showing storage layout for $(CONTRACT)...$(NC)"
	@forge inspect $(CONTRACT) storage-layout --pretty

# Show contract size
size:
	@echo "$(BLUE)Checking contract sizes...$(NC)"
	@forge build --sizes

# Cast commands
cast-balance:
	@cast balance $(ADDRESS) --rpc-url $(NETWORK)

cast-code:
	@cast code $(ADDRESS) --rpc-url $(NETWORK)

# Tenderly commands
tenderly-info:
	@echo "$(BLUE)Getting Tenderly DevNet info...$(NC)"
	@forge script script/TenderlyDebug.s.sol:TenderlyVerificationHelper --sig "getDevNetInfo()" --rpc-url tenderly

# Debug with Tenderly API
tenderly-api-debug:
	@echo "$(BLUE)Debugging with Tenderly API...$(NC)"
	@curl -X GET "https://api.tenderly.co/api/v1/account/$$TENDERLY_USERNAME/project/$$TENDERLY_PROJECT/tx/$(TX_HASH)" \
		-H "X-Access-Key: $$TENDERLY_ACCESS_TOKEN" | jq '.'

# Simulate transaction on Tenderly
tenderly-simulate:
	@echo "$(BLUE)Simulating transaction on Tenderly...$(NC)"
	@curl -X POST "https://api.tenderly.co/api/v1/account/$$TENDERLY_USERNAME/project/$$TENDERLY_PROJECT/simulate" \
		-H "X-Access-Key: $$TENDERLY_ACCESS_TOKEN" \
		-H "Content-Type: application/json" \
		-d '{"network_id": "$(CHAIN_ID)", "from": "$(FROM)", "to": "$(TO)", "input": "$(DATA)", "value": "0"}' | jq '.'

tenderly-verify-all:
	@echo "$(BLUE)Verifying all contracts on Tenderly...$(NC)"
	@forge script script/TenderlyDebug.s.sol:TenderlyVerificationHelper --sig "verifyAll()" --rpc-url tenderly --broadcast

###################
# CI/CD           #
###################

# Run CI pipeline
ci: clean build format-check test test-gas

# Pre-commit hook
pre-commit: format test

###################
# Help            #
###################

###################
# Soldeer         #
###################

# Install package with soldeer
soldeer-install:
	@echo "$(BLUE)Installing package $(PACKAGE)...$(NC)"
	@forge soldeer install $(PACKAGE)
	@echo "$(GREEN)✓ Package installed$(NC)"

# Update soldeer dependencies
soldeer-update:
	@echo "$(BLUE)Updating soldeer dependencies...$(NC)"
	@forge soldeer update
	@echo "$(GREEN)✓ Soldeer dependencies updated$(NC)"

# Push package to soldeer
soldeer-push:
	@echo "$(BLUE)Pushing package to soldeer...$(NC)"
	@forge soldeer push $(PACKAGE)
	@echo "$(GREEN)✓ Package pushed$(NC)"

# Login to soldeer
soldeer-login:
	@echo "$(BLUE)Logging in to soldeer...$(NC)"
	@forge soldeer login
	@echo "$(GREEN)✓ Logged in$(NC)"

###################
# Advanced Testing #
###################

# Run table tests
test-table:
	@echo "$(BLUE)Running table tests...$(NC)"
	@forge test --match-test "test.*_Table" -vv
	@echo "$(GREEN)✓ Table tests complete$(NC)"

# Run gas snapshot tests
test-gas-snapshot:
	@echo "$(BLUE)Running gas snapshot tests...$(NC)"
	@forge test --match-test "test_gasSnapshot" -vv --gas-report
	@echo "$(GREEN)✓ Gas snapshot tests complete$(NC)"

# Create detailed gas snapshot
snapshot-detailed:
	@echo "$(BLUE)Creating detailed gas snapshot...$(NC)"
	@forge snapshot --match-test "test_gasSnapshot" --asc
	@echo "$(GREEN)✓ Detailed snapshot created$(NC)"

# Compare gas snapshots
snapshot-diff:
	@echo "$(BLUE)Comparing gas snapshots...$(NC)"
	@forge snapshot --diff
	@echo "$(GREEN)✓ Snapshot comparison complete$(NC)"

###################
# EIP-712         #
###################

# Test EIP-712 implementation
test-eip712:
	@echo "$(BLUE)Testing EIP-712 implementation...$(NC)"
	@forge test --match-contract "EIP712" -vvv
	@echo "$(GREEN)✓ EIP-712 tests complete$(NC)"

# Generate EIP-712 hash
eip712-hash:
	@echo "$(BLUE)Generating EIP-712 hash...$(NC)"
	@forge eip712 hash

###################
# Chisel REPL     #
###################

# Start Chisel REPL
chisel:
	@echo "$(BLUE)Starting Chisel REPL...$(NC)"
	@chisel

# Load contract in Chisel
chisel-load:
	@echo "$(BLUE)Loading contract in Chisel...$(NC)"
	@chisel --prelude "Counter counter = new Counter();"

# Show help
help:
	@echo "$(BLUE)Foundry Project Makefile$(NC)"
	@echo ""
	@echo "$(GREEN)Setup & Install:$(NC)"
	@echo "  make install          - Install dependencies"
	@echo "  make update          - Update dependencies"
	@echo "  make setup           - Setup environment"
	@echo ""
	@echo "$(GREEN)Build & Compile:$(NC)"
	@echo "  make build           - Build contracts"
	@echo "  make build-ci        - Build with CI profile"
	@echo "  make build-prod      - Build with production profile"
	@echo "  make clean           - Clean build artifacts"
	@echo ""
	@echo "$(GREEN)Testing:$(NC)"
	@echo "  make test            - Run all tests"
	@echo "  make test-gas        - Run tests with gas report"
	@echo "  make test-coverage   - Run tests with coverage"
	@echo "  make test-unit       - Run unit tests only"
	@echo "  make test-fuzz       - Run fuzz tests (intensive)"
	@echo "  make test-invariant  - Run invariant tests"
	@echo ""
	@echo "$(GREEN)VeryChain Mainnet Workflow (RECOMMENDED):$(NC)"
	@echo "  make anvil-sim       - Start Anvil for simulation"
	@echo "  make simulate        - Simulate deploy+seed on Anvil"
	@echo "  make simulate-full   - Full simulation with bets/claims"
	@echo "  make dry-run-verychain - Dry run on VeryChain (no tx)"
	@echo "  make deploy-verychain - Deploy to VeryChain + seed markets"
	@echo "  make deploy-verychain-only - Deploy without seeding"
	@echo "  make deploy-verychain-verify - Deploy + verify on Blockscout"
	@echo "  make seed-verychain FACTORY=0x... - Seed existing deployment"
	@echo "  make verify-verychain ADDRESS=0x... CONTRACT=MarketFactory - Verify"
	@echo ""
	@echo "$(GREEN)Fork Testing:$(NC)"
	@echo "  make test-fork       - Run tests on forked network"
	@echo "  make test-fork-gas   - Run fork tests with gas report"
	@echo "  make deploy-fork     - Deploy to forked network"
	@echo "  make test-fork-deployment - Test deployment on fork"
	@echo "  make fork-interact   - Interact with fork deployment"
	@echo "  make deploy-with-fork-test - Full fork testing workflow"
	@echo ""
	@echo "$(GREEN)Other Deployment:$(NC)"
	@echo "  make deploy-local    - Deploy to local network"
	@echo "  make deploy-testnet  - Deploy to testnet with Blockscout"
	@echo "  make deploy-mainnet  - Deploy to mainnet with Blockscout"
	@echo "  make deploy-tenderly - Deploy to Tenderly DevNet"
	@echo "  make verify          - Verify contract on Blockscout"
	@echo "  make verify-tenderly - Verify contract on Tenderly"
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@echo "  make format          - Format code"
	@echo "  make docs            - Generate documentation"
	@echo "  make size            - Check contract sizes"
	@echo ""
	@echo "$(GREEN)Soldeer:$(NC)"
	@echo "  make soldeer-install - Install package with soldeer"
	@echo "  make soldeer-update  - Update soldeer dependencies"
	@echo "  make soldeer-push    - Push package to soldeer"
	@echo ""
	@echo "$(GREEN)Advanced Testing:$(NC)"
	@echo "  make test-table      - Run table tests"
	@echo "  make test-gas-snapshot - Run gas snapshot tests"
	@echo "  make snapshot-detailed - Create detailed gas snapshot"
	@echo ""
	@echo "$(GREEN)Debugging:$(NC)"
	@echo "  make debug-tx        - Debug failed transaction (cast first, then Tenderly)"
	@echo "  make debug-tx-details - Get detailed error info from Tenderly"
	@echo "  make simulate-failure - Simulate transaction failure"
	@echo "  make tenderly-info   - Get Tenderly DevNet info"
	@echo "  make tenderly-api-debug - Debug with Tenderly API directly"
	@echo "  make tenderly-simulate - Simulate transaction on Tenderly"
	@echo ""
	@echo "$(GREEN)Environment Variables:$(NC)"
	@echo "  NETWORK              - Network to deploy to"
	@echo "  ADDRESS              - Contract address"
	@echo "  CONTRACT             - Contract name"
	@echo "  PACKAGE              - Soldeer package name"
	@echo "  TX_HASH              - Transaction hash for debugging"