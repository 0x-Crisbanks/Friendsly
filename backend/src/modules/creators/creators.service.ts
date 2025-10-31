import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatorRegistryService } from '../../blockchain/contracts/creator-registry.service';
import { CreateCreatorDto } from './dto/create-creator.dto';
import { UpdateCreatorDto } from './dto/update-creator.dto';
import { CreatorResponseDto } from './dto/creator-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CreatorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creatorRegistryService: CreatorRegistryService,
  ) {}

  async create(createCreatorDto: CreateCreatorDto, userId: string): Promise<CreatorResponseDto> {
    const normalizedAddress = createCreatorDto.walletAddress.toLowerCase();

    // Check if creator already exists
    const existingCreator = await this.prisma.creator.findUnique({
      where: { walletAddress: normalizedAddress },
    });
    if (existingCreator) {
      throw new ConflictException('Creator with this wallet address already exists');
    }

    // Check if username is taken
    const existingUsername = await this.prisma.creator.findUnique({
      where: { username: createCreatorDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Verify user owns the wallet address
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletAddress?.toLowerCase() !== normalizedAddress) {
      throw new ForbiddenException('You can only create a creator profile for your own wallet address');
    }

    // Check on-chain registration (optional - depends on your flow)
    const isRegisteredOnChain = await this.creatorRegistryService.isCreator(normalizedAddress);

    // Create creator in database
    const creator = await this.prisma.creator.create({
      data: {
        userId,
        walletAddress: normalizedAddress,
        username: createCreatorDto.username,
        profileCID: createCreatorDto.profileCID,
        subscriptionPrice: createCreatorDto.subscriptionPrice.toString(),
        category: createCreatorDto.category,
        description: createCreatorDto.description,
        verified: false,
        isActive: true,
        totalEarnings: '0',
        subscriberCount: 0,
        totalContent: 0,
      },
    });

    // Update user role to CREATOR
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'CREATOR' },
    });

    return plainToClass(CreatorResponseDto, creator, { excludeExtraneousValues: true });
  }

  async findAll(page: number = 1, limit: number = 20, category?: string, verified?: boolean): Promise<{
    creators: CreatorResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    if (verified !== undefined) {
      where.verified = verified;
    }

    const [creators, total] = await Promise.all([
      this.prisma.creator.findMany({
        where,
        skip,
        take: limit,
        orderBy: { subscriberCount: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.creator.count({ where }),
    ]);

    const creatorDtos = creators.map(creator => plainToClass(CreatorResponseDto, creator, { excludeExtraneousValues: true }));

    return {
      creators: creatorDtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<CreatorResponseDto> {
    const creator = await this.prisma.creator.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    if (!creator) {
      throw new NotFoundException(`Creator with ID ${id} not found`);
    }

    return plainToClass(CreatorResponseDto, creator, { excludeExtraneousValues: true });
  }

  async findByUsername(username: string): Promise<CreatorResponseDto> {
    const creator = await this.prisma.creator.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    if (!creator) {
      throw new NotFoundException(`Creator with username ${username} not found`);
    }

    return plainToClass(CreatorResponseDto, creator, { excludeExtraneousValues: true });
  }

  async findByWalletAddress(walletAddress: string): Promise<CreatorResponseDto> {
    const normalizedAddress = walletAddress.toLowerCase();
    const creator = await this.prisma.creator.findUnique({
      where: { walletAddress: normalizedAddress },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    if (!creator) {
      throw new NotFoundException(`Creator with wallet address ${walletAddress} not found`);
    }

    return plainToClass(CreatorResponseDto, creator, { excludeExtraneousValues: true });
  }

  async update(id: string, updateCreatorDto: UpdateCreatorDto, userId: string): Promise<CreatorResponseDto> {
    // Verify creator exists
    const creator = await this.prisma.creator.findUnique({ where: { id } });
    if (!creator) {
      throw new NotFoundException(`Creator with ID ${id} not found`);
    }

    // Authorization: Only the creator can update their own profile
    if (creator.userId !== userId) {
      throw new ForbiddenException('You can only update your own creator profile');
    }

    // Check username uniqueness if updating username
    if (updateCreatorDto.username && updateCreatorDto.username !== creator.username) {
      const existingUsername = await this.prisma.creator.findUnique({
        where: { username: updateCreatorDto.username },
      });
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    const updateData: any = {};
    if (updateCreatorDto.username) updateData.username = updateCreatorDto.username;
    if (updateCreatorDto.profileCID) updateData.profileCID = updateCreatorDto.profileCID;
    if (updateCreatorDto.subscriptionPrice !== undefined) {
      updateData.subscriptionPrice = updateCreatorDto.subscriptionPrice.toString();
    }
    if (updateCreatorDto.category) updateData.category = updateCreatorDto.category;
    if (updateCreatorDto.description) updateData.description = updateCreatorDto.description;

    const updatedCreator = await this.prisma.creator.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return plainToClass(CreatorResponseDto, updatedCreator, { excludeExtraneousValues: true });
  }

  async delete(id: string, userId: string): Promise<{ message: string }> {
    // Verify creator exists
    const creator = await this.prisma.creator.findUnique({ where: { id } });
    if (!creator) {
      throw new NotFoundException(`Creator with ID ${id} not found`);
    }

    // Authorization: Only the creator can delete their own profile
    if (creator.userId !== userId) {
      throw new ForbiddenException('You can only delete your own creator profile');
    }

    // Soft delete by marking as inactive
    await this.prisma.creator.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Creator profile deactivated successfully' };
  }

  async searchCreators(query: string, page: number = 1, limit: number = 20): Promise<{
    creators: CreatorResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [creators, total] = await Promise.all([
      this.prisma.creator.findMany({
        where: {
          isActive: true,
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            {
              user: {
                OR: [
                  { username: { contains: query, mode: 'insensitive' } },
                  { displayName: { contains: query, mode: 'insensitive' } },
                ],
              },
            },
          ],
        },
        skip,
        take: limit,
        orderBy: { subscriberCount: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.creator.count({
        where: {
          isActive: true,
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    const creatorDtos = creators.map(creator => plainToClass(CreatorResponseDto, creator, { excludeExtraneousValues: true }));

    return {
      creators: creatorDtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async verifyCreator(id: string): Promise<CreatorResponseDto> {
    // This should be an admin-only operation (add admin guard in controller)
    const creator = await this.prisma.creator.findUnique({ where: { id } });
    if (!creator) {
      throw new NotFoundException(`Creator with ID ${id} not found`);
    }

    const updatedCreator = await this.prisma.creator.update({
      where: { id },
      data: { verified: true },
    });

    return plainToClass(CreatorResponseDto, updatedCreator, { excludeExtraneousValues: true });
  }

  async getCreatorStats(id: string): Promise<any> {
    const creator = await this.prisma.creator.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
            paymentsReceived: true,
            content: true,
          },
        },
      },
    });

    if (!creator) {
      throw new NotFoundException(`Creator with ID ${id} not found`);
    }

    return {
      totalEarnings: creator.totalEarnings,
      subscriberCount: creator.subscriberCount,
      contentCount: creator.totalContent,
      activeSubscriptions: creator._count.subscriptions,
      totalPayments: creator._count.paymentsReceived,
    };
  }
}
