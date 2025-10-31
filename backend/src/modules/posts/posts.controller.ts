import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PostResponseDto } from './dto/post-response.dto';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Post created successfully', type: PostResponseDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async create(@Request() req: any, @Body() createPostDto: CreatePostDto) {
    try {
      return await this.postsService.create(req.user.id, createPostDto);
    } catch (error: any) {
      console.error('Error in create post controller:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts (public feed)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Posts retrieved successfully' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    try {
      return await this.postsService.findAll(page, limit);
    } catch (error: any) {
      console.error('Error in findAll controller:', error);
      // Return empty result instead of 500 error
      return {
        posts: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get posts by user ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'User posts retrieved successfully' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async findByUser(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    try {
      return await this.postsService.findByUser(userId, page, limit);
    } catch (error: any) {
      // Return empty result instead of 500 error
      return {
        posts: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }

  @Get('community/:community')
  @ApiOperation({ summary: 'Get posts by community' })
  @ApiParam({ name: 'community', type: String, description: 'Community name' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Community posts retrieved successfully' })
  async findByCommunity(
    @Param('community') community: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.findByCommunity(community, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Post ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post retrieved successfully', type: PostResponseDto })
  async findById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', type: String, description: 'Post ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post updated successfully', type: PostResponseDto })
  async update(@Param('id') id: string, @Request() req: any, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, req.user.id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', type: String, description: 'Post ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post deleted successfully' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.postsService.delete(id, req.user.id);
  }

  @Post(':id/upvote')
  @ApiOperation({ summary: 'Upvote a post' })
  @ApiParam({ name: 'id', type: String, description: 'Post ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post upvoted successfully', type: PostResponseDto })
  async upvote(@Param('id') id: string) {
    return this.postsService.incrementUpvote(id);
  }

  @Post(':id/downvote')
  @ApiOperation({ summary: 'Downvote a post' })
  @ApiParam({ name: 'id', type: String, description: 'Post ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post downvoted successfully', type: PostResponseDto })
  async downvote(@Param('id') id: string) {
    return this.postsService.incrementDownvote(id);
  }

  // ============================================================================
  // LIKES
  // ============================================================================

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on a post' })
  @ApiParam({ name: 'id', type: String, description: 'Post ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Like toggled successfully' })
  async toggleLike(@Param('id') id: string, @Request() req: any) {
    return this.postsService.toggleLike(id, req.user.id);
  }

  @Get(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get like status for a post' })
  @ApiParam({ name: 'id', type: String, description: 'Post ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Like status retrieved successfully' })
  async getLikeStatus(@Param('id') id: string, @Request() req: any) {
    return this.postsService.getLikeStatus(id, req.user.id);
  }

  @Get('user/liked-posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all posts liked by current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liked posts retrieved successfully' })
  async getUserLikedPosts(@Request() req: any) {
    return this.postsService.getUserLikedPosts(req.user.id);
  }
}

