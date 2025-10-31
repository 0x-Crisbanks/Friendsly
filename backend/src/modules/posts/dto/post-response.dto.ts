import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PostType, PostVisibility } from './create-post.dto';

export class PostAuthorDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiPropertyOptional()
  @Expose()
  displayName?: string;

  @ApiPropertyOptional()
  @Expose()
  avatarUrl?: string;

  @ApiPropertyOptional()
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

export class PostResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiPropertyOptional()
  @Expose()
  title?: string;

  @ApiProperty()
  @Expose()
  content: string;

  @ApiPropertyOptional()
  @Expose()
  imageUrl?: string;

  @ApiPropertyOptional()
  @Expose()
  videoUrl?: string;

  @ApiPropertyOptional()
  @Expose()
  thumbnailUrl?: string;

  @ApiProperty({ enum: PostType })
  @Expose()
  type: PostType;

  @ApiPropertyOptional()
  @Expose()
  community?: string;

  @ApiPropertyOptional()
  @Expose()
  communityIcon?: string;

  @ApiPropertyOptional()
  @Expose()
  flair?: string;

  @ApiPropertyOptional()
  @Expose()
  flairColor?: string;

  @ApiProperty({ enum: PostVisibility })
  @Expose()
  visibility: PostVisibility;

  @ApiProperty()
  @Expose()
  isPPV: boolean;

  @ApiPropertyOptional()
  @Expose()
  priceUSD?: number;

  @ApiProperty()
  @Expose()
  upvotes: number;

  @ApiProperty()
  @Expose()
  downvotes: number;

  @ApiProperty()
  @Expose()
  comments: number;

  @ApiProperty()
  @Expose()
  shares: number;

  @ApiProperty()
  @Expose()
  views: number;

  @ApiProperty({ type: [String] })
  @Expose()
  tags: string[];

  @ApiPropertyOptional()
  @Expose()
  pollOptions?: any;

  @ApiProperty()
  @Expose()
  isPinned: boolean;

  @ApiProperty()
  @Expose()
  isTrending: boolean;

  @ApiProperty()
  @Expose()
  isPublished: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  publishedAt: Date;

  @ApiProperty({ type: PostAuthorDto })
  @Expose()
  author: PostAuthorDto;
}

