import { IsString, IsNotEmpty, IsEthereumAddress, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Creator wallet address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  })
  @IsNotEmpty()
  @IsEthereumAddress()
  creatorAddress: string;

  @ApiProperty({
    description: 'Subscription token ID from blockchain',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  tokenId: number;

  @ApiProperty({
    description: 'Transaction hash from blockchain',
    example: '0x...',
  })
  @IsNotEmpty()
  @IsString()
  transactionHash: string;

  @ApiProperty({
    description: 'Subscription amount in wei',
    example: '1000000000000000000',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
}
