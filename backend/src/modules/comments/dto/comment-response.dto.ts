import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CommentUserDto {
  @ApiProperty({ description: 'User ID', example: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Username', example: 'john_doe' })
  @Expose()
  username: string;

  @ApiPropertyOptional({ description: 'Display name', example: 'John Doe' })
  @Expose()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg' })
  @Expose()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'User role', example: 'USER' })
  @Expose()
  role?: string;

  @ApiProperty({ description: 'Whether user is a creator', example: false })
  @Expose()
  isCreator: boolean;

  @ApiPropertyOptional({ description: 'Creator profile data if user is a creator' })
  @Expose()
  creator?: {
    id: string;
    subscriptionPrice: any;
  };
}

export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID', example: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Post ID', example: 'uuid' })
  @Expose()
  postId: string;

  @ApiProperty({ description: 'Comment content', example: 'Great post!' })
  @Expose()
  content: string;

  @ApiPropertyOptional({ description: 'Image URL', example: 'https://example.com/image.jpg' })
  @Expose()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Video URL', example: 'https://example.com/video.mp4' })
  @Expose()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies', example: 'uuid' })
  @Expose()
  parentId?: string;

  @ApiProperty({ description: 'Like count', example: 5 })
  @Expose()
  likes: number;

  @ApiProperty({ description: 'Is edited', example: false })
  @Expose()
  isEdited: boolean;

  @ApiProperty({ description: 'Created at', example: '2023-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Comment author' })
  @Expose()
  user: CommentUserDto;

  @ApiProperty({ description: 'Number of replies', example: 3 })
  @Expose()
  repliesCount: number;
}
