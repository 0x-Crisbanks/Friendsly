import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { CreatorRegistryService } from '../contracts/creator-registry.service';
import { PaymentEscrowService } from '../contracts/payment-escrow.service';
import { SubscriptionManagerService } from '../contracts/subscription-manager.service';

/**
 * Blockchain Event Listener Service
 * Listens to smart contract events and syncs with database
 */
@Injectable()
export class BlockchainListenerService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainListenerService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private creatorRegistryService: CreatorRegistryService,
    private paymentEscrowService: PaymentEscrowService,
    private subscriptionManagerService: SubscriptionManagerService,
  ) {}

  async onModuleInit() {
    const blockchainEnabled = this.configService.get('BLOCKCHAIN_ENABLED') !== 'false';

    if (!blockchainEnabled) {
      this.logger.warn('⚠️  Blockchain listeners DISABLED (BLOCKCHAIN_ENABLED=false)');
      return;
    }

    this.logger.log('🎧 Initializing blockchain event listeners...');
    try {
      this.setupCreatorListeners();
      this.setupPaymentListeners();
      this.setupSubscriptionListeners();
      this.logger.log('✅ Blockchain listeners initialized');
    } catch (error) {
      this.logger.error(`❌ Failed to initialize blockchain listeners: ${error.message}`);
    }
  }

  /**
   * Setup Creator Registry event listeners
   */
  private setupCreatorListeners() {
    // Listen to CreatorRegistered events
    this.creatorRegistryService.onCreatorRegistered(
      async (creatorAddress: string, username: string, timestamp: bigint) => {
        this.logger.log(`📢 CreatorRegistered: ${creatorAddress} (${username})`);

        try {
          // Get full creator data from contract
          const creatorData = await this.creatorRegistryService.getCreator(creatorAddress);

          // Find user by wallet address
          const user = await this.prisma.user.findUnique({
            where: { walletAddress: creatorAddress },
          });

          if (user) {
            // Update or create creator record
            await this.prisma.creator.upsert({
              where: { walletAddress: creatorAddress },
              create: {
                userId: user.id,
                walletAddress: creatorAddress,
                username: creatorData.username,
                displayName: creatorData.username,
                subscriptionPrice: creatorData.subscriptionPrice,
                onChainId: BigInt(Date.now()), // Placeholder
                isVerifiedOnChain: creatorData.verified,
                contractAddress: this.creatorRegistryService.getContractAddress(),
              },
              update: {
                username: creatorData.username,
                subscriptionPrice: creatorData.subscriptionPrice,
                isVerifiedOnChain: creatorData.verified,
              },
            });

            this.logger.log(`✅ Creator synced to database: ${creatorAddress}`);
          }
        } catch (error) {
          this.logger.error(`❌ Error syncing creator: ${error.message}`);
        }
      },
    );

    // Listen to CreatorVerified events
    this.creatorRegistryService.onCreatorVerified(async (creatorAddress: string, timestamp: bigint) => {
      this.logger.log(`📢 CreatorVerified: ${creatorAddress}`);

      try {
        await this.prisma.creator.update({
          where: { walletAddress: creatorAddress },
          data: {
            isVerifiedOnChain: true,
            verifiedAt: new Date(Number(timestamp) * 1000),
          },
        });

        this.logger.log(`✅ Creator verification synced: ${creatorAddress}`);
      } catch (error) {
        this.logger.error(`❌ Error syncing verification: ${error.message}`);
      }
    });
  }

  /**
   * Setup Payment Escrow event listeners
   */
  private setupPaymentListeners() {
    // Listen to PaymentReceived events
    this.paymentEscrowService.onPaymentReceived(
      async (paymentId: string, payer: string, creator: string, amount: bigint, paymentType: number) => {
        this.logger.log(`📢 PaymentReceived: ${paymentId}`);

        try {
          // Get payment details from contract
          const paymentData = await this.paymentEscrowService.getPayment(paymentId);

          // Find payer and creator users
          const [payerUser, creatorUser] = await Promise.all([
            this.prisma.user.findUnique({ where: { walletAddress: payer } }),
            this.prisma.creator.findUnique({ where: { walletAddress: creator } }),
          ]);

          if (payerUser && creatorUser) {
            // Store payment in database
            await this.prisma.payment.create({
              data: {
                payerId: payerUser.id,
                creatorId: creatorUser.id,
                transactionHash: paymentId, // Use paymentId as hash placeholder
                blockNumber: BigInt(0), // Will be updated
                contractAddress: this.paymentEscrowService.getContractAddress(),
                fromAddress: payer,
                toAddress: creator,
                amount: paymentData.totalAmount.toString(),
                totalAmount: paymentData.totalAmount,
                creatorAmount: paymentData.creatorAmount,
                platformFee: paymentData.platformFee,
                paymentType: ['TIP', 'SUBSCRIPTION', 'CONTENT_PURCHASE'][paymentType] as any,
                status: 'PROCESSING',
              },
            });

            this.logger.log(`✅ Payment synced to database: ${paymentId}`);
          }
        } catch (error) {
          this.logger.error(`❌ Error syncing payment: ${error.message}`);
        }
      },
    );

    // Listen to PaymentCompleted events
    this.paymentEscrowService.onPaymentCompleted(
      async (paymentId: string, creator: string, creatorAmount: bigint, platformFee: bigint) => {
        this.logger.log(`📢 PaymentCompleted: ${paymentId}`);

        try {
          // Update payment status
          await this.prisma.payment.updateMany({
            where: { transactionHash: paymentId },
            data: {
              status: 'COMPLETED',
              confirmedAt: new Date(),
            },
          });

          // Update creator earnings
          await this.prisma.creator.update({
            where: { walletAddress: creator },
            data: {
              totalEarnings: {
                increment: creatorAmount.toString(),
              },
            },
          });

          this.logger.log(`✅ Payment completion synced: ${paymentId}`);
        } catch (error) {
          this.logger.error(`❌ Error syncing payment completion: ${error.message}`);
        }
      },
    );
  }

  /**
   * Setup Subscription Manager event listeners
   */
  private setupSubscriptionListeners() {
    // Listen to Subscribed events
    this.subscriptionManagerService.onSubscribed(
      async (tokenId: bigint, subscriber: string, creator: string, price: bigint, endTime: bigint) => {
        this.logger.log(`📢 Subscribed: Token ${tokenId} - ${subscriber} to ${creator}`);

        try {
          // Find subscriber and creator
          const [subscriberUser, creatorRecord] = await Promise.all([
            this.prisma.user.findUnique({ where: { walletAddress: subscriber } }),
            this.prisma.creator.findUnique({ where: { walletAddress: creator } }),
          ]);

          if (subscriberUser && creatorRecord) {
            // Get subscription start time
            const startTime = new Date();
            const endDate = new Date(Number(endTime) * 1000);

            // Create subscription record
            await this.prisma.subscription.create({
              data: {
                subscriberId: subscriberUser.id,
                creatorId: creatorRecord.id,
                tokenId: Number(tokenId),
                nftTokenId: tokenId,
                contractAddress: this.subscriptionManagerService.getContractAddress(),
                transactionHash: `sub_${tokenId}`,
                startDate: startTime,
                endDate: endDate,
                startTime: startTime,
                endTime: endDate,
                amount: price.toString(),
                price: price.toString(),
                isActive: true,
                autoRenew: true,
                status: 'ACTIVE',
              },
            });

            // Update creator subscriber count
            await this.prisma.creator.update({
              where: { id: creatorRecord.id },
              data: {
                totalSubscribers: {
                  increment: 1,
                },
              },
            });

            this.logger.log(`✅ Subscription synced: Token ${tokenId}`);
          }
        } catch (error) {
          this.logger.error(`❌ Error syncing subscription: ${error.message}`);
        }
      },
    );

    // Listen to SubscriptionCancelled events
    this.subscriptionManagerService.onSubscriptionCancelled(
      async (tokenId: bigint, subscriber: string, timestamp: bigint) => {
        this.logger.log(`📢 SubscriptionCancelled: Token ${tokenId}`);

        try {
          // Update subscription status
          await this.prisma.subscription.updateMany({
            where: { nftTokenId: tokenId },
            data: {
              isActive: false,
              status: 'CANCELLED',
            },
          });

          this.logger.log(`✅ Subscription cancellation synced: Token ${tokenId}`);
        } catch (error) {
          this.logger.error(`❌ Error syncing cancellation: ${error.message}`);
        }
      },
    );
  }
}
