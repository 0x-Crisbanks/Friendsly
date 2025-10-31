import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a payment (authenticated)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Payment recorded successfully', type: PaymentResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid transaction or payment already recorded' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Creator not found' })
  async create(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
    return this.paymentsService.create(createPaymentDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments (authenticated, paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by payer user ID' })
  @ApiQuery({ name: 'creatorId', required: false, type: String, description: 'Filter by creator ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payments retrieved successfully', type: [PaymentResponseDto] })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
    @Query('creatorId') creatorId?: string,
  ) {
    return this.paymentsService.findAll(page, limit, userId, creatorId);
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my payments as a payer (authenticated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payments retrieved successfully', type: [PaymentResponseDto] })
  async getMyPayments(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.paymentsService.getUserPayments(req.user.userId, page, limit);
  }

  @Get('my-earnings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my earnings as a creator (authenticated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Earnings retrieved successfully', type: [PaymentResponseDto] })
  async getMyEarnings(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    // First, find the creator record for this user
    const creator = await this.paymentsService['prisma'].creator.findUnique({
      where: { userId: req.user.userId },
    });

    if (!creator) {
      return {
        payments: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }

    return this.paymentsService.getCreatorPayments(creator.id, page, limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment statistics for current user (authenticated)' })
  @ApiQuery({ name: 'asCreator', required: false, type: Boolean, description: 'Get stats as creator' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment stats retrieved successfully' })
  async getStats(@Request() req: any, @Query('asCreator') asCreator?: boolean) {
    return this.paymentsService.getPaymentStats(req.user.userId, asCreator === true);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID (authenticated)' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment retrieved successfully', type: PaymentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment not found' })
  async findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Get('tx/:hash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by transaction hash (authenticated)' })
  @ApiParam({ name: 'hash', description: 'Transaction hash' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment retrieved successfully', type: PaymentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment not found' })
  async findByTransactionHash(@Param('hash') hash: string) {
    return this.paymentsService.findByTransactionHash(hash);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a payment (authenticated)' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment refunded successfully', type: PaymentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot refund this payment' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Payment cannot be refunded' })
  async refund(@Param('id') id: string, @Request() req: any) {
    return this.paymentsService.refundPayment(id, req.user.userId);
  }
}
