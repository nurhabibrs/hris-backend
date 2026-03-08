import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserRole } from './users.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

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
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() dto: CreateUserDto, @Req() req: Request) {
    const currentUser = req.user as AuthenticatedUser;

    if (currentUser.role !== (UserRole.ADMIN as string)) {
      throw new ForbiddenException('Only admins can create users');
    }

    return this.usersService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('profile_photo', {
      storage: diskStorage({
        destination: './uploads/profile_photo',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `photo-${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const currentUser = req.user as AuthenticatedUser;

    const isSelf = currentUser.userId === id;
    const isAdmin = currentUser.role === (UserRole.ADMIN as string);

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (file) {
      dto.photo_url = `/uploads/profile_photo/${file.filename}`;
    }

    return this.usersService.update(id, dto);
  }
}
