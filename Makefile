.PHONY: install build test deploy clean dev

# Install dependencies
install:
	forge install foundry-rs/forge-std
	pnpm install

# Build contracts
build:
	forge build

# Run contract tests
test:
	forge test -vvv

# Run crypto tests
test-crypto:
	pnpm test

# Run all tests
test-all:
	forge test -vvv
	pnpm test

# Run integration tests
test-integration:
	forge test --match-path "test/integration/*.sol" -vvv

# Run complete stealth flow tests (comprehensive)
test-stealth:
	./scripts/test-stealth-flow.sh

# Deploy to Sepolia
deploy:
	./scripts/deploy-sepolia.sh

# Deploy to local network
deploy-local:
	@echo "Deploying to local network..."
	forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast

# Test with Anvil (no fork)
test-anvil:
	./scripts/test-anvil.sh

# Test with Anvil fork (requires SEPOLIA_RPC_URL)
test-fork:
	./scripts/test-anvil-fork.sh

# Clean build artifacts
clean:
	forge clean
	rm -rf node_modules .next

# Start local blockchain
anvil:
	anvil

# Start Anvil forking Sepolia (for testing with real state)
anvil-fork:
	@echo "Starting Anvil forking Sepolia..."
	@echo "This gives you a local blockchain with Sepolia state"
	@if [ -z "$$SEPOLIA_RPC_URL" ]; then \
		echo "Error: SEPOLIA_RPC_URL not set in .env"; \
		exit 1; \
	fi
	anvil --fork-url $$SEPOLIA_RPC_URL --chain-id 11155111

# Deploy to Anvil fork (use after starting anvil-fork)
deploy-fork:
	@echo "Deploying to Anvil fork..."
	forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast

# Check account configuration
check-accounts:
	./scripts/check-accounts.sh

# Run frontend dev server
dev:
	npm run dev

# Build frontend
build-frontend:
	npm run build

# Help
help:
	@echo "Available commands:"
	@echo "  make install        - Install all dependencies"
	@echo "  make build          - Build smart contracts"
	@echo "  make test           - Run contract tests"
	@echo "  make test-crypto    - Run cryptography tests"
	@echo "  make test-all       - Run all tests"
	@echo "  make test-integration - Run integration tests"
	@echo "  make test-stealth   - Run complete stealth flow tests"
	@echo "  make deploy         - Deploy to Sepolia (with validation)"
	@echo "  make test-anvil     - Test with Anvil (automated)"
	@echo "  make test-fork      - Test with Anvil fork (automated)"
	@echo "  make check-accounts - Show configured accounts"
	@echo "  make deploy-local   - Deploy to local Anvil"
	@echo "  make deploy-fork    - Deploy to Anvil fork"
	@echo "  make anvil          - Start Anvil blockchain"
	@echo "  make anvil-fork     - Start Anvil forking Sepolia"
	@echo "  make dev            - Start frontend dev server"
	@echo "  make build-frontend - Build frontend"
	@echo "  make clean          - Clean build artifacts"
