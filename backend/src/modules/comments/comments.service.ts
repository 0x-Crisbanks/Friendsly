import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createCommentDto: CreateCommentDto): Promise<CommentResponseDto> {
    // Verify post exists
    const post = await this.prisma.post.findUnique({
      where: { id: createCommentDto.postId },
      select: { id: true, title: true, userId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        postId: createCommentDto.postId,
        userId,
        content: createCommentDto.content,
        imageUrl: createCommentDto.imageUrl,
        videoUrl: createCommentDto.videoUrl,
        parentId: createCommentDto.parentId,
      },
      include: {
        user: {
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
            replies: true,
          },
        },
      },
    });

    // Update post comment count
    await this.prisma.post.update({
      where: { id: createCommentDto.postId },
      data: { comments: { increment: 1 } },
    });

    // Create notification for post author (don't notify yourself)
    if (post.userId !== userId) {
      const commenter = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, displayName: true, avatarUrl: true },
      });

      if (commenter) {
        await this.prisma.notification.create({
          data: {
            userId: post.userId,
            type: 'NEW_REPLY',
            title: 'New comment on your post',
            message: `${commenter.displayName || commenter.username} commented on your post`,
            data: {
              postId: createCommentDto.postId,
              postTitle: post.title,
              commentId: comment.id,
              commentContent: createCommentDto.content?.substring(0, 100),
              commenterId: userId,
              commenterUsername: commenter.username,
              commenterDisplayName: commenter.displayName,
              commenterAvatar: commenter.avatarUrl,
            },
          },
        });
      }
    }

    return this.toCommentDto(comment);
  }

  async findAll(postId: string, page: number = 1, limit: number = 50): Promise<CommentResponseDto[]> {
    const comments = await this.prisma.comment.findMany({
      where: { 
        postId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
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
            replies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return comments.map(comment => this.toCommentDto(comment));
  }

  async findReplies(parentId: string, page: number = 1, limit: number = 20): Promise<CommentResponseDto[]> {
    const replies = await this.prisma.comment.findMany({
      where: { parentId },
      include: {
        user: {
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
            replies: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return replies.map(reply => this.toCommentDto(reply));
  }

  async update(userId: string, commentId: string, updateCommentDto: UpdateCommentDto): Promise<CommentResponseDto> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
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
            replies: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: updateCommentDto.content,
        imageUrl: updateCommentDto.imageUrl,
        videoUrl: updateCommentDto.videoUrl,
        isEdited: true,
      },
      include: {
        user: {
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
            replies: true,
          },
        },
      },
    });

    return this.toCommentDto(updatedComment);
  }

  async remove(userId: string, commentId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete comment and all replies
    await this.prisma.comment.deleteMany({
      where: {
        OR: [
          { id: commentId },
          { parentId: commentId },
        ],
      },
    });

    // Update post comment count
    const totalDeleted = 1 + comment._count.replies;
    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { comments: { decrement: totalDeleted } },
    });
  }

  private toCommentDto(comment: any): CommentResponseDto {
    const dto = plainToClass(CommentResponseDto, comment, { excludeExtraneousValues: true });
    
    // Set isCreator flag for the user
    if (dto.user) {
      (dto.user as any).isCreator = !!(dto.user as any).creator || dto.user.role?.toLowerCase() === 'creator';
    }
    
    return dto;
  }
}
