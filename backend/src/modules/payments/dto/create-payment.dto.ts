import { IsString, IsNotEmpty, IsEthereumAddress, IsEnum, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentType {
  TIP = 'TIP',
  SUBSCRIPTION = 'SUBSCRIPTION',
  CONTENT_PURCHASE = 'CONTENT_PURCHASE',
  LIVE_STREAM = 'LIVE_STREAM',
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Creator wallet address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  })
  @IsNotEmpty()
  @IsEthereumAddress()
  creatorAddress: string;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.TIP,
  })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({
    description: 'Amount in wei',
    example: '1000000000000000000',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Transaction hash from blockchain',
    example: '0x...',
  })
  @IsNotEmpty()
  @IsString()
  transactionHash: string;

  @ApiPropertyOptional({
    description: 'Related content ID (for content purchases)',
    example: 'uuid',
  })
  @IsOptional()
  @IsString()
  contentId?: string;

  @ApiPropertyOptional({
    description: 'Payment message/note',
    example: 'Great content!',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
