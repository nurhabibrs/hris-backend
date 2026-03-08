import {
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AttendancesService } from './attendances.service';
import { UserRole } from '../users/users.entity';
import type { Request } from 'express';
import { JwtPayload as AuthenticatedUser } from '../../interfaces/jwt.interface';

@UseGuards(JwtAuthGuard)
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  checkIn(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    if (user.role !== (UserRole.EMPLOYEE as string)) {
      throw new ForbiddenException('Only employees can perform this action');
    }
    return this.attendancesService.checkIn(user.userId);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  checkOut(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    if (user.role !== (UserRole.EMPLOYEE as string)) {
      throw new ForbiddenException('Only employees can perform this action');
    }
    return this.attendancesService.checkOut(user.userId);
  }
}
