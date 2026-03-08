import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AttendancesService } from './attendances.service';
import { UserRole } from '../users/users.entity';
import type { Request } from 'express';
import { JwtPayload as AuthenticatedUser } from '../../interfaces/jwt.interface';
import { FindAllAttendanceDto } from './dto/findAllAttendance.dto';

@UseGuards(JwtAuthGuard)
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Req() req: Request, @Query() query: FindAllAttendanceDto) {
    const user = req.user as AuthenticatedUser;
    if (
      user.role !== (UserRole.ADMIN as string) &&
      query.userId !== user.userId
    ) {
      throw new ForbiddenException(
        'You can only view your own attendance records',
      );
    }
    return this.attendancesService.findAll(query);
  }

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  checkIn(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.attendancesService.checkIn(user.userId);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  checkOut(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.attendancesService.checkOut(user.userId);
  }
}
