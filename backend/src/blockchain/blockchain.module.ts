import { Module } from '@nestjs/common';
import { Web3Service } from './web3.service';
import { IpfsService } from './ipfs.service';
import { CreatorRegistryService } from './contracts/creator-registry.service';
import { PaymentEscrowService } from './contracts/payment-escrow.service';
import { SubscriptionManagerService } from './contracts/subscription-manager.service';
import { BlockchainListenerService } from './listeners/blockchain-listener.service';

/**
 * Blockchain Module
 * Handles all Web3 and smart contract interactions
 */
@Module({
  providers: [
    Web3Service,
    IpfsService,
    CreatorRegistryService,
    PaymentEscrowService,
    SubscriptionManagerService,
    BlockchainListenerService,
  ],
  exports: [
    Web3Service,
    IpfsService,
    CreatorRegistryService,
    PaymentEscrowService,
    SubscriptionManagerService,
  ],
})
export class BlockchainModule {}
