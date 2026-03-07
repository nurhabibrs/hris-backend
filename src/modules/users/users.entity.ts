import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Position } from '../positions/positions.entity';
import { Attendance } from '../attendances/attendances.entity';
import { Notification } from '../notifications/notifications.entity';

export enum UserRole {
  EMPLOYEE = 'employee',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ comment: 'nama karyawan' })
  name!: string;

  @Column({ unique: true, comment: 'email karyawan' })
  email!: string;

  @Column({ comment: 'password hash' })
  password!: string;

  @Column({
    name: 'phone_number',
    nullable: true,
    comment: 'nomor telepon karyawan',
  })
  phone_number!: string;

  @Column({ name: 'photo_url', nullable: true, comment: 'URL foto karyawan' })
  photo_url!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
    comment: 'role karyawan',
  })
  role!: UserRole;

  @ManyToOne(() => Position, (position) => position.users)
  @JoinColumn({ name: 'position_id' })
  position!: Position;

  @OneToMany(() => Attendance, (attendance) => attendance.user)
  attendances!: Attendance[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;
}
