import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Transform post data to DTO and add isCreator flag to author
   */
  /**
   * Helper function to safely convert Decimal to number/null
   */
  private convertDecimal(value: any): number | null {
    if (value == null || value === undefined) {
      return null;
    }
    try {
      if (typeof value === 'object' && value && typeof value.toNumber === 'function') {
        return value.toNumber();
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      } else if (typeof value === 'number') {
        return value;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Recursively serialize Prisma Decimal fields to prevent DecimalError
   * Uses JSON.stringify/parse with a replacer to convert all Decimal instances
   */
  private serializeDecimals(obj: any): any {
    if (obj == null || obj === undefined) return obj;
    
    // Use JSON with a custom replacer to handle Decimal objects
    try {
      const jsonString = JSON.stringify(obj, (key, value) => {
        // Check if value is a Prisma Decimal (has toNumber method)
        if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
          try {
            return value.toNumber();
          } catch {
            return null;
          }
        }
        return value;
      });
      return JSON.parse(jsonString);
    } catch (error) {
      // If JSON serialization fails, manually convert
      return this.manualDecimalConversion(obj);
    }
  }

  /**
   * Manual conversion for Decimal fields when JSON serialization fails
   */
  private manualDecimalConversion(obj: any): any {
    if (obj == null || obj === undefined) return obj;
    
    // Check if it's a Decimal object (has toNumber method)
    if (typeof obj === 'object' && typeof obj.toNumber === 'function') {
      try {
        return obj.toNumber();
      } catch {
        return null;
      }
    }
    
    // If it's an array, map recursively
    if (Array.isArray(obj)) {
      return obj.map(item => this.manualDecimalConversion(item));
    }
    
    // If it's an object (and not Date or other special objects), serialize properties
    if (typeof obj === 'object' && obj.constructor === Object) {
      const serialized: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          serialized[key] = this.manualDecimalConversion(obj[key]);
        }
      }
      return serialized;
    }
    
    // For primitives and other objects (Date, etc.), return as-is
    return obj;
  }

  private toPostDto(post: any): PostResponseDto {
    try {
      // CRITICAL: Serialize ALL Decimal fields recursively before passing to plainToClass
      // This prevents DecimalError from any Decimal field (including nested ones)
      let serializedPost: any;
      try {
        serializedPost = this.serializeDecimals(post);
      } catch (serializeError: any) {
        // If serialization fails, fall back to manual conversion
        this.logger.warn(`JSON serialization failed for post ${post.id}, using manual conversion:`, serializeError.message);
        serializedPost = this.manualDecimalConversion(post);
      }
      
      // Ensure priceUSD is explicitly set (JSON.stringify removes undefined)
      serializedPost.priceUSD = this.convertDecimal(post.priceUSD);
      
      // Ensure all critical fields are preserved (JSON.stringify may remove undefined/null)
      serializedPost.imageUrl = post.imageUrl || serializedPost.imageUrl || null;
      serializedPost.videoUrl = post.videoUrl || serializedPost.videoUrl || null;
      serializedPost.thumbnailUrl = post.thumbnailUrl || serializedPost.thumbnailUrl || null;
      serializedPost.type = post.type || serializedPost.type || 'TEXT';
      serializedPost.title = post.title || serializedPost.title || null;
      
      const dto = plainToClass(PostResponseDto, serializedPost, { excludeExtraneousValues: true });
      
      // Debug: Log if critical fields are missing
      if (!dto.imageUrl && post.imageUrl) {
        this.logger.warn(`⚠️ imageUrl lost in transformation for post ${post.id}`);
      }
      if (!dto.type && post.type) {
        this.logger.warn(`⚠️ type lost in transformation for post ${post.id}`);
      }
      if (!dto.title && post.title) {
        this.logger.warn(`⚠️ title lost in transformation for post ${post.id}`);
      }
      
      // Add isCreator flag to author if present
      if (dto.author) {
        dto.author.isCreator = !!(dto.author as any).creator || dto.author.role?.toLowerCase() === 'creator';
      }
      
      return dto;
    } catch (error: any) {
      this.logger.warn(`Error transforming post to DTO:`, error);
      // Return a minimal DTO if transformation fails
      let priceUSD: number | null = null;
      if (post.priceUSD != null) {
        try {
          if (typeof post.priceUSD === 'object' && post.priceUSD.toNumber) {
            priceUSD = post.priceUSD.toNumber();
          } else if (typeof post.priceUSD === 'string') {
            priceUSD = parseFloat(post.priceUSD);
          } else if (typeof post.priceUSD === 'number') {
            priceUSD = post.priceUSD;
          }
        } catch (e) {
          // Ignore conversion errors in fallback
        }
      }
      
      return plainToClass(PostResponseDto, {
        id: post.id,
        userId: post.userId,
        title: post.title || null,
        content: post.content || '',
        imageUrl: post.imageUrl || null,
        videoUrl: post.videoUrl || null,
        thumbnailUrl: post.thumbnailUrl || null,
        type: post.type || 'TEXT',
        visibility: post.visibility || 'PUBLIC',
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        priceUSD: priceUSD,
        tags: post.tags || [],
        upvotes: post.upvotes || 0,
        downvotes: post.downvotes || 0,
        comments: post.comments || 0,
        shares: post.shares || 0,
        views: post.views || 0,
        isPPV: post.isPPV || false,
        isPinned: post.isPinned || false,
        isTrending: post.isTrending || false,
        isPublished: post.isPublished !== undefined ? post.isPublished : true,
        publishedAt: post.publishedAt || post.createdAt,
        author: post.author,
      }, { excludeExtraneousValues: true });
    }
  }

  async create(userId: string, createPostDto: CreatePostDto): Promise<PostResponseDto> {
    try {
      this.logger.log(`📝 Creating post for user ${userId}`);

      // Validate userId
      if (!userId || typeof userId !== 'string') {
        this.logger.error(`Invalid userId provided: ${userId}`);
        throw new Error('Invalid userId');
      }

      // Create post with error handling
      const post = await this.prisma.post.create({
        data: {
          userId,
          ...createPostDto,
          tags: createPostDto.tags || [],
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              role: true,
              creator: {
                select: {
                  id: true,
                  subscriptionPrice: true,
                },
              },
            },
          },
        },
      }).catch((error: any) => {
        this.logger.error(`Error creating post in database:`, error);
        throw error;
      });

      this.logger.log(`✅ Post created: ${post.id}`);
      
      // Transform to DTO with error handling
      try {
        return this.toPostDto(post);
      } catch (dtoError: any) {
        this.logger.error(`Error transforming post to DTO:`, dtoError);
        // Return minimal DTO if transformation fails
        return plainToClass(PostResponseDto, {
          id: post.id,
          userId: post.userId,
          content: post.content || '',
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        }, { excludeExtraneousValues: true });
      }
    } catch (error: any) {
      this.logger.error(`Error creating post for user ${userId}:`, error);
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ posts: PostResponseDto[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        this.prisma.post.findMany({
          where: { isPublished: true },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                role: true,
                creator: {
                  select: {
                    id: true,
                    subscriptionPrice: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.post.count({ where: { isPublished: true } }),
      ]);

      // Safely map posts to DTOs, skipping any that fail transformation
      const postDtos: PostResponseDto[] = [];
      for (const post of posts) {
        try {
          const dto = this.toPostDto(post);
          postDtos.push(dto);
        } catch (dtoError: any) {
          this.logger.warn(`Error transforming post ${post.id} to DTO in findAll:`, dtoError);
          // Skip posts that can't be transformed
        }
      }

      return {
        posts: postDtos,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      this.logger.error('Error in findAll:', error);
      // Return empty result instead of throwing to prevent 500 errors
      return {
        posts: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }

  async findByUser(userId: string, page: number = 1, limit: number = 20): Promise<{ posts: PostResponseDto[]; total: number; page: number; totalPages: number }> {
    try {
      // Validate userId
      if (!userId || typeof userId !== 'string') {
        this.logger.warn(`Invalid userId provided: ${userId}`);
        return {
          posts: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }

      const skip = (page - 1) * limit;

      // Use separate queries to better handle errors
      let posts: any[] = [];
      let total = 0;

      try {
        // Get ALL posts from user (both published and unpublished for profile view)
        // Frontend can filter if needed
        posts = await this.prisma.post.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                role: true,
                creator: {
                  select: {
                    id: true,
                    subscriptionPrice: true,
                  },
                },
              },
            },
            _count: {
              select: {
                likes: true,
                postComments: true,
              },
            },
          },
        });
      } catch (findError: any) {
        this.logger.error(`Error in findMany for user ${userId}:`, findError);
        this.logger.error(`Error details:`, {
          message: findError?.message,
          code: findError?.code,
          meta: findError?.meta,
        });
        // Continue with empty posts
        posts = [];
      }

      try {
        total = await this.prisma.post.count({ where: { userId } });
      } catch (countError: any) {
        this.logger.error(`Error in count for user ${userId}:`, countError);
        // Use posts length as fallback
        total = posts.length;
      }

      // Safely map posts to DTOs, handling any errors in transformation
      const postDtos: PostResponseDto[] = [];
      for (const post of posts) {
        try {
          const dto = this.toPostDto(post);
          if (dto && dto.id) {
            postDtos.push(dto);
          } else {
            this.logger.warn(`⚠️ Invalid DTO returned for post ${post.id}, skipping`);
          }
        } catch (dtoError: any) {
          this.logger.warn(`Error transforming post ${post.id} to DTO:`, dtoError);
          this.logger.warn(`Post data that failed:`, {
            id: post.id,
            userId: post.userId,
            type: post.type,
            imageUrl: post.imageUrl,
            title: post.title,
          });
          // Skip posts that can't be transformed
        }
      }

      this.logger.log(`✅ Successfully transformed ${postDtos.length} of ${posts.length} posts for user ${userId}`);
      
      // If we have posts but couldn't transform any, log a warning
      if (posts.length > 0 && postDtos.length === 0) {
        this.logger.error(`❌ CRITICAL: Found ${posts.length} posts but transformed 0. All transformations failed.`);
      }

      return {
        posts: postDtos,
        total: postDtos.length > 0 ? total : 0, // If no posts could be transformed, return 0 total
        page,
        totalPages: postDtos.length > 0 ? Math.ceil(total / limit) : 0,
      };
    } catch (error: any) {
      this.logger.error(`Error fetching posts for user ${userId}:`, error);
      // Return empty result instead of throwing to allow profile to load
      return {
        posts: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }

  async findByCommunity(community: string, page: number = 1, limit: number = 20): Promise<{ posts: PostResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          community,
          isPublished: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              role: true,
              creator: {
                select: {
                  id: true,
                  subscriptionPrice: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.post.count({ where: { community, isPublished: true } }),
    ]);

    const postDtos = posts.map(post => this.toPostDto(post));

    return {
      posts: postDtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            creator: {
              select: {
                id: true,
                subscriptionPrice: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Increment views
    await this.prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return this.toPostDto(post);
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto): Promise<PostResponseDto> {
    // Verify post exists
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Authorization: Users can only update their own posts
    if (post.userId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            creator: {
              select: {
                id: true,
                subscriptionPrice: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`✅ Post ${id} updated successfully`);
    return plainToClass(PostResponseDto, updatedPost, { excludeExtraneousValues: true });
  }

  async delete(id: string, userId: string): Promise<{ message: string }> {
    // Verify post exists
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Authorization: Users can only delete their own posts
    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({ where: { id } });

    this.logger.log(`🗑️ Post ${id} deleted successfully`);
    return { message: 'Post deleted successfully' };
  }

  async incrementUpvote(id: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            creator: {
              select: {
                id: true,
                subscriptionPrice: true,
              },
            },
          },
        },
      },
    });

    return this.toPostDto(post);
  }

  async incrementDownvote(id: string): Promise<PostResponseDto> {
    const post = await this.prisma.post.update({
      where: { id },
      data: { downvotes: { increment: 1 } },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            creator: {
              select: {
                id: true,
                subscriptionPrice: true,
              },
            },
          },
        },
      },
    });

    return this.toPostDto(post);
  }

  // ============================================================================
  // LIKES
  // ============================================================================

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    this.logger.log(`❤️ Toggling like for post ${postId} by user ${userId}`);

    try {
      // Check if like already exists
      const existingLike = await this.prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      if (existingLike) {
        // Unlike: Delete the like
        await this.prisma.like.delete({
          where: { id: existingLike.id },
        });

        // Decrement post upvotes
        await this.prisma.post.update({
          where: { id: postId },
          data: { upvotes: { decrement: 1 } },
        });

        const likeCount = await this.prisma.like.count({
          where: { postId },
        });

        this.logger.log(`💔 Unliked post ${postId}, new count: ${likeCount}`);
        return { liked: false, likeCount };
      } else {
        // Like: Create new like
        try {
          await this.prisma.like.create({
            data: {
              userId,
              postId,
            },
          });

          // Increment post upvotes
          await this.prisma.post.update({
            where: { id: postId },
            data: { upvotes: { increment: 1 } },
          });

          const likeCount = await this.prisma.like.count({
            where: { postId },
          });

          // Get post author and liker info for notification
          const [post, liker] = await Promise.all([
            this.prisma.post.findUnique({
              where: { id: postId },
              select: { userId: true, title: true, content: true },
            }),
            this.prisma.user.findUnique({
              where: { id: userId },
              select: { username: true, displayName: true, avatarUrl: true },
            }),
          ]);

          // Create notification for post author (don't notify yourself)
          if (post && liker && post.userId !== userId) {
            await this.prisma.notification.create({
              data: {
                userId: post.userId,
                type: 'NEW_LIKE',
                title: 'New like on your post',
                message: `${liker.displayName || liker.username} liked your post`,
                data: {
                  postId,
                  postTitle: post.title,
                  postContent: post.content?.substring(0, 100),
                  likerId: userId,
                  likerUsername: liker.username,
                  likerDisplayName: liker.displayName,
                  likerAvatar: liker.avatarUrl,
                },
              },
            });
            this.logger.log(`🔔 Notification created for post author ${post.userId}`);
          }

          this.logger.log(`❤️ Liked post ${postId}, new count: ${likeCount}`);
          return { liked: true, likeCount };
        } catch (createError: any) {
          // Handle race condition: if like was already created by another request
          if (createError.code === 'P2002') {
            // Unique constraint violation - like already exists
            this.logger.warn(`⚠️ Like already exists for post ${postId} by user ${userId} (race condition handled)`);
            const likeCount = await this.prisma.like.count({
              where: { postId },
            });
            return { liked: true, likeCount };
          }
          throw createError;
        }
      }
    } catch (error: any) {
      // Handle the case where the like was deleted by another request during our check
      if (error.code === 'P2025') {
        // Record not found - like was deleted by another request
        this.logger.warn(`⚠️ Like was already deleted for post ${postId} (race condition handled)`);
        const likeCount = await this.prisma.like.count({
          where: { postId },
        });
        return { liked: false, likeCount };
      }
      throw error;
    }
  }

  async getLikeStatus(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const [existingLike, likeCount] = await Promise.all([
      this.prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      }),
      this.prisma.like.count({
        where: { postId },
      }),
    ]);

    return {
      liked: !!existingLike,
      likeCount,
    };
  }

  async getUserLikedPosts(userId: string): Promise<string[]> {
    const likes = await this.prisma.like.findMany({
      where: { userId },
      select: { postId: true },
    });

    return likes.map(like => like.postId);
  }
}

