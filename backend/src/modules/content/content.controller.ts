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
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentResponseDto } from './dto/content-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new content (authenticated, creator only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Content created successfully', type: ContentResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Must be a creator to publish content' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid IPFS CID' })
  async create(@Body() createContentDto: CreateContentDto, @Request() req: any) {
    return this.contentService.create(createContentDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all content (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'creatorId', required: false, type: String, description: 'Filter by creator ID' })
  @ApiQuery({ name: 'contentType', required: false, type: String, description: 'Filter by content type' })
  @ApiQuery({ name: 'visibility', required: false, type: String, description: 'Filter by visibility' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Content retrieved successfully', type: [ContentResponseDto] })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('creatorId') creatorId?: string,
    @Query('contentType') contentType?: string,
    @Query('visibility') visibility?: string,
  ) {
    return this.contentService.findAll(page, limit, creatorId, contentType, visibility);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search content by title, description, or tags' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results retrieved successfully', type: [ContentResponseDto] })
  async search(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.contentService.searchContent(query, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Content retrieved successfully', type: ContentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Content not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'No access to this content' })
  async findById(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId;
    return this.contentService.findById(id, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update content (authenticated, creator only)' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Content updated successfully', type: ContentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Content not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot update another creator\'s content' })
  async update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto, @Request() req: any) {
    return this.contentService.update(id, updateContentDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete content (authenticated, creator only)' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Content deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Content not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot delete another creator\'s content' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.contentService.delete(id, req.user.userId);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like content (authenticated)' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Content liked successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Content not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Likes disabled for this content' })
  async like(@Param('id') id: string, @Request() req: any) {
    return this.contentService.likeContent(id, req.user.userId);
  }
}
