import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @Expose()
  username: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john@example.com' })
  @Expose()
  email?: string;

  @ApiPropertyOptional({ description: 'Wallet address', example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' })
  @Expose()
  walletAddress?: string;

  @ApiProperty({ description: 'User role', example: 'USER', enum: ['USER', 'CREATOR', 'ADMIN'] })
  @Expose()
  role: string;

  @ApiPropertyOptional({ description: 'Display name', example: 'John Doe' })
  @Expose()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Bio/description', example: 'Digital artist' })
  @Expose()
  bio?: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg' })
  @Expose()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Cover image URL', example: 'https://example.com/cover.jpg' })
  @Expose()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'San Francisco, CA' })
  @Expose()
  location?: string;

  @ApiPropertyOptional({ description: 'Website URL', example: 'https://johndoe.com' })
  @Expose()
  website?: string;

  @ApiPropertyOptional({ description: 'Twitter handle', example: '@johndoe' })
  @Expose()
  twitter?: string;

  @ApiPropertyOptional({ description: 'Instagram handle', example: '@johndoe' })
  @Expose()
  instagram?: string;

  @ApiProperty({ description: 'Email verified status', example: false })
  @Expose()
  emailVerified: boolean;

  @ApiProperty({ description: 'Account creation date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'Whether user is a creator', example: false })
  @Expose()
  isCreator: boolean;

  @ApiPropertyOptional({ description: 'Creator profile data if user is a creator' })
  @Expose()
  creator?: {
    id: string;
    walletAddress: string;
    username: string;
    verified: boolean;
    subscriptionPrice: any;
  };

  @Exclude()
  passwordHash?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
    // Calculate isCreator based on creator relation or role
    this.isCreator = !!this.creator || this.role?.toLowerCase() === 'creator';
  }
}
