import { IsString, IsEthereumAddress, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestNonceDto {
  @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEa' })
  @IsEthereumAddress()
  walletAddress: string;

  @ApiPropertyOptional({ example: 'user', enum: ['user', 'creator'], description: 'User type for registration' })
  @IsOptional()
  @IsString()
  @IsIn(['user', 'creator'])
  userType?: string;
}

export class Web3LoginDto {
  @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEa' })
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({ example: '0x...' })
  @IsString()
  signature: string;

  @ApiProperty({ example: 'random-nonce-string' })
  @IsString()
  nonce: string;
}

export class EmailLoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class EmailRegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'username123' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
