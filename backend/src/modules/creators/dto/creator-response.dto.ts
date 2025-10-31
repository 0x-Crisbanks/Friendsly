import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreatorResponseDto {
  @ApiProperty({ description: 'Creator ID', example: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User ID', example: 'uuid' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Wallet address', example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' })
  @Expose()
  walletAddress: string;

  @ApiProperty({ description: 'Creator username', example: 'artistjohn' })
  @Expose()
  username: string;

  @ApiProperty({ description: 'IPFS profile CID', example: 'QmX5jK2mZqN...' })
  @Expose()
  profileCID: string;

  @ApiProperty({ description: 'Subscription price in wei', example: '1000000000000000000' })
  @Expose()
  subscriptionPrice: string;

  @ApiProperty({ description: 'Total earnings in wei', example: '5000000000000000000' })
  @Expose()
  totalEarnings: string;

  @ApiProperty({ description: 'Total subscriber count', example: 150 })
  @Expose()
  subscriberCount: number;

  @ApiProperty({ description: 'Total content count', example: 45 })
  @Expose()
  contentCount: number;

  @ApiProperty({ description: 'Verified status', example: false })
  @Expose()
  verified: boolean;

  @ApiProperty({ description: 'Active status', example: true })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Creator category', example: 'Art' })
  @Expose()
  category?: string;

  @ApiPropertyOptional({ description: 'Creator bio/description', example: 'Digital artist' })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Account creation date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<CreatorResponseDto>) {
    Object.assign(this, partial);
  }
}
