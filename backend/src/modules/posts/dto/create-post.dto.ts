import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, Min } from 'class-validator';

export enum PostType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  POLL = 'POLL',
}

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  SUBSCRIBERS = 'SUBSCRIBERS',
  PPV = 'PPV',
}

export class CreatePostDto {
  @ApiPropertyOptional({ description: 'Post title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Post content/description' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Image URL (from Supabase)' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Video URL (from Supabase)' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Video thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Post type', enum: PostType, default: PostType.TEXT })
  @IsEnum(PostType)
  type: PostType;

  @ApiPropertyOptional({ description: 'Community name' })
  @IsOptional()
  @IsString()
  community?: string;

  @ApiPropertyOptional({ description: 'Community icon' })
  @IsOptional()
  @IsString()
  communityIcon?: string;

  @ApiPropertyOptional({ description: 'Post flair' })
  @IsOptional()
  @IsString()
  flair?: string;

  @ApiPropertyOptional({ description: 'Flair color' })
  @IsOptional()
  @IsString()
  flairColor?: string;

  @ApiProperty({ description: 'Post visibility', enum: PostVisibility, default: PostVisibility.PUBLIC })
  @IsEnum(PostVisibility)
  visibility: PostVisibility;

  @ApiProperty({ description: 'Is pay-per-view', default: false })
  @IsBoolean()
  isPPV: boolean;

  @ApiPropertyOptional({ description: 'Price in USD for PPV content' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceUSD?: number;

  @ApiPropertyOptional({ description: 'Tags for the post', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Poll options (JSON)', type: 'object' })
  @IsOptional()
  pollOptions?: any;

  @ApiProperty({ description: 'Is pinned', default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

