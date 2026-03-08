import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { UserRole } from './users.entity';

interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() dto: UserDto, @Req() req: Request) {
    const currentUser = req.user as AuthenticatedUser;

    if (currentUser.role !== (UserRole.ADMIN as string)) {
      throw new ForbiddenException('Only admins can create users');
    }

    return this.usersService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserDto,
    @Req() req: Request,
  ) {
    const currentUser = req.user as AuthenticatedUser;

    const isSelf = currentUser.userId === id;
    const isAdmin = currentUser.role === (UserRole.ADMIN as string);

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.usersService.update(id, dto);
  }
}
