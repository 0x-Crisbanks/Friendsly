import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ContentResponseDto {
  @ApiProperty({ description: 'Content ID', example: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Creator ID', example: 'uuid' })
  @Expose()
  creatorId: string;

  @ApiProperty({ description: 'Content title', example: 'My Amazing Artwork' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Content type', example: 'IMAGE', enum: ['IMAGE', 'VIDEO', 'AUDIO', 'TEXT', 'DOCUMENT'] })
  @Expose()
  contentType: string;

  @ApiProperty({ description: 'IPFS CID', example: 'QmX5jK2mZqN...' })
  @Expose()
  ipfsCID: string;

  @ApiProperty({ description: 'IPFS gateway URL', example: 'https://ipfs.io/ipfs/QmX5jK2mZqN...' })
  @Expose()
  ipfsUrl: string;

  @ApiPropertyOptional({ description: 'Content description', example: 'This is my artwork' })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ description: 'Thumbnail IPFS CID', example: 'QmY6kL3nZrP...' })
  @Expose()
  thumbnailCID?: string;

  @ApiPropertyOptional({ description: 'Thumbnail gateway URL', example: 'https://ipfs.io/ipfs/QmY6kL3nZrP...' })
  @Expose()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Content visibility', example: 'PUBLIC', enum: ['PUBLIC', 'SUBSCRIBERS_ONLY', 'PREMIUM'] })
  @Expose()
  visibility: string;

  @ApiPropertyOptional({ description: 'Price in wei', example: '1000000000000000000' })
  @Expose()
  price?: string;

  @ApiProperty({ description: 'View count', example: 150 })
  @Expose()
  viewCount: number;

  @ApiProperty({ description: 'Like count', example: 45 })
  @Expose()
  likeCount: number;

  @ApiProperty({ description: 'Comment count', example: 12 })
  @Expose()
  commentCount: number;

  @ApiProperty({ description: 'Comments enabled', example: true })
  @Expose()
  enableComments: boolean;

  @ApiProperty({ description: 'Likes enabled', example: true })
  @Expose()
  enableLikes: boolean;

  @ApiProperty({ description: 'Published status', example: true })
  @Expose()
  isPublished: boolean;

  @ApiProperty({ description: 'Creation date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Published date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  publishedAt?: Date;

  constructor(partial: Partial<ContentResponseDto>) {
    Object.assign(this, partial);
  }
}
