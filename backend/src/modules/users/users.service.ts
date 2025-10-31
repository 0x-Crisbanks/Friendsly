import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to transform user to DTO with isCreator flag
   */
  private toUserDto(user: any): UserResponseDto {
    // Convert creator subscriptionPrice from Decimal to number before transformation
    if (user.creator && user.creator.subscriptionPrice != null) {
      user.creator.subscriptionPrice = Number(user.creator.subscriptionPrice);
    }
    
    const dto = plainToClass(UserResponseDto, user, { excludeExtraneousValues: true });
    // Manually set isCreator based on role and creator relation
    dto.isCreator = !!user.creator || user.role?.toLowerCase() === 'creator';
    return dto;
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            verified: true,
            subscriptionPrice: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.toUserDto(user);
  }

  async findByUsername(username: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            verified: true,
            subscriptionPrice: true,
            totalEarnings: true,
            subscriberCount: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    return this.toUserDto(user);
  }

  async findByWalletAddress(walletAddress: string): Promise<UserResponseDto> {
    // Always normalize to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase();
    
    this.logger.log(`🔍 Looking up user by wallet: ${normalizedAddress}`);
    
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            verified: true,
            subscriptionPrice: true,
          },
        },
      },
    });

    if (!user) {
      this.logger.warn(`⚠️ User not found for wallet: ${normalizedAddress}`);
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }

    this.logger.log(`✅ User found: ${user.id} (${user.username})`);
    return this.toUserDto(user);
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ users: UserResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              verified: true,
              subscriptionPrice: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    // Map users and add post count
    const userDtos = users.map(user => {
      const dto = this.toUserDto(user);
      // Add post count and subscription price to the DTO
      (dto as any).postsCount = user._count?.posts || 0;
      // Convert Decimal to number for subscriptionPrice
      const subscriptionPrice = user.creator?.subscriptionPrice;
      (dto as any).subscriptionPriceUSD = subscriptionPrice ? Number(subscriptionPrice) : 0;
      return dto;
    });

    this.logger.log(`📊 findAll returning ${userDtos.length} users`);

    return {
      users: userDtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, requesterId: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.log(`📝 Updating user ${id} with data:`, JSON.stringify(updateUserDto, null, 2));
    this.logger.log(`🔐 Authorization check: User ID = ${id}, Requester ID = ${requesterId}`);

    // Verify user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Authorization: Users can only update their own profile
    if (id !== requesterId) {
      this.logger.error(`❌ Authorization failed: ${id} !== ${requesterId}`);
      throw new ForbiddenException('You can only update your own profile');
    }

    // Check username uniqueness if updating username
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: updateUserDto.username },
      });
      if (existingUser) {
        throw new ConflictException('Username already taken');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            verified: true,
            subscriptionPrice: true,
          },
        },
      },
    });

    this.logger.log(`✅ User ${id} updated successfully. New avatarUrl: ${updatedUser.avatarUrl}, coverImageUrl: ${updatedUser.coverImageUrl}`);

    return this.toUserDto(updatedUser);
  }

  async delete(id: string, requesterId: string): Promise<{ message: string }> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Authorization: Users can only delete their own account
    if (id !== requesterId) {
      throw new ForbiddenException('You can only delete your own account');
    }

    // Soft delete by marking account as inactive or hard delete
    await this.prisma.user.delete({ where: { id } });

    return { message: 'User account deleted successfully' };
  }

  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<{ users: UserResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              verified: true,
              subscriptionPrice: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    // Map users and add post count
    const userDtos = users.map(user => {
      const dto = this.toUserDto(user);
      // Add post count and subscription price to the DTO
      (dto as any).postsCount = user._count?.posts || 0;
      // Convert Decimal to number for subscriptionPrice
      const subscriptionPrice = user.creator?.subscriptionPrice;
      (dto as any).subscriptionPriceUSD = subscriptionPrice ? Number(subscriptionPrice) : 0;
      return dto;
    });

    this.logger.log(`🔍 searchUsers returning ${userDtos.length} users`);

    return {
      users: userDtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<{ users: UserResponseDto[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;

      // Verify user exists
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if follows table exists - if not, return empty result
      try {
        // Get followers using Follow model
        const [follows, total] = await Promise.all([
          this.prisma.follow.findMany({
            where: { followingId: userId },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              follower: {
                include: {
                  creator: {
                    select: {
                      id: true,
                      subscriptionPrice: true,
                    },
                  },
                  _count: {
                    select: {
                      posts: true,
                    },
                  },
                },
              },
            },
          }),
          this.prisma.follow.count({
            where: { followingId: userId },
          }),
        ]);

        const users = follows.map(follow => this.toUserDto(follow.follower));
        const totalPages = Math.ceil(total / limit);

        return {
          users,
          total,
          page,
          totalPages,
        };
      } catch (followError: any) {
        // If follows table doesn't exist or other error, return empty result
        this.logger.warn(`Error getting followers for user ${userId}, follows table may not exist:`, followError.message);
        return {
          users: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }
    } catch (error: any) {
      this.logger.error(`Error in getFollowers for user ${userId}:`, error);
      // Return empty result instead of throwing
      return {
        users: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<{ users: UserResponseDto[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;

      // Verify user exists
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if follows table exists - if not, return empty result
      try {
        // Get following using Follow model
        const [follows, total] = await Promise.all([
          this.prisma.follow.findMany({
            where: { followerId: userId },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              following: {
                include: {
                  creator: {
                    select: {
                      id: true,
                      subscriptionPrice: true,
                    },
                  },
                  _count: {
                    select: {
                      posts: true,
                    },
                  },
                },
              },
            },
          }),
          this.prisma.follow.count({
            where: { followerId: userId },
          }),
        ]);

        const users = follows.map(follow => this.toUserDto(follow.following));
        const totalPages = Math.ceil(total / limit);

        return {
          users,
          total,
          page,
          totalPages,
        };
      } catch (followError: any) {
        // If follows table doesn't exist or other error, return empty result
        this.logger.warn(`Error getting following for user ${userId}, follows table may not exist:`, followError.message);
        return {
          users: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }
    } catch (error: any) {
      this.logger.error(`Error in getFollowing for user ${userId}:`, error);
      // Return empty result instead of throwing
      return {
        users: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  async followUser(followerId: string, followingId: string): Promise<{ success: boolean; message: string }> {
    // Prevent self-follow
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Verify both users exist
    const [follower, following] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: followerId } }),
      this.prisma.user.findUnique({ where: { id: followingId } }),
    ]);

    if (!follower) {
      throw new NotFoundException(`Follower with ID ${followerId} not found`);
    }
    if (!following) {
      throw new NotFoundException(`User with ID ${followingId} not found`);
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return {
        success: false,
        message: 'Already following this user',
      };
    }

    // Create follow relationship
    await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return {
      success: true,
      message: 'Successfully followed user',
    };
  }

  async unfollowUser(followerId: string, followingId: string): Promise<{ success: boolean; message: string }> {
    // Verify both users exist
    const [follower, following] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: followerId } }),
      this.prisma.user.findUnique({ where: { id: followingId } }),
    ]);

    if (!follower) {
      throw new NotFoundException(`Follower with ID ${followerId} not found`);
    }
    if (!following) {
      throw new NotFoundException(`User with ID ${followingId} not found`);
    }

    // Check if following relationship exists
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      return {
        success: false,
        message: 'Not following this user',
      };
    }

    // Delete follow relationship
    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return {
      success: true,
      message: 'Successfully unfollowed user',
    };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }
}
