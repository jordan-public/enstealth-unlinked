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

# Deploy to Sepolia
deploy:
	@echo "Deploying to Sepolia..."
	forge script script/Deploy.s.sol:DeployScript --rpc-url sepolia --broadcast --verify

# Deploy to local network
deploy-local:
	@echo "Deploying to local network..."
	forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast

# Clean build artifacts
clean:
	forge clean
	rm -rf node_modules .next

# Start local blockchain
anvil:
	anvil

# Run frontend dev server
dev:
	npm run dev

# Build frontend
build-frontend:test-crypto    - Run cryptography tests"
	@echo "  make test-all       - Run all tests"
	@echo "  make 
	npm run build

# Help
help:
	@echo "Available commands:"
	@echo "  make install        - Install all dependencies"
	@echo "  make build          - Build smart contracts"
	@echo "  make test           - Run contract tests"
	@echo "  make deploy         - Deploy to Sepolia"
	@echo "  make deploy-local   - Deploy to local network"
	@echo "  make anvil          - Start local blockchain"
	@echo "  make dev            - Start frontend dev server"
	@echo "  make clean          - Clean build artifacts"
