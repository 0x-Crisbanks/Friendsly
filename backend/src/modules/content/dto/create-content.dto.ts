import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  DOCUMENT = 'DOCUMENT',
}

export enum ContentVisibility {
  PUBLIC = 'PUBLIC',
  SUBSCRIBERS_ONLY = 'SUBSCRIBERS_ONLY',
  PREMIUM = 'PREMIUM',
}

export class CreateContentDto {
  @ApiProperty({
    description: 'Content title',
    example: 'My Amazing Artwork',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Content type',
    enum: ContentType,
    example: ContentType.IMAGE,
  })
  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({
    description: 'IPFS CID for the content',
    example: 'QmX5jK2mZqN...',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  ipfsCID: string;

  @ApiPropertyOptional({
    description: 'Content description',
    example: 'This is a detailed description of my content',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Thumbnail IPFS CID',
    example: 'QmY6kL3nZrP...',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  thumbnailCID?: string;

  @ApiProperty({
    description: 'Content visibility',
    enum: ContentVisibility,
    example: ContentVisibility.PUBLIC,
  })
  @IsNotEmpty()
  @IsEnum(ContentVisibility)
  visibility: ContentVisibility;

  @ApiPropertyOptional({
    description: 'Price in wei (for premium content)',
    example: '1000000000000000000',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Tags (comma-separated)',
    example: 'art,digital,nft',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tags?: string;

  @ApiPropertyOptional({
    description: 'Enable comments',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableComments?: boolean;

  @ApiPropertyOptional({
    description: 'Enable likes',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableLikes?: boolean;
}
