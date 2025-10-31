import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionManagerService } from '../../blockchain/contracts/subscription-manager.service';
import { Web3Service } from '../../blockchain/web3.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionManagerService: SubscriptionManagerService,
    private readonly web3Service: Web3Service,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto, userId: string): Promise<SubscriptionResponseDto> {
    const normalizedCreatorAddress = createSubscriptionDto.creatorAddress.toLowerCase();

    // Find creator
    const creator = await this.prisma.creator.findUnique({
      where: { walletAddress: normalizedCreatorAddress },
    });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Verify transaction on blockchain
    const receipt = await this.web3Service.waitForTransaction(createSubscriptionDto.transactionHash);
    if (!receipt || receipt.status !== 1) {
      throw new BadRequestException('Transaction failed or not found');
    }

    // Check if subscription already recorded (prevent duplicates)
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { tokenId: createSubscriptionDto.tokenId },
    });
    if (existingSubscription) {
      throw new ConflictException('Subscription already recorded');
    }

    // Get subscription details from blockchain
    const onChainSub = await this.subscriptionManagerService.getSubscription(createSubscriptionDto.tokenId);

    // Calculate end time (30 days from start)
    const startTime = new Date();
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 30);

    // Create subscription record
    const subscription = await this.prisma.subscription.create({
      data: {
        tokenId: createSubscriptionDto.tokenId,
        subscriberId: userId,
        creatorId: creator.id,
        startTime,
        endTime,
        isActive: true,
        autoRenew: false,
        amount: createSubscriptionDto.amount.toString(),
        transactionHash: createSubscriptionDto.transactionHash,
      },
    });

    // Update creator subscriber count
    await this.prisma.creator.update({
      where: { id: creator.id },
      data: {
        subscriberCount: {
          increment: 1,
        },
      },
    });

    return plainToClass(SubscriptionResponseDto, subscription, { excludeExtraneousValues: true });
  }

  async findAll(page: number = 1, limit: number = 20, userId?: string, creatorId?: string, activeOnly: boolean = false): Promise<{
    subscriptions: SubscriptionResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) {
      where.subscriberId = userId;
    }
    if (creatorId) {
      where.creatorId = creatorId;
    }
    if (activeOnly) {
      where.isActive = true;
      where.endTime = { gte: new Date() };
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriber: {
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
              userId: true, // Include userId to map to user posts
              username: true,
              walletAddress: true,
              verified: true,
            },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    const subscriptionDtos = subscriptions.map(sub => plainToClass(SubscriptionResponseDto, sub, { excludeExtraneousValues: true }));

    return {
      subscriptions: subscriptionDtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        subscriber: {
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
            verified: true,
            user: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return plainToClass(SubscriptionResponseDto, subscription, { excludeExtraneousValues: true });
  }

  async findByTokenId(tokenId: number): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tokenId },
      include: {
        subscriber: {
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
            verified: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with token ID ${tokenId} not found`);
    }

    return plainToClass(SubscriptionResponseDto, subscription, { excludeExtraneousValues: true });
  }

  async getUserSubscriptions(userId: string, page: number = 1, limit: number = 20, activeOnly: boolean = false): Promise<{
    subscriptions: SubscriptionResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll(page, limit, userId, undefined, activeOnly);
  }

  async getCreatorSubscriptions(creatorId: string, page: number = 1, limit: number = 20, activeOnly: boolean = false): Promise<{
    subscriptions: SubscriptionResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll(page, limit, undefined, creatorId, activeOnly);
  }

  async getCreatorSubscriptionsByUserId(userId: string, page: number = 1, limit: number = 20, activeOnly: boolean = false): Promise<{
    subscriptions: SubscriptionResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // First, find the creator record for this user
      const creator = await this.prisma.creator.findUnique({
        where: { userId },
      });

      if (!creator) {
        return {
          subscriptions: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }

      // Return subscriptions for this creator
      return await this.getCreatorSubscriptions(creator.id, page, limit, activeOnly);
    } catch (error: any) {
      console.error(`Error getting creator subscriptions for user ${userId}:`, error);
      return {
        subscriptions: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }

  async renewSubscription(id: string, userId: string, transactionHash: string): Promise<SubscriptionResponseDto> {
    // Verify subscription exists
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // Authorization: Only the subscriber can renew
    if (subscription.subscriberId !== userId) {
      throw new ForbiddenException('You can only renew your own subscriptions');
    }

    // Verify transaction on blockchain
    const receipt = await this.web3Service.waitForTransaction(transactionHash);
    if (!receipt || receipt.status !== 1) {
      throw new BadRequestException('Transaction failed or not found');
    }

    // Extend end time by 30 days
    const newEndTime = new Date(subscription.endTime);
    newEndTime.setDate(newEndTime.getDate() + 30);

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        endTime: newEndTime,
        isActive: true,
        transactionHash,
      },
    });

    return plainToClass(SubscriptionResponseDto, updatedSubscription, { excludeExtraneousValues: true });
  }

  async cancelSubscription(id: string, userId: string): Promise<SubscriptionResponseDto> {
    // Verify subscription exists
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // Authorization: Only the subscriber can cancel
    if (subscription.subscriberId !== userId) {
      throw new ForbiddenException('You can only cancel your own subscriptions');
    }

    if (!subscription.isActive) {
      throw new BadRequestException('Subscription is already inactive');
    }

    // Cancel subscription
    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        isActive: false,
        autoRenew: false,
        cancelledAt: new Date(),
      },
    });

    // Update creator subscriber count
    await this.prisma.creator.update({
      where: { id: subscription.creatorId },
      data: {
        subscriberCount: {
          decrement: 1,
        },
      },
    });

    return plainToClass(SubscriptionResponseDto, updatedSubscription, { excludeExtraneousValues: true });
  }

  async toggleAutoRenew(id: string, userId: string): Promise<SubscriptionResponseDto> {
    // Verify subscription exists
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // Authorization: Only the subscriber can toggle auto-renew
    if (subscription.subscriberId !== userId) {
      throw new ForbiddenException('You can only modify your own subscriptions');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        autoRenew: !subscription.autoRenew,
      },
    });

    return plainToClass(SubscriptionResponseDto, updatedSubscription, { excludeExtraneousValues: true });
  }

  async checkSubscriptionStatus(userId: string, creatorId: string): Promise<{ isSubscribed: boolean; subscription?: SubscriptionResponseDto }> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        subscriberId: userId,
        creatorId,
        isActive: true,
        endTime: { gte: new Date() },
      },
    });

    if (!subscription) {
      return { isSubscribed: false };
    }

    return {
      isSubscribed: true,
      subscription: plainToClass(SubscriptionResponseDto, subscription, { excludeExtraneousValues: true }),
    };
  }

  async getSubscriptionStats(userId: string, asCreator: boolean = false): Promise<any> {
    const where = asCreator
      ? { creator: { userId } }
      : { subscriberId: userId };

    const [totalSubscriptions, activeSubscriptions, totalAmount] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.count({
        where: {
          ...where,
          isActive: true,
          endTime: { gte: new Date() },
        },
      }),
      this.prisma.subscription.aggregate({
        where,
        _sum: {
          price: true,
        },
      }),
    ]);

    return {
      totalSubscriptions,
      activeSubscriptions,
      totalAmount: totalAmount._sum.price?.toString() || '0',
    };
  }
}
