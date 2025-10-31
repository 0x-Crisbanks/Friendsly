import { IsString, IsOptional, MinLength, MaxLength, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCreatorDto {
  @ApiPropertyOptional({
    description: 'Username (3-30 characters)',
    example: 'artistjohn',
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @ApiPropertyOptional({
    description: 'IPFS CID for profile data',
    example: 'QmX5jK2mZqN...',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  profileCID?: string;

  @ApiPropertyOptional({
    description: 'Monthly subscription price in wei',
    example: '1000000000000000000',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subscriptionPrice?: number;

  @ApiPropertyOptional({
    description: 'Creator category',
    example: 'Art',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({
    description: 'Creator bio/description',
    example: 'Digital artist specializing in NFT art',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
