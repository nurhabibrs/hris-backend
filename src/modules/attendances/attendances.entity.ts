import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity('attendance')
@Unique(['user', 'attendance_date'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.attendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    name: 'attendance_date',
    type: 'date',
    comment: 'tanggal presensi',
  })
  attendance_date!: Date;

  @Column({
    name: 'check_in',
    type: 'timestamptz',
    nullable: true,
    comment: 'waktu kehadiran',
  })
  check_in!: Date;

  @Column({
    name: 'check_out',
    type: 'timestamptz',
    nullable: true,
    comment: 'waktu pulang',
  })
  check_out!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;
}
