import {
  Controller,
  Get,
  Put,
  Delete,
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
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrieved successfully', type: [UserResponseDto] })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.findAll(page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by username, display name, or bio' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results retrieved successfully', type: [UserResponseDto] })
  async search(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.searchUsers(query, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully', type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  @ApiParam({ name: 'username', description: 'Username' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully', type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Get('wallet/:address')
  @ApiOperation({ summary: 'Get user by wallet address' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully', type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findByWalletAddress(@Param('address') address: string) {
    return this.usersService.findByWalletAddress(address);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile (authenticated)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot update another user\'s profile' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Username already taken' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    return this.usersService.update(id, req.user.id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user account (authenticated)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot delete another user\'s account' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.usersService.delete(id, req.user.id);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers (paginated)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Followers retrieved successfully', type: [UserResponseDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getFollowers(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    try {
      return await this.usersService.getFollowers(id, page, limit);
    } catch (error: any) {
      console.error('Error in getFollowers controller:', error);
      // Return empty result instead of 500 error
      return {
        users: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users that this user follows (paginated)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Following retrieved successfully', type: [UserResponseDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getFollowing(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    try {
      return await this.usersService.getFollowing(id, page, limit);
    } catch (error: any) {
      console.error('Error in getFollowing controller:', error);
      // Return empty result instead of 500 error
      return {
        users: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user (authenticated)' })
  @ApiParam({ name: 'id', description: 'User ID to follow' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User followed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot follow yourself or already following' })
  async followUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.followUser(req.user.id, id);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user (authenticated)' })
  @ApiParam({ name: 'id', description: 'User ID to unfollow' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User unfollowed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async unfollowUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.unfollowUser(req.user.id, id);
  }

  @Get(':id/is-following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user is following another user' })
  @ApiParam({ name: 'id', description: 'User ID to check' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Following status retrieved' })
  async isFollowing(@Param('id') id: string, @Request() req: any) {
    const isFollowing = await this.usersService.isFollowing(req.user.id, id);
    return { isFollowing };
  }
}
