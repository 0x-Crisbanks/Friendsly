import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/database/prisma.service';
import { Web3Service } from '@/blockchain/web3.service';
import { Web3LoginDto, EmailLoginDto, EmailRegisterDto } from './dto/web3-login.dto';

/**
 * Authentication Service
 * Handles Web3 and email authentication
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly nonceExpiry = 5 * 60 * 1000; // 5 minutes
  private readonly messagePrefix: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private web3Service: Web3Service,
  ) {
    this.messagePrefix = configService.get('WEB3_MESSAGE_PREFIX') || 'Friendsly Login:';
  }

  /**
   * Generate a nonce for Web3 authentication
   */
  async generateNonce(walletAddress: string, userType?: string): Promise<string> {
    // Validate address
    if (!this.web3Service.isValidAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    // Always normalize to lowercase for database consistency
    const normalizedAddress = this.web3Service.getAddress(walletAddress).toLowerCase();
    const nonce = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.nonceExpiry);

    this.logger.log(`🔍 Generating nonce for wallet: ${normalizedAddress}, userType: ${userType || 'not specified'}`);

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: { creator: true },
    });

    if (!user) {
      // Check if username already exists and generate a unique one
      const baseUsername = `user_${normalizedAddress.slice(2, 10)}`;
      let username = baseUsername;
      let suffix = 1;

      while (await this.prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}_${suffix}`;
        suffix++;
      }

      // Determine role based on userType
      const role = userType === 'creator' ? 'CREATOR' : 'USER';

      // Create new user
      user = await this.prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          username,
          role,
          isVerified: false,
        },
        include: { creator: true },
      });
      this.logger.log(`✅ New user created: ${normalizedAddress} with username: ${username}, role: ${role}`);

      // If user chose to be a creator, create Creator profile
      if (userType === 'creator') {
        await this.prisma.creator.create({
          data: {
            userId: user.id,
            walletAddress: normalizedAddress,
            username,
            subscriptionEnabled: false,
            subscriptionPrice: 0,
          },
        });
        this.logger.log(`✅ Creator profile created for user: ${user.id}`);
      }
    }

    // Store nonce
    await this.prisma.nonce.create({
      data: {
        userId: user.id,
        nonce,
        expiresAt,
      },
    });

    return nonce;
  }

  /**
   * Web3 login with signature verification
   */
  async loginWithWeb3(dto: Web3LoginDto) {
    // Always normalize to lowercase for database consistency
    const normalizedAddress = this.web3Service.getAddress(dto.walletAddress).toLowerCase();

    this.logger.log(`🔍 Attempting login for wallet: ${normalizedAddress}`);

    // Find user with creator relation
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: {
        creator: true, // Include creator data if exists
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify nonce
    const nonceRecord = await this.prisma.nonce.findFirst({
      where: {
        userId: user.id,
        nonce: dto.nonce,
        used: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!nonceRecord) {
      throw new UnauthorizedException('Invalid or expired nonce');
    }

    // Construct message that was signed
    const message = `${this.messagePrefix} ${dto.nonce}`;

    // Verify signature
    const isValid = this.web3Service.verifySignature(
      message,
      dto.signature,
      normalizedAddress,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Mark nonce as used
    await this.prisma.nonce.update({
      where: { id: nonceRecord.id },
      data: { used: true },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.walletAddress || '');

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    this.logger.log(`User logged in via Web3: ${normalizedAddress}`);

    const sanitizedUser = this.sanitizeUser(user);
    this.logger.log(`User role: ${user.role}, isCreator: ${sanitizedUser.isCreator}`);

    return {
      user: sanitizedUser,
      ...tokens,
    };
  }

  /**
   * Email login
   */
  async loginWithEmail(dto: EmailLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        creator: true, // Include creator data if exists
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email || '');

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    this.logger.log(`User logged in via email: ${dto.email}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Email registration
   */
  async registerWithEmail(dto: EmailRegisterDto) {
    // Check if email exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new BadRequestException('Email already registered');
    }

    // Check if username exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUsername) {
      throw new BadRequestException('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        isVerified: false,
        emailVerified: false,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email || '');

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    this.logger.log(`New user registered via email: ${dto.email}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      // Verify session exists
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if expired
      if (new Date() > session.expiresAt) {
        await this.prisma.session.delete({ where: { id: session.id } });
        throw new UnauthorizedException('Refresh token expired');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(payload.sub, payload.identifier);

      // Update session
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout
   */
  async logout(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    this.logger.log(`User logged out: ${userId}`);
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, identifier: string) {
    const payload = {
      sub: userId,
      identifier, // email or wallet address
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.accessExpiry'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.refreshExpiry'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get('jwt.accessExpiry'),
    };
  }

  /**
   * Create session record
   */
  private async createSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return this.prisma.session.create({
      data: {
        userId,
        token: accessToken,
        refreshToken,
        expiresAt,
      },
    });
  }

  /**
   * Sanitize user data for response
   */
  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    
    // Add isCreator flag based on creator relation
    const isCreator = !!user.creator || user.role?.toLowerCase() === 'creator';
    
    return {
      ...sanitized,
      isCreator,
    };
  }

  /**
   * Validate user by ID
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        walletAddress: true,
        role: true,
        isVerified: true,
        createdAt: true,
        creator: true, // Include creator relation
      },
    });

    if (!user) {
      return null;
    }

    // Add isCreator flag
    return {
      ...user,
      isCreator: !!user.creator || user.role?.toLowerCase() === 'creator',
    };
  }
}
