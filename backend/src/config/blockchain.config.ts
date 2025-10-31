import { registerAs } from '@nestjs/config';

export const blockchainConfig = registerAs('blockchain', () => ({
  rpcUrl: process.env.ETHEREUM_RPC_URL,
  wsUrl: process.env.ETHEREUM_WS_URL,
  chainId: parseInt(process.env.ETHEREUM_CHAIN_ID || '1', 10),
  contracts: {
    creatorRegistry: process.env.CREATOR_REGISTRY_ADDRESS,
    paymentEscrow: process.env.PAYMENT_ESCROW_ADDRESS,
    subscriptionManager: process.env.SUBSCRIPTION_MANAGER_ADDRESS,
  },
}));
