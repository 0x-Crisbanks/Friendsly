import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Web3Service } from '../web3.service';

// ABI for CreatorRegistry contract
const CREATOR_REGISTRY_ABI = [
  'function registerCreator(string username, string profileCID, uint256 subscriptionPrice) external',
  'function updateProfile(string profileCID) external',
  'function updateSubscriptionPrice(uint256 newPrice) external',
  'function verifyCreator(address creator) external',
  'function deactivateCreator() external',
  'function getCreator(address creator) external view returns (tuple(address wallet, string username, string profileCID, uint256 subscriptionPrice, bool verified, bool active, uint256 reputation, uint256 totalEarnings, uint256 subscriberCount, uint256 registeredAt))',
  'function isCreator(address creator) external view returns (bool)',
  'function isUsernameAvailable(string username) external view returns (bool)',
  'function getCreatorByUsername(string username) external view returns (address)',
  'function getAllCreators(uint256 offset, uint256 limit) external view returns (address[])',
  'function totalCreators() external view returns (uint256)',
  'function totalVerifiedCreators() external view returns (uint256)',
  'event CreatorRegistered(address indexed creator, string username, uint256 timestamp)',
  'event CreatorVerified(address indexed creator, uint256 timestamp)',
  'event ProfileUpdated(address indexed creator, string profileCID, uint256 timestamp)',
  'event SubscriptionPriceUpdated(address indexed creator, uint256 oldPrice, uint256 newPrice)',
];

/**
 * Creator Registry Contract Service
 * Wrapper for CreatorRegistry smart contract interactions
 */
@Injectable()
export class CreatorRegistryService {
  private readonly logger = new Logger(CreatorRegistryService.name);
  private contract: ethers.Contract | null = null;
  private contractAddress: string;

  constructor(
    private web3Service: Web3Service,
    private configService: ConfigService,
  ) {
    this.contractAddress = this.configService.get<string>('blockchain.contracts.creatorRegistry') || '';
    this.initializeContract();
  }

  private initializeContract() {
    if (!this.contractAddress || this.contractAddress === '0x0000000000000000000000000000000000000000') {
      this.logger.warn('⚠️  CreatorRegistry contract address not configured');
      return;
    }

    try {
      this.contract = this.web3Service.getContract(this.contractAddress, CREATOR_REGISTRY_ABI);
      this.logger.log(`✅ CreatorRegistry contract initialized at ${this.contractAddress}`);
    } catch (error) {
      this.logger.error(`❌ Failed to initialize CreatorRegistry contract: ${error.message}`);
    }
  }

  /**
   * Check if address is a registered creator
   */
  async isCreator(address: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    return this.contract.isCreator(address);
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    return this.contract.isUsernameAvailable(username);
  }

  /**
   * Get creator profile from blockchain
   */
  async getCreator(address: string) {
    if (!this.contract) throw new Error('Contract not initialized');

    const creator = await this.contract.getCreator(address);

    return {
      wallet: creator.wallet,
      username: creator.username,
      profileCID: creator.profileCID,
      subscriptionPrice: creator.subscriptionPrice.toString(),
      verified: creator.verified,
      active: creator.active,
      reputation: creator.reputation.toString(),
      totalEarnings: creator.totalEarnings.toString(),
      subscriberCount: creator.subscriberCount.toString(),
      registeredAt: creator.registeredAt.toString(),
    };
  }

  /**
   * Get creator by username
   */
  async getCreatorByUsername(username: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    return this.contract.getCreatorByUsername(username);
  }

  /**
   * Get total number of creators
   */
  async getTotalCreators(): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');
    const total = await this.contract.totalCreators();
    return Number(total);
  }

  /**
   * Get total verified creators
   */
  async getTotalVerifiedCreators(): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');
    const total = await this.contract.totalVerifiedCreators();
    return Number(total);
  }

  /**
   * Get all creators (paginated)
   */
  async getAllCreators(offset: number, limit: number): Promise<string[]> {
    if (!this.contract) throw new Error('Contract not initialized');
    return this.contract.getAllCreators(offset, limit);
  }

  /**
   * Listen to CreatorRegistered events
   */
  onCreatorRegistered(callback: (creator: string, username: string, timestamp: bigint) => void) {
    if (!this.contract) throw new Error('Contract not initialized');

    const filter = this.contract.filters.CreatorRegistered();
    this.contract.on(filter, callback);

    this.logger.log('👂 Listening to CreatorRegistered events');
  }

  /**
   * Listen to CreatorVerified events
   */
  onCreatorVerified(callback: (creator: string, timestamp: bigint) => void) {
    if (!this.contract) throw new Error('Contract not initialized');

    const filter = this.contract.filters.CreatorVerified();
    this.contract.on(filter, callback);

    this.logger.log('👂 Listening to CreatorVerified events');
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }
}
