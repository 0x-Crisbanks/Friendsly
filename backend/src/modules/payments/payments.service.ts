import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaymentEscrowService } from '../../blockchain/contracts/payment-escrow.service';
import { Web3Service } from '../../blockchain/web3.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentEscrowService: PaymentEscrowService,
    private readonly web3Service: Web3Service,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, userId: string): Promise<PaymentResponseDto> {
    const normalizedCreatorAddress = createPaymentDto.creatorAddress.toLowerCase();

    // Find creator
    const creator = await this.prisma.creator.findUnique({
      where: { walletAddress: normalizedCreatorAddress },
    });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Verify transaction on blockchain
    const receipt = await this.web3Service.waitForTransaction(createPaymentDto.transactionHash);
    if (!receipt || receipt.status !== 1) {
      throw new BadRequestException('Transaction failed or not found');
    }

    // Check if payment already recorded (prevent duplicates)
    const existingPayment = await this.prisma.payment.findUnique({
      where: { transactionHash: createPaymentDto.transactionHash },
    });
    if (existingPayment) {
      throw new BadRequestException('Payment already recorded');
    }

    // Calculate fees (10% platform, 90% creator)
    const amount = BigInt(createPaymentDto.amount);
    const platformFee = (amount * 10n) / 100n;
    const creatorAmount = amount - platformFee;

    // Generate blockchain payment ID (this should come from the blockchain event)
    const blockchainPaymentId = `0x${Buffer.from(createPaymentDto.transactionHash).toString('hex').slice(0, 64)}`;

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        blockchainPaymentId,
        payerId: userId,
        creatorId: creator.id,
        paymentType: createPaymentDto.paymentType as any,
        amount: amount.toString(),
        totalAmount: amount.toString(),
        platformFee: platformFee.toString(),
        creatorAmount: creatorAmount.toString(),
        status: 'COMPLETED',
        transactionHash: createPaymentDto.transactionHash,
        contentId: createPaymentDto.contentId,
        message: createPaymentDto.message,
        confirmedAt: new Date(),
      },
    });

    // Update creator total earnings
    await this.prisma.creator.update({
      where: { id: creator.id },
      data: {
        totalEarnings: {
          increment: creatorAmount.toString(),
        },
      },
    });

    return plainToClass(PaymentResponseDto, payment, { excludeExtraneousValues: true });
  }

  async findAll(page: number = 1, limit: number = 20, userId?: string, creatorId?: string): Promise<{
    payments: PaymentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) {
      where.payerId = userId;
    }
    if (creatorId) {
      where.creatorId = creatorId;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payer: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const paymentDtos = payments.map(payment => plainToClass(PaymentResponseDto, payment, { excludeExtraneousValues: true }));

    return {
      payments: paymentDtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        payer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
        content: {
          select: {
            id: true,
            title: true,
            contentType: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return plainToClass(PaymentResponseDto, payment, { excludeExtraneousValues: true });
  }

  async findByTransactionHash(txHash: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { transactionHash: txHash },
      include: {
        payer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with transaction hash ${txHash} not found`);
    }

    return plainToClass(PaymentResponseDto, payment, { excludeExtraneousValues: true });
  }

  async getUserPayments(userId: string, page: number = 1, limit: number = 20): Promise<{
    payments: PaymentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll(page, limit, userId, undefined);
  }

  async getCreatorPayments(creatorId: string, page: number = 1, limit: number = 20): Promise<{
    payments: PaymentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll(page, limit, undefined, creatorId);
  }

  async getPaymentStats(userId: string, asCreator: boolean = false): Promise<any> {
    const where = asCreator
      ? { creator: { userId } }
      : { payerId: userId };

    const [totalPayments, totalAmount, paymentsByType] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.payment.groupBy({
        by: ['paymentType'],
        where,
        _count: {
          paymentType: true,
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      totalPayments,
      totalAmount: totalAmount._sum.totalAmount?.toString() || '0',
      paymentsByType: paymentsByType.map(pt => ({
        type: pt.paymentType,
        count: pt._count.paymentType,
        totalAmount: pt._sum.totalAmount?.toString() || '0',
      })),
    };
  }

  async refundPayment(id: string, userId: string): Promise<PaymentResponseDto> {
    // Verify payment exists
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // Only the payer or creator can initiate refund
    if (payment.payerId !== userId && payment.creator.userId !== userId) {
      throw new ForbiddenException('You cannot refund this payment');
    }

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    // Update payment status to refunded
    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED' },
    });

    // Update creator total earnings (subtract refunded amount)
    await this.prisma.creator.update({
      where: { id: payment.creatorId },
      data: {
        totalEarnings: {
          decrement: payment.creatorAmount,
        },
      },
    });

    return plainToClass(PaymentResponseDto, updatedPayment, { excludeExtraneousValues: true });
  }
}
