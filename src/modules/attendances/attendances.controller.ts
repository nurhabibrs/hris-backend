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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AttendancesService } from './attendances.service';
import { UserRole } from '../users/users.entity';
import type { Request } from 'express';
import { JwtPayload as AuthenticatedUser } from '../../interfaces/jwt.interface';
import { FindAllAttendanceDto, FindByIdDto } from './dto/findAttendance.dto';

@ApiTags('Attendances')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all attendances (admin only)' })
  @ApiResponse({ status: 200, description: 'List of attendance records' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – admin only' })
  findAll(@Req() req: Request, @Query() query: FindAllAttendanceDto) {
    const user = req.user as AuthenticatedUser;
    if (user.role !== (UserRole.ADMIN as string)) {
      throw new ForbiddenException('Only admins can view all attendances');
    }
    return this.attendancesService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get attendance records for a specific user' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Attendance records for the user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – can only view own records',
  })
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
  @ApiOperation({ summary: 'Check in for the current day' })
  @ApiResponse({ status: 200, description: 'Check-in recorded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Already checked in today' })
  checkIn(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.attendancesService.checkIn(user.userId);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check out for the current day' })
  @ApiResponse({ status: 200, description: 'Check-out recorded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Not checked in yet' })
  checkOut(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.attendancesService.checkOut(user.userId);
  }
}
