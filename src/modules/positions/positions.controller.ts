import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CreatePositionDto } from './dto/position.dto';
import { UserRole } from '../users/users.entity';
import { JwtPayload as AuthenticatedUser } from '../../interfaces/jwt.interface';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() dto: CreatePositionDto, @Req() req: Request) {
    console.log('Received create position request with data:', dto);
    const currentUser = req.user as AuthenticatedUser;

    if (currentUser.role !== (UserRole.ADMIN as string)) {
      throw new ForbiddenException('Only admins can create positions');
    }

    return this.positionsService.create(dto);
  }
}
