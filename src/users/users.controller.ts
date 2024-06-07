import { Controller, Get, Post, Param, Delete, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() createUserDto: any) {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Get(':userId/avatar')
  async getUserAvatar(@Param('userId') userId: string) {
    return this.usersService.getUserAvatar(userId);
  }

  @Delete(':userId/avatar')
  async deleteUserAvatar(@Param('userId') userId: string) {
    return this.usersService.deleteUserAvatar(userId);
  }
}
