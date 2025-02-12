# Payment Contract Project

Smart contract project for handling USDC payments on Base Sepolia testnet.

## Prerequisites

- Node.js v16+
- Bun (for testing)
- Base Sepolia testnet ETH
- Test USDC tokens

## Setup

1. Clone the repository:
```bash
git clone https://github.com/nonomnouns/usdc-meeting-booker-contract.git
```

2. Install dependencies:
```bash
npm install
cd test && npm install
```

3. Create `.env` file in the root directory:
```bash
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here
```

## Contract Deployment

1. Deploy the contract:
```bash
npx hardhat run scripts/deploy.js --network base-sepolia
```

2. Verify the contract:
```bash
npx hardhat verify --network base-sepolia <DEPLOYED_CONTRACT_ADDRESS>
```

## Testing Commands

Navigate to the test directory:
```bash
cd test
```

Available commands:

1. Check USDC allowance:
```bash
bun run index.ts check-allowance
```

2. Make a payment:
```bash
bun run index.ts make-payment
```

3. Read a specific payment:
```bash
bun run index.ts read-payment <PAYMENT_ID>
```

4. Query all payments:
```bash
bun run index.ts query-payments
```

5. Withdraw USDC (owner only):
```bash
bun run index.ts withdraw
```

## Contract Features

- USDC payment handling
- Payment records with metadata (FID, name, email, etc.)
- Owner-only withdrawal function
- Upgradeable contract design

## Security Features

- OpenZeppelin contracts for security
- Owner access control
- Safe USDC transfer handling
- Environment variables for sensitive data
- Proper error handling

## Contract Addresses

- Contract: 0xe1F39230b2D8F43b097CA4a6D0b3B9b2B6da91a0
- USDC (Test): 0x833615562852909e079C1304892587943d2879bC //this mock usdc, you can use another token for testing

## Development

1. Making changes to the contract:
```bash
# After modifying the contract
npx hardhat compile
npx hardhat run scripts/deploy.js --network base-sepolia
```

2. Running security tests:
```bash
cd test
bun run index.ts withdraw  # Includes unauthorized access test
```

## Notes

- Make sure to have sufficient Base Sepolia ETH for gas fees
- Test USDC tokens are required for payments use another token for test, and deploy in your contract
