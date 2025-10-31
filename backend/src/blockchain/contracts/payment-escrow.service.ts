import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Web3Service } from '../web3.service';

const PAYMENT_ESCROW_ABI = [
  'function processPayment(address creator, uint8 paymentType) external payable returns (bytes32 paymentId)',
  'function completePayment(bytes32 paymentId) external',
  'function refundPayment(bytes32 paymentId) external',
  'function withdrawEarnings() external',
  'function withdrawPlatformFees(address payable recipient) external',
  'function getPayment(bytes32 paymentId) external view returns (tuple(bytes32 id, address payer, address creator, uint256 totalAmount, uint256 creatorAmount, uint256 platformFee, uint8 paymentType, uint8 status, uint256 timestamp, uint256 completedAt))',
  'function getPendingEarnings(address creator) external view returns (uint256)',
  'function getTotalPlatformFees() external view returns (uint256)',
  'function getPlatformFeePercentage() external view returns (uint256)',
  'event PaymentReceived(bytes32 indexed paymentId, address indexed payer, address indexed creator, uint256 amount, uint8 paymentType)',
  'event PaymentCompleted(bytes32 indexed paymentId, address indexed creator, uint256 creatorAmount, uint256 platformFee)',
  'event PaymentRefunded(bytes32 indexed paymentId, address indexed payer, uint256 amount)',
];

/**
 * Payment Escrow Contract Service
 */
@Injectable()
export class PaymentEscrowService {
  private readonly logger = new Logger(PaymentEscrowService.name);
  private contract: ethers.Contract | null = null;
  private contractAddress: string;

  constructor(
    private web3Service: Web3Service,
    private configService: ConfigService,
  ) {
    this.contractAddress = this.configService.get<string>('blockchain.contracts.paymentEscrow') || '';
    this.initializeContract();
  }

  private initializeContract() {
    if (!this.contractAddress || this.contractAddress === '0x0000000000000000000000000000000000000000') {
      this.logger.warn('⚠️  PaymentEscrow contract address not configured');
      return;
    }

    try {
      this.contract = this.web3Service.getContract(this.contractAddress, PAYMENT_ESCROW_ABI);
      this.logger.log(`✅ PaymentEscrow contract initialized at ${this.contractAddress}`);
    } catch (error) {
      this.logger.error(`❌ Failed to initialize PaymentEscrow contract: ${error.message}`);
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string) {
    if (!this.contract) throw new Error('Contract not initialized');

    const payment = await this.contract.getPayment(paymentId);

    return {
      id: payment.id,
      payer: payment.payer,
      creator: payment.creator,
      totalAmount: payment.totalAmount.toString(),
      creatorAmount: payment.creatorAmount.toString(),
      platformFee: payment.platformFee.toString(),
      paymentType: Number(payment.paymentType),
      status: Number(payment.status),
      timestamp: payment.timestamp.toString(),
      completedAt: payment.completedAt.toString(),
    };
  }

  /**
   * Get pending earnings for creator
   */
  async getPendingEarnings(creatorAddress: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    const earnings = await this.contract.getPendingEarnings(creatorAddress);
    return earnings.toString();
  }

  /**
   * Get total platform fees
   */
  async getTotalPlatformFees(): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    const fees = await this.contract.getTotalPlatformFees();
    return fees.toString();
  }

  /**
   * Get platform fee percentage
   */
  async getPlatformFeePercentage(): Promise<number> {
    if (!this.contract) throw new Error('Contract not initialized');
    const percentage = await this.contract.getPlatformFeePercentage();
    return Number(percentage);
  }

  /**
   * Listen to PaymentReceived events
   */
  onPaymentReceived(
    callback: (
      paymentId: string,
      payer: string,
      creator: string,
      amount: bigint,
      paymentType: number,
    ) => void,
  ) {
    if (!this.contract) throw new Error('Contract not initialized');

    const filter = this.contract.filters.PaymentReceived();
    this.contract.on(filter, callback);

    this.logger.log('👂 Listening to PaymentReceived events');
  }

  /**
   * Listen to PaymentCompleted events
   */
  onPaymentCompleted(
    callback: (paymentId: string, creator: string, creatorAmount: bigint, platformFee: bigint) => void,
  ) {
    if (!this.contract) throw new Error('Contract not initialized');

    const filter = this.contract.filters.PaymentCompleted();
    this.contract.on(filter, callback);

    this.logger.log('👂 Listening to PaymentCompleted events');
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }
}
