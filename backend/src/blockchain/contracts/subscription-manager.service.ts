import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Web3Service } from '../web3.service';

const SUBSCRIPTION_MANAGER_ABI = [
  'function subscribe(address creator) external payable returns (uint256 tokenId)',
  'function renewSubscription(uint256 tokenId) external payable',
  'function cancelSubscription(uint256 tokenId) external',
  'function setAutoRenew(uint256 tokenId, bool enabled) external',
  'function isSubscriptionActive(uint256 tokenId) external view returns (bool)',
  'function isActiveSubscriber(address subscriber, address creator) external view returns (bool)',
  'function getSubscription(uint256 tokenId) external view returns (tuple(uint256 tokenId, address subscriber, address creator, uint256 startTime, uint256 endTime, uint256 price, bool active, bool autoRenew))',
  'function getUserSubscriptions(address subscriber) external view returns (uint256[])',
  'function getCreatorSubscribers(address creator) external view returns (address[])',
  'function getSubscriberCount(address creator) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'event Subscribed(uint256 indexed tokenId, address indexed subscriber, address indexed creator, uint256 price, uint256 endTime)',
  'event SubscriptionRenewed(uint256 indexed tokenId, address indexed subscriber, uint256 newEndTime)',
  'event SubscriptionCancelled(uint256 indexed tokenId, address indexed subscriber, uint256 timestamp)',
  'event AutoRenewToggled(uint256 indexed tokenId, address indexed subscriber, bool autoRenew)',
];

/**
 * Subscription Manager Contract Service
 */
@Injectable()
export class SubscriptionManagerService {
  private readonly logger = new Logger(SubscriptionManagerService.name);
  private contract: ethers.Contract | null = null;
  private contractAddress: string;

  constructor(
    private web3Service: Web3Service,
    private configService: ConfigService,
  ) {
    this.contractAddress = this.configService.get<string>('blockchain.contracts.subscriptionManager') || '';
    this.initializeContract();
  }

  private initializeContract() {
    if (!this.contractAddress || this.contractAddress === '0x0000000000000000000000000000000000000000') {
      this.logger.warn('⚠️  SubscriptionManager contract address not configured');
      return;
    }

    try {
      this.contract = this.web3Service.getContract(this.contractAddress, SUBSCRIPTION_MANAGER_ABI);
      this.logger.log(`✅ SubscriptionManager contract initialized at ${this.contractAddress}`);
    } catch (error) {
      this.logger.error(`❌ Failed to initialize SubscriptionManager contract: ${error.message}`);
    }
  }

  /**
   * Check if subscription is active
   */
  async isSubscriptionActive(tokenId: number): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    return this.contract.isSubscriptionActive(tokenId);
  }

  /**
   * Check if user is actively subscribed to creator
   */
  async isActiveSubscriber(subscriber: string, creator: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    return this.contract.isActiveSubscriber(subscriber, creator);
  }

  /**
   * Get subscription details
   */
  async getSubscription(tokenId: number) {
    if (!this.contract) throw new Error('Contract not initialized');

    const sub = await this.contract.getSubscription(tokenId);

    return {
      tokenId: sub.tokenId.toString(),
      subscriber: sub.subscriber,
      creator: sub.creator,
      startTime: sub.startTime.toString(),
      endTime: sub.endTime.toString(),
      price: sub.price.toString(),
      active: sub.active,
      autoRenew: sub.autoRenew,
    };
  }

  /**
   * Get all active subscriptions for a user
   */
  async getUserSubscriptions(subscriber: string): Promise<number[]> {
    if (!this.contract) throw new Error('Contract not initialized');
    const tokenIds = await this.contract.getUserSubscriptions(subscriber);
    return tokenIds.map((id: bigint) => Number(id));
  }

  /**
   * Get all subscribers for a creator
   */
  async getCreatorSubscribers(creator: string): Promise<string[]> {
    if (!this.contract) throw new Error('Contract not initialized');
    return this.contract.getCreatorSubscribers(creator);
  }

  /**
   * Get subscriber count for creator
   */
  async getSubscriberCount(creator: string): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');
    const count = await this.contract.getSubscriberCount(creator);
    return Number(count);
  }

  /**
   * Get NFT owner
   */
  async getOwnerOf(tokenId: number): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    return this.contract.ownerOf(tokenId);
  }

  /**
   * Listen to Subscribed events
   */
  onSubscribed(
    callback: (
      tokenId: bigint,
      subscriber: string,
      creator: string,
      price: bigint,
      endTime: bigint,
    ) => void,
  ) {
    if (!this.contract) throw new Error('Contract not initialized');

    const filter = this.contract.filters.Subscribed();
    this.contract.on(filter, callback);

    this.logger.log('👂 Listening to Subscribed events');
  }

  /**
   * Listen to SubscriptionRenewed events
   */
  onSubscriptionRenewed(callback: (tokenId: bigint, subscriber: string, newEndTime: bigint) => void) {
    if (!this.contract) throw new Error('Contract not initialized');

    const filter = this.contract.filters.SubscriptionRenewed();
    this.contract.on(filter, callback);

    this.logger.log('👂 Listening to SubscriptionRenewed events');
  }

  /**
   * Listen to SubscriptionCancelled events
   */
  onSubscriptionCancelled(callback: (tokenId: bigint, subscriber: string, timestamp: bigint) => void) {
    if (!this.contract) throw new Error('Contract not initialized');

    const filter = this.contract.filters.SubscriptionCancelled();
    this.contract.on(filter, callback);

    this.logger.log('👂 Listening to SubscriptionCancelled events');
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }
}
