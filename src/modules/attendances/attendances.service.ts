import { BadRequestException, Injectable } from '@nestjs/common';
import { Attendance } from './attendances.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import { FindAllAttendanceDto, FindByIdDto } from './dto/findAttendance.dto';

const CHECK_IN_DEADLINE_HOUR = 7;
const CHECK_OUT_EARLIEST_HOUR = 17;

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(Attendance)
    private attendancesRepository: Repository<Attendance>,
  ) {}

  async checkIn(
    userId: number,
  ): Promise<{ message: string; data: Attendance }> {
    const now = new Date();
    const todayStr = moment(now).format('YYYY-MM-DD');

    const existing = await this.attendancesRepository.findOne({
      where: { user: { id: userId }, attendance_date: new Date(todayStr) },
    });

    if (existing) {
      throw new BadRequestException('You have already checked in today');
    }

    const isLate = now.getHours() >= CHECK_IN_DEADLINE_HOUR;

    const attendance = this.attendancesRepository.create({
      user: { id: userId },
      attendance_date: new Date(todayStr),
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

    if (now.getHours() < CHECK_OUT_EARLIEST_HOUR) {
      throw new BadRequestException('Check-out is not allowed before 17:00');
    }

    const todayStr = moment(now).format('YYYY-MM-DD');
    let attendance = await this.attendancesRepository.findOne({
      where: { user: { id: userId }, attendance_date: new Date(todayStr) },
    });

    if (!attendance) {
      attendance = this.attendancesRepository.create({
        user: { id: userId },
        attendance_date: new Date(todayStr),
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
    data: (Omit<Attendance, 'user'> & {
      user: Omit<
        Attendance['user'],
        'password' | 'photo_url' | 'phone_number' | 'role'
      >;
    })[];
    meta: { total: number; page: number; limit: number; totalPages: number };
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

    return {
      message: 'Attendances retrieved successfully',
      data: attendances,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(
    id: number,
    query: FindByIdDto,
  ): Promise<{
    message: string;
    data: (Omit<Attendance, 'user'> & {
      user: Omit<
        Attendance['user'],
        'password' | 'photo_url' | 'phone_number' | 'role'
      >;
    })[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page, limit, startDate, endDate, isLate } = query;

    const qb = this.attendancesRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .orderBy('attendance.attendance_date', 'DESC')
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

    const [attendances, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = attendances.map((attendance) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, photo_url, phone_number, role, ...user } =
        attendance.user;
      return { ...attendance, user: user };
    });

    return {
      message: 'Attendances retrieved successfully',
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
