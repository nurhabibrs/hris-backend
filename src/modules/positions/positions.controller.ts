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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CreatePositionDto } from './dto/position.dto';
import { UserRole } from '../users/users.entity';
import { JwtPayload as AuthenticatedUser } from '../../interfaces/jwt.interface';
import type { Request } from 'express';

@ApiTags('Positions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new position (admin only)' })
  @ApiResponse({ status: 201, description: 'Position created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – admin only' })
  create(@Body() dto: CreatePositionDto, @Req() req: Request) {
    const currentUser = req.user as AuthenticatedUser;

    if (currentUser.role !== (UserRole.ADMIN as string)) {
      throw new ForbiddenException('Only admins can create positions');
    }

    return this.positionsService.create(dto);
  }
}
