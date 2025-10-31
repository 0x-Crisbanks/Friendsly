import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { CreatorsService } from './creators.service';
import { CreateCreatorDto } from './dto/create-creator.dto';
import { UpdateCreatorDto } from './dto/update-creator.dto';
import { CreatorResponseDto } from './dto/creator-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('creators')
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register as a creator (authenticated)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Creator registered successfully', type: CreatorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Creator already exists or username taken' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot create profile for another wallet' })
  async create(@Body() createCreatorDto: CreateCreatorDto, @Request() req: any) {
    return this.creatorsService.create(createCreatorDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all creators (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  @ApiQuery({ name: 'verified', required: false, type: Boolean, description: 'Filter by verified status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Creators retrieved successfully', type: [CreatorResponseDto] })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('category') category?: string,
    @Query('verified') verified?: boolean,
  ) {
    return this.creatorsService.findAll(page, limit, category, verified);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search creators by username, description, or category' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results retrieved successfully', type: [CreatorResponseDto] })
  async search(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.creatorsService.searchCreators(query, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get creator by ID' })
  @ApiParam({ name: 'id', description: 'Creator ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Creator retrieved successfully', type: CreatorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Creator not found' })
  async findById(@Param('id') id: string) {
    return this.creatorsService.findById(id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get creator by username' })
  @ApiParam({ name: 'username', description: 'Creator username' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Creator retrieved successfully', type: CreatorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Creator not found' })
  async findByUsername(@Param('username') username: string) {
    return this.creatorsService.findByUsername(username);
  }

  @Get('wallet/:address')
  @ApiOperation({ summary: 'Get creator by wallet address' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Creator retrieved successfully', type: CreatorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Creator not found' })
  async findByWalletAddress(@Param('address') address: string) {
    return this.creatorsService.findByWalletAddress(address);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get creator statistics' })
  @ApiParam({ name: 'id', description: 'Creator ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Creator stats retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Creator not found' })
  async getStats(@Param('id') id: string) {
    return this.creatorsService.getCreatorStats(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update creator profile (authenticated)' })
  @ApiParam({ name: 'id', description: 'Creator ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Creator updated successfully', type: CreatorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Creator not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot update another creator\'s profile' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Username already taken' })
  async update(@Param('id') id: string, @Body() updateCreatorDto: UpdateCreatorDto, @Request() req: any) {
    return this.creatorsService.update(id, updateCreatorDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete/deactivate creator profile (authenticated)' })
  @ApiParam({ name: 'id', description: 'Creator ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Creator deactivated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Creator not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot delete another creator\'s profile' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.creatorsService.delete(id, req.user.userId);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a creator (admin only)' })
  @ApiParam({ name: 'id', description: 'Creator ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Creator verified successfully', type: CreatorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Creator not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin access required' })
  async verify(@Param('id') id: string) {
    return this.creatorsService.verifyCreator(id);
  }
}
