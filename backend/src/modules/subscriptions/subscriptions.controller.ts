import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create/record a subscription (authenticated)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Subscription created successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid transaction' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Creator not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Subscription already recorded' })
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto, @Request() req: any) {
    return this.subscriptionsService.create(createSubscriptionDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all subscriptions (authenticated, paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by subscriber user ID' })
  @ApiQuery({ name: 'creatorId', required: false, type: String, description: 'Filter by creator ID' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Only active subscriptions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscriptions retrieved successfully', type: [SubscriptionResponseDto] })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
    @Query('creatorId') creatorId?: string,
    @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) activeOnly?: boolean,
  ) {
    return this.subscriptionsService.findAll(page, limit, userId, creatorId, activeOnly);
  }

  @Get('my-subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my subscriptions as a subscriber (authenticated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Only active subscriptions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscriptions retrieved successfully', type: [SubscriptionResponseDto] })
  async getMySubscriptions(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) activeOnly?: boolean,
  ) {
    return this.subscriptionsService.getUserSubscriptions(req.user.userId, page, limit, activeOnly);
  }

  @Get('my-subscribers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my subscribers as a creator (authenticated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Only active subscriptions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscribers retrieved successfully', type: [SubscriptionResponseDto] })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getMySubscribers(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) activeOnly?: boolean,
  ) {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        return {
          subscriptions: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }

      // Get subscribers for this user as creator
      return await this.subscriptionsService.getCreatorSubscriptionsByUserId(userId, page, limit, activeOnly);
    } catch (error: any) {
      console.error('Error in getMySubscribers:', error);
      // Return empty result instead of 500 error
      return {
        subscriptions: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription statistics for current user (authenticated)' })
  @ApiQuery({ name: 'asCreator', required: false, type: Boolean, description: 'Get stats as creator' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscription stats retrieved successfully' })
  async getStats(@Request() req: any, @Query('asCreator', new DefaultValuePipe(false), ParseBoolPipe) asCreator?: boolean) {
    return this.subscriptionsService.getSubscriptionStats(req.user.userId, asCreator);
  }

  @Get('check/:creatorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if subscribed to a creator (authenticated)' })
  @ApiParam({ name: 'creatorId', description: 'Creator ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscription status retrieved successfully' })
  async checkStatus(@Param('creatorId') creatorId: string, @Request() req: any) {
    return this.subscriptionsService.checkSubscriptionStatus(req.user.userId, creatorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription by ID (authenticated)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscription retrieved successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  async findById(@Param('id') id: string) {
    return this.subscriptionsService.findById(id);
  }

  @Get('token/:tokenId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription by token ID (authenticated)' })
  @ApiParam({ name: 'tokenId', description: 'NFT token ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscription retrieved successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  async findByTokenId(@Param('tokenId', ParseIntPipe) tokenId: number) {
    return this.subscriptionsService.findByTokenId(tokenId);
  }

  @Put(':id/renew')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renew subscription (authenticated)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscription renewed successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot renew another user\'s subscription' })
  async renew(@Param('id') id: string, @Body() body: { transactionHash: string }, @Request() req: any) {
    return this.subscriptionsService.renewSubscription(id, req.user.userId, body.transactionHash);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription (authenticated)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subscription cancelled successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot cancel another user\'s subscription' })
  async cancel(@Param('id') id: string, @Request() req: any) {
    return this.subscriptionsService.cancelSubscription(id, req.user.userId);
  }

  @Put(':id/toggle-auto-renew')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle auto-renewal for subscription (authenticated)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Auto-renewal toggled successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot modify another user\'s subscription' })
  async toggleAutoRenew(@Param('id') id: string, @Request() req: any) {
    return this.subscriptionsService.toggleAutoRenew(id, req.user.userId);
  }
}
