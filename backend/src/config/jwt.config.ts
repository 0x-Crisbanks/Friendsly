import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  // Extended from 15m to 30d for better UX and performance
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '30d',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '90d',
}));
