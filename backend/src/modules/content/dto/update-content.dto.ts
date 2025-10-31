import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentVisibility } from './create-content.dto';

export class UpdateContentDto {
  @ApiPropertyOptional({
    description: 'Content title',
    example: 'My Amazing Artwork',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

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

  @ApiPropertyOptional({
    description: 'Content visibility',
    enum: ContentVisibility,
    example: ContentVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;

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
