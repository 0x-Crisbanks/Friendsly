import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IpfsService } from '../../blockchain/ipfs.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentResponseDto } from './dto/content-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ipfsService: IpfsService,
  ) {}

  async create(createContentDto: CreateContentDto, userId: string): Promise<ContentResponseDto> {
    // Verify user is a creator
    const creator = await this.prisma.creator.findUnique({
      where: { userId },
    });
    if (!creator) {
      throw new ForbiddenException('You must be a creator to publish content');
    }

    // Validate IPFS CID
    if (!this.ipfsService.isValidCID(createContentDto.ipfsCID)) {
      throw new BadRequestException('Invalid IPFS CID');
    }

    // Split tags into array
    const tags = createContentDto.tags
      ? createContentDto.tags.split(',').map(tag => tag.trim())
      : [];

    // Create content
    const content = await this.prisma.content.create({
      data: {
        creatorId: creator.id,
        title: createContentDto.title,
        contentType: createContentDto.contentType,
        ipfsCID: createContentDto.ipfsCID,
        ipfsUrl: this.ipfsService.getGatewayUrl(createContentDto.ipfsCID),
        description: createContentDto.description,
        thumbnailCID: createContentDto.thumbnailCID,
        thumbnailUrl: createContentDto.thumbnailCID
          ? this.ipfsService.getGatewayUrl(createContentDto.thumbnailCID)
          : undefined,
        visibility: createContentDto.visibility,
        price: createContentDto.price?.toString() || '0',
        enableComments: createContentDto.enableComments ?? true,
        enableLikes: createContentDto.enableLikes ?? true,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
      },
    });

    // Create content tags
    if (tags.length > 0) {
      await this.prisma.contentTag.createMany({
        data: tags.map(tag => ({
          contentId: content.id,
          tag,
        })),
      });
    }

    // Update creator content count
    await this.prisma.creator.update({
      where: { id: creator.id },
      data: {
        totalContent: {
          increment: 1,
        },
      },
    });

    // Pin to IPFS
    try {
      await this.ipfsService.pin(createContentDto.ipfsCID);
      if (createContentDto.thumbnailCID) {
        await this.ipfsService.pin(createContentDto.thumbnailCID);
      }
    } catch (error) {
      // Continue even if pinning fails
    }

    return plainToClass(ContentResponseDto, content, { excludeExtraneousValues: true });
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    creatorId?: string,
    contentType?: string,
    visibility?: string,
  ): Promise<{
    content: ContentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };
    if (creatorId) {
      where.creatorId = creatorId;
    }
    if (contentType) {
      where.contentType = contentType;
    }
    if (visibility) {
      where.visibility = visibility;
    }

    const [content, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
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
      }),
      this.prisma.content.count({ where }),
    ]);

    const contentDtos = content.map(c => plainToClass(ContentResponseDto, c, { excludeExtraneousValues: true }));

    return {
      content: contentDtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, userId?: string): Promise<ContentResponseDto> {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            verified: true,
            userId: true,
            user: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        tags: true,
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    // Check access permissions
    if (content.visibility === 'SUBSCRIBERS_ONLY' || content.visibility === 'PREMIUM') {
      if (!userId) {
        throw new ForbiddenException('Authentication required to view this content');
      }

      // Check if user is the creator
      if (content.creator.userId !== userId) {
        // Check if user has access (subscriber or purchased)
        const hasAccess = await this.checkUserAccess(userId, content.id, content.creatorId);
        if (!hasAccess) {
          throw new ForbiddenException('You do not have access to this content');
        }
      }
    }

    // Increment view count
    await this.prisma.content.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return plainToClass(ContentResponseDto, content, { excludeExtraneousValues: true });
  }

  async update(id: string, updateContentDto: UpdateContentDto, userId: string): Promise<ContentResponseDto> {
    // Verify content exists
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    // Authorization: Only the creator can update their content
    if (content.creator.userId !== userId) {
      throw new ForbiddenException('You can only update your own content');
    }

    const updateData: any = {};
    if (updateContentDto.title) updateData.title = updateContentDto.title;
    if (updateContentDto.description !== undefined) updateData.description = updateContentDto.description;
    if (updateContentDto.thumbnailCID) {
      updateData.thumbnailCID = updateContentDto.thumbnailCID;
      updateData.thumbnailUrl = this.ipfsService.getGatewayUrl(updateContentDto.thumbnailCID);
    }
    if (updateContentDto.visibility) updateData.visibility = updateContentDto.visibility;
    if (updateContentDto.price !== undefined) updateData.price = updateContentDto.price.toString();
    if (updateContentDto.enableComments !== undefined) updateData.enableComments = updateContentDto.enableComments;
    if (updateContentDto.enableLikes !== undefined) updateData.enableLikes = updateContentDto.enableLikes;

    const updatedContent = await this.prisma.content.update({
      where: { id },
      data: updateData,
    });

    // Update tags if provided
    if (updateContentDto.tags !== undefined) {
      // Delete existing tags
      await this.prisma.contentTag.deleteMany({ where: { contentId: id } });

      // Create new tags
      const tags = updateContentDto.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tags.length > 0) {
        await this.prisma.contentTag.createMany({
          data: tags.map(tag => ({
            contentId: id,
            tag,
          })),
        });
      }
    }

    return plainToClass(ContentResponseDto, updatedContent, { excludeExtraneousValues: true });
  }

  async delete(id: string, userId: string): Promise<{ message: string }> {
    // Verify content exists
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    // Authorization: Only the creator can delete their content
    if (content.creator.userId !== userId) {
      throw new ForbiddenException('You can only delete your own content');
    }

    // Soft delete by marking as unpublished
    await this.prisma.content.update({
      where: { id },
      data: { isPublished: false },
    });

    // Update creator content count
    await this.prisma.creator.update({
      where: { id: content.creatorId },
      data: {
        totalContent: {
          decrement: 1,
        },
      },
    });

    return { message: 'Content deleted successfully' };
  }

  async searchContent(query: string, page: number = 1, limit: number = 20): Promise<{
    content: ContentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [content, total] = await Promise.all([
      this.prisma.content.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            {
              tags: {
                some: {
                  tag: { contains: query, mode: 'insensitive' },
                },
              },
            },
          ],
        },
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              verified: true,
            },
          },
        },
      }),
      this.prisma.content.count({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    const contentDtos = content.map(c => plainToClass(ContentResponseDto, c, { excludeExtraneousValues: true }));

    return {
      content: contentDtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async checkUserAccess(userId: string, contentId: string, creatorId: string): Promise<boolean> {
    // Check if user is an active subscriber
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        subscriberId: userId,
        creatorId,
        isActive: true,
        endTime: { gte: new Date() },
      },
    });

    if (activeSubscription) {
      return true;
    }

    // Check if user purchased this specific content
    const purchase = await this.prisma.payment.findFirst({
      where: {
        payerId: userId,
        contentId,
        paymentType: 'CONTENT_PURCHASE',
        status: 'COMPLETED',
      },
    });

    return !!purchase;
  }

  async likeContent(id: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    if (!content.enableLikes) {
      throw new BadRequestException('Likes are disabled for this content');
    }

    // Toggle like (simplified - in production, use a separate Like table)
    const updatedContent = await this.prisma.content.update({
      where: { id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });

    return {
      liked: true,
      likeCount: updatedContent.likeCount,
    };
  }
}
