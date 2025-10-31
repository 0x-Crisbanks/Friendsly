import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID', example: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Blockchain payment ID', example: '0x...' })
  @Expose()
  blockchainPaymentId: string;

  @ApiProperty({ description: 'Payer user ID', example: 'uuid' })
  @Expose()
  payerId: string;

  @ApiProperty({ description: 'Creator ID', example: 'uuid' })
  @Expose()
  creatorId: string;

  @ApiProperty({ description: 'Payment type', example: 'TIP', enum: ['TIP', 'SUBSCRIPTION', 'CONTENT_PURCHASE', 'LIVE_STREAM'] })
  @Expose()
  paymentType: string;

  @ApiProperty({ description: 'Amount in wei', example: '1000000000000000000' })
  @Expose()
  amount: string;

  @ApiProperty({ description: 'Platform fee in wei', example: '100000000000000000' })
  @Expose()
  platformFee: string;

  @ApiProperty({ description: 'Creator amount in wei', example: '900000000000000000' })
  @Expose()
  creatorAmount: string;

  @ApiProperty({ description: 'Payment status', example: 'COMPLETED', enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] })
  @Expose()
  status: string;

  @ApiProperty({ description: 'Transaction hash', example: '0x...' })
  @Expose()
  transactionHash: string;

  @ApiPropertyOptional({ description: 'Related content ID', example: 'uuid' })
  @Expose()
  contentId?: string;

  @ApiPropertyOptional({ description: 'Payment message', example: 'Great content!' })
  @Expose()
  message?: string;

  @ApiProperty({ description: 'Payment creation date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Payment completion date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  completedAt?: Date;

  constructor(partial: Partial<PaymentResponseDto>) {
    Object.assign(this, partial);
  }
}
