import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription ID', example: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'NFT token ID', example: 1 })
  @Expose()
  tokenId: number;

  @ApiProperty({ description: 'Subscriber user ID', example: 'uuid' })
  @Expose()
  subscriberId: string;

  @ApiProperty({ description: 'Creator ID', example: 'uuid' })
  @Expose()
  creatorId: string;

  @ApiProperty({ description: 'Subscription start time', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  startTime: Date;

  @ApiProperty({ description: 'Subscription end time', example: '2024-02-01T00:00:00.000Z' })
  @Expose()
  endTime: Date;

  @ApiProperty({ description: 'Active status', example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Auto-renewal enabled', example: false })
  @Expose()
  autoRenew: boolean;

  @ApiProperty({ description: 'Subscription amount in wei', example: '1000000000000000000' })
  @Expose()
  amount: string;

  @ApiProperty({ description: 'Transaction hash', example: '0x...' })
  @Expose()
  transactionHash: string;

  @ApiPropertyOptional({ description: 'Cancelled date', example: '2024-01-15T00:00:00.000Z' })
  @Expose()
  cancelledAt?: Date;

  @ApiProperty({ description: 'Subscription creation date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<SubscriptionResponseDto>) {
    Object.assign(this, partial);
  }
}
