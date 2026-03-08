import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { FindAllAttendanceDto, FindByIdDto } from './dto/findAttendance.dto';

@UseGuards(JwtAuthGuard)
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Req() req: Request, @Query() query: FindAllAttendanceDto) {
    const user = req.user as AuthenticatedUser;
    if (user.role !== (UserRole.ADMIN as string)) {
      throw new ForbiddenException('Only admins can view all attendances');
    }
    return this.attendancesService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findByUserId(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Query() query: FindByIdDto,
  ) {
    const user = req.user as AuthenticatedUser;
    if (user.userId !== id) {
      throw new ForbiddenException(
        'Users can only view their own attendance records',
      );
    }
    return this.attendancesService.findById(id, query);
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
