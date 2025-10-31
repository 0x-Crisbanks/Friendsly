import { IsString, IsNotEmpty, IsEthereumAddress, IsOptional, MinLength, MaxLength, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCreatorDto {
  @ApiProperty({
    description: 'Wallet address of the creator',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  })
  @IsNotEmpty()
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Username (3-30 characters)',
    example: 'artistjohn',
    minLength: 3,
    maxLength: 30,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({
    description: 'IPFS CID for profile data',
    example: 'QmX5jK2mZqN...',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  profileCID: string;

  @ApiProperty({
    description: 'Monthly subscription price in wei',
    example: '1000000000000000000',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subscriptionPrice: number;

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
