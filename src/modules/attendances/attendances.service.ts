import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Attendance } from './attendances.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import { FindAllAttendanceDto, FindByIdDto } from './dto/findAttendance.dto';

const CHECK_IN_DEADLINE_HOUR = 7;
const CHECK_OUT_EARLIEST_HOUR = 17;
const OFFICE_TIMEZONE = process.env.OFFICE_TIMEZONE!;

@Injectable()
export class AttendancesService {
  private readonly attendanceTimezone: string;

  constructor(
    @InjectRepository(Attendance)
    private attendancesRepository: Repository<Attendance>,
    private readonly configService: ConfigService,
  ) {
    this.attendanceTimezone = this.resolveAttendanceTimezone();
  }

  private resolveAttendanceTimezone(): string {
    const configuredTimezone = this.configService
      .get<string>('OFFICE_TIMEZONE')
      ?.trim();

    if (!configuredTimezone) {
      return OFFICE_TIMEZONE;
    }

    try {
      new Intl.DateTimeFormat('en-US', {
        timeZone: configuredTimezone,
      }).format(new Date());

      return configuredTimezone;
    } catch {
      return OFFICE_TIMEZONE;
    }
  }

  private getZonedDateTimeParts(date: Date): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.attendanceTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      minute: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const values = Object.fromEntries(
      parts
        .filter(({ type }) => type !== 'literal')
        .map(({ type, value }) => [type, value]),
    );

    return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day),
      hour: Number(values.hour),
      minute: Number(values.minute),
    };
  }

  private getAttendanceDateContext(now: Date): {
    attendanceDate: Date;
    attendanceDateString: string;
    hour: number;
  } {
    const { year, month, day, hour } = this.getZonedDateTimeParts(now);
    const attendanceDateString = [year, month, day]
      .map((value, index) =>
        index === 0 ? String(value) : String(value).padStart(2, '0'),
      )
      .join('-');

    return {
      attendanceDate: new Date(attendanceDateString),
      attendanceDateString,
      hour,
    };
  }

  private formatAttendanceDate(date: Date | string): string {
    const attendanceDateString =
      typeof date === 'string' ? date : date.toISOString().slice(0, 10);

    return moment(attendanceDateString, 'YYYY-MM-DD')
      .locale('id')
      .format('DD MMMM YYYY');
  }

  private formatOfficeDateTime(date: Date | string | null): string | null {
    if (!date) {
      return null;
    }

    const normalizedDate = date instanceof Date ? date : new Date(date);
    const { year, month, day, hour, minute } =
      this.getZonedDateTimeParts(normalizedDate);

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  async checkIn(
    userId: number,
  ): Promise<{ message: string; data: Attendance }> {
    const now = new Date();
    const { attendanceDate, hour } = this.getAttendanceDateContext(now);

    const existing = await this.attendancesRepository.findOne({
      where: { user: { id: userId }, attendance_date: attendanceDate },
    });

    if (existing) {
      throw new BadRequestException('You have already checked in today');
    }

    const isLate = hour >= CHECK_IN_DEADLINE_HOUR;

    const attendance = this.attendancesRepository.create({
      user: { id: userId },
      attendance_date: attendanceDate,
      check_in: now,
      is_late: isLate,
    });

    const saved = await this.attendancesRepository.save(attendance);
    const message = isLate
      ? 'Checked in successfully (marked as late)'
      : 'Checked in successfully';

    return { message, data: saved };
  }

  async checkOut(
    userId: number,
  ): Promise<{ message: string; data: Attendance }> {
    const now = new Date();
    const { attendanceDate, hour } = this.getAttendanceDateContext(now);

    if (hour < CHECK_OUT_EARLIEST_HOUR) {
      throw new BadRequestException('Check-out is not allowed before 17:00');
    }

    let attendance = await this.attendancesRepository.findOne({
      where: { user: { id: userId }, attendance_date: attendanceDate },
    });

    if (!attendance) {
      attendance = this.attendancesRepository.create({
        user: { id: userId },
        attendance_date: attendanceDate,
        check_in: now,
        is_late: true,
      });
    }

    if (attendance.check_out) {
      throw new BadRequestException('You have already checked out today');
    }

    attendance.check_out = now;
    const saved = await this.attendancesRepository.save(attendance);

    return { message: 'Checked out successfully', data: saved };
  }

  async findAll(query: FindAllAttendanceDto): Promise<{
    message: string;
    data: (Omit<
      Attendance,
      'user' | 'attendance_date' | 'check_in' | 'check_out'
    > & {
      attendance_date: string;
      check_in: string | null;
      check_out: string | null;
      user: Omit<
        Attendance['user'],
        'password' | 'photo_url' | 'phone_number' | 'role'
      >;
    })[];
    meta: { total: number; page: number; limit: number; total_pages: number };
  }> {
    const { page, limit, userId, startDate, endDate, isLate, order } = query;

    const qb = this.attendancesRepository
      .createQueryBuilder('attendance')
      .select([
        'attendance.id',
        'attendance.attendance_date',
        'attendance.check_in',
        'attendance.check_out',
        'attendance.is_late',
        'user.id',
        'user.name',
        'user.email',
      ])
      .leftJoin('attendance.user', 'user')
      .orderBy('attendance.attendance_date', order === 'desc' ? 'DESC' : 'ASC');

    if (userId) {
      qb.andWhere('user.id = :userId', { userId });
    }

    if (startDate) {
      qb.andWhere('attendance.attendance_date >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('attendance.attendance_date <= :endDate', { endDate });
    }

    if (isLate !== undefined) {
      qb.andWhere('attendance.is_late = :isLate', { isLate });
    }

    const attendances = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const total = await qb.getCount();

    const data = attendances.map((attendance) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, photo_url, phone_number, role, ...user } =
        attendance.user;

      const formattedDate = this.formatAttendanceDate(
        attendance.attendance_date,
      );

      const formattedCheckIn = this.formatOfficeDateTime(attendance.check_in);

      const formattedCheckOut = this.formatOfficeDateTime(attendance.check_out);
      return {
        ...attendance,
        attendance_date: formattedDate,
        check_in: formattedCheckIn,
        check_out: formattedCheckOut,
        user: user,
      };
    });

    return {
      message: 'Attendances retrieved successfully',
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(
    id: number,
    query: FindByIdDto,
  ): Promise<{
    message: string;
    data: (Omit<
      Attendance,
      'user' | 'attendance_date' | 'check_in' | 'check_out'
    > & {
      attendance_date: string;
      check_in: string | null;
      check_out: string | null;
      user: Omit<
        Attendance['user'],
        'password' | 'photo_url' | 'phone_number' | 'role'
      >;
    })[];
    meta: { total: number; page: number; limit: number; total_pages: number };
  }> {
    const { page, limit, startDate, endDate, isLate, order } = query;

    const qb = this.attendancesRepository
      .createQueryBuilder('attendance')
      .select([
        'attendance.id',
        'attendance.attendance_date',
        'attendance.check_in',
        'attendance.check_out',
        'attendance.is_late',
        'user.id',
        'user.name',
        'user.email',
      ])
      .leftJoin('attendance.user', 'user')
      .orderBy('attendance.attendance_date', order === 'desc' ? 'DESC' : 'ASC')
      .where('user.id = :id', { id });

    if (startDate) {
      qb.andWhere('attendance.attendance_date >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('attendance.attendance_date <= :endDate', { endDate });
    }

    if (isLate !== undefined) {
      qb.andWhere('attendance.is_late = :isLate', { isLate });
    }

    const attendances = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const total = await qb.getCount();

    const data = attendances.map((attendance) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, photo_url, phone_number, role, ...user } =
        attendance.user;

      const formattedDate = this.formatAttendanceDate(
        attendance.attendance_date,
      );
      const formattedCheckIn = this.formatOfficeDateTime(attendance.check_in);

      const formattedCheckOut = this.formatOfficeDateTime(attendance.check_out);
      return {
        ...attendance,
        attendance_date: formattedDate,
        check_in: formattedCheckIn,
        check_out: formattedCheckOut,
        user: user,
      };
    });

    return {
      message: 'Attendances retrieved successfully',
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}
