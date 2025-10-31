# Friendsly Smart Contracts

**Designed by Friendsly Team**

## Overview

Complete smart contract infrastructure for Friendsly - A decentralized Web3 creator platform.

### Core Contracts

1. **CreatorRegistry** - Manages creator registration, verification, and profiles
2. **PaymentEscrow** - Secure escrow system for all payments with automatic fee distribution
3. **SubscriptionManager** - NFT-based subscription system (ERC-721)

## Architecture

```
┌─────────────────┐
│ SubscriptionMgr │
│   (ERC-721)     │
└────────┬────────┘
         │
    ┌────▼────┐         ┌──────────────┐
    │ Payment │◄────────┤   Creator    │
    │ Escrow  │         │   Registry   │
    └─────────┘         └──────────────┘
```

## Quick Start

### Installation

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# With coverage
npm run test:coverage
```

### Deploy

```bash
# Local network
npm run node              # Terminal 1
npm run deploy:local      # Terminal 2

# Testnet (Sepolia)
npm run deploy:testnet

# Mainnet
npm run deploy:mainnet
```

## Contract Specifications

### CreatorRegistry

**Purpose:** Central registry for all creators

**Key Features:**
- Username registration (unique)
- Profile metadata (IPFS)
- Subscription price management
- Verification system
- Reputation tracking

**Events:**
- `CreatorRegistered(address indexed creator, string username, uint256 timestamp)`
- `CreatorVerified(address indexed creator, uint256 timestamp)`
- `ProfileUpdated(address indexed creator, string profileCID, uint256 timestamp)`

### PaymentEscrow

**Purpose:** Secure payment processing with automatic splits

**Key Features:**
- 10% platform fee (configurable)
- 90% to creator
- Automatic payment distribution
- Refund capability
- Withdrawal system

**Payment Types:**
- Tips
- Subscriptions
- Content purchases

**Events:**
- `PaymentReceived(bytes32 indexed paymentId, address indexed payer, address indexed creator, uint256 amount, PaymentType paymentType)`
- `PaymentCompleted(bytes32 indexed paymentId, address indexed creator, uint256 creatorAmount, uint256 platformFee)`

### SubscriptionManager

**Purpose:** Manage subscriptions via NFTs

**Key Features:**
- Each subscription = ERC-721 NFT
- 30-day subscription periods
- Auto-renewal support
- Non-transferable while active
- Multiple subscription tracking

**Events:**
- `Subscribed(uint256 indexed tokenId, address indexed subscriber, address indexed creator, uint256 price, uint256 endTime)`
- `SubscriptionRenewed(uint256 indexed tokenId, address indexed subscriber, uint256 newEndTime)`
- `SubscriptionCancelled(uint256 indexed tokenId, address indexed subscriber, uint256 timestamp)`

## Security Features

✅ ReentrancyGuard on all state-changing functions
✅ Pausable for emergency stops
✅ Role-based access control (RBAC)
✅ Input validation
✅ Safe math (built-in Solidity 0.8+)
✅ Event logging for all critical actions

## Gas Optimization

- Efficient storage patterns
- Minimal SLOAD operations
- Batch operations where possible
- Optimized loops

## Testing

Comprehensive test suite with:
- Unit tests for each contract
- Integration tests for cross-contract interactions
- Edge case coverage
- Gas reporting

**Current Coverage:** Target 90%+

## Deployment Addresses

After deployment, addresses are saved to:
- `deployments/deployment-{network}-latest.json`
- `deployments/contracts-{network}.ts` (TypeScript constants)

## Integration Guide

### Frontend Integration

```typescript
import { ethers } from 'ethers';
import { CONTRACTS } from './contracts-mainnet';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const registry = new ethers.Contract(
  CONTRACTS.CREATOR_REGISTRY,
  CreatorRegistryABI,
  provider
);
```

### Backend Integration

```typescript
import { ethers } from 'ethers';
import { CONTRACTS } from './deployments/contracts-mainnet';

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const escrow = new ethers.Contract(
  CONTRACTS.PAYMENT_ESCROW,
  PaymentEscrowABI,
  wallet
);
```

## Audit Status

- [ ] Internal audit complete
- [ ] External audit pending
- [ ] Bug bounty program (TBD)

## License

MIT

## Support

For technical support or questions:
- Discord: [Link]
- Documentation: [Link]
- GitHub Issues: [Link]

---

**Built with ❤️ by the Friendsly Team**
