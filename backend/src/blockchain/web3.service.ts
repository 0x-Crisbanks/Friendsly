import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

/**
 * Web3 Service
 * Core service for blockchain interactions
 * Provides provider and wallet management
 */
@Injectable()
export class Web3Service implements OnModuleInit {
  private readonly logger = new Logger(Web3Service.name);
  private provider: ethers.JsonRpcProvider;
  private wsProvider: ethers.WebSocketProvider | null = null;
  private chainId: number;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const rpcUrl = this.configService.get<string>('blockchain.rpcUrl');
    const wsUrl = this.configService.get<string>('blockchain.wsUrl');
    this.chainId = this.configService.get<number>('blockchain.chainId') || 1;

    if (!rpcUrl) {
      this.logger.warn('⚠️  Blockchain RPC URL not configured - using default localhost');
      // Use a default localhost RPC for development
      try {
        this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
        const network = await this.provider.getNetwork();
        this.logger.log(`✅ Connected to local blockchain: ${network.name} (Chain ID: ${network.chainId})`);
        return;
      } catch (error) {
        this.logger.warn('⚠️  Local blockchain not available - Web3 features will be limited');
        return;
      }
    }

    try {
      // Initialize HTTP provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Test connection
      const network = await this.provider.getNetwork();
      this.logger.log(`✅ Connected to blockchain: ${network.name} (Chain ID: ${network.chainId})`);

      // Initialize WebSocket provider for events
      if (wsUrl) {
        this.wsProvider = new ethers.WebSocketProvider(wsUrl);
        this.logger.log('✅ WebSocket provider initialized for event listening');
      }
    } catch (error) {
      this.logger.error(`❌ Failed to connect to blockchain: ${error.message}`);
      // Don't throw error, just log it - the app should still work without blockchain
    }
  }

  /**
   * Get the JSON-RPC provider
   */
  getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return this.provider;
  }

  /**
   * Get the WebSocket provider for events
   */
  getWsProvider(): ethers.WebSocketProvider {
    if (!this.wsProvider) {
      throw new Error('WebSocket provider not initialized');
    }
    return this.wsProvider;
  }

  /**
   * Get contract instance
   */
  getContract(address: string, abi: any[]): ethers.Contract {
    return new ethers.Contract(address, abi, this.provider);
  }

  /**
   * Get contract instance with WebSocket for events
   */
  getContractWithWs(address: string, abi: any[]): ethers.Contract {
    if (!this.wsProvider) {
      throw new Error('WebSocket provider not initialized');
    }
    return new ethers.Contract(address, abi, this.wsProvider);
  }

  /**
   * Verify a signature
   */
  verifySignature(message: string, signature: string, expectedAddress: string): boolean {
    try {
      // Use ethers to verify signature without needing blockchain connection
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    return this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations = 1): Promise<ethers.TransactionReceipt> {
    const receipt = await this.provider.waitForTransaction(txHash, confirmations);
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }
    return receipt;
  }

  /**
   * Get balance of address
   */
  async getBalance(address: string): Promise<bigint> {
    return this.provider.getBalance(address);
  }

  /**
   * Format Wei to Ether
   */
  formatEther(wei: bigint): string {
    return ethers.formatEther(wei);
  }

  /**
   * Parse Ether to Wei
   */
  parseEther(ether: string): bigint {
    return ethers.parseEther(ether);
  }

  /**
   * Validate Ethereum address
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get checksummed address
   */
  getAddress(address: string): string {
    return ethers.getAddress(address);
  }

  /**
   * Get chain ID
   */
  getChainId(): number {
    return this.chainId;
  }
}
