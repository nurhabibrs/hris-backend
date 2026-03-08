import { BadRequestException, Injectable } from '@nestjs/common';
import { Attendance } from './attendances.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';

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
}
