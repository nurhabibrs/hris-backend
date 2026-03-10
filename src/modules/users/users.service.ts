import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './users.entity';
import { Position } from '../positions/positions.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { FindAllUserDto } from './dto/findUser.dto';
import { NotificationGateway } from '../notifications/notifications.gateway';
import { JwtPayload as AuthenticatedUser } from '../../interfaces/jwt.interface';
import { LoggingProducer } from '../rabbitmq/logging.producer';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationGateway: NotificationGateway,
    private loggingProducer: LoggingProducer,
  ) {}

  async create(dto: CreateUserDto): Promise<{
    message: string;
    data: Omit<User, 'password' | 'photo_url'> & { photo_url: string | null };
  }> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const { position_id, ...fields } = dto;

    if (fields.password) {
      fields.password = await bcrypt.hash(fields.password, 10);
    }

    const user = this.usersRepository.create(fields);

    if (position_id) {
      user.position = { id: position_id } as Position;
    }

    const saved = await this.usersRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, photo_url, ...result } = saved;
    const formattedPhotoUrl = photo_url
      ? process.env.PATH_URL! + photo_url
      : null;
    return {
      message: 'User created successfully',
      data: { ...result, photo_url: formattedPhotoUrl },
    };
  }

  async findAll(query: FindAllUserDto): Promise<{
    message: string;
    data: (Omit<User, 'password' | 'photo_url'> & {
      photo_url: string | null;
    })[];
    meta: { total: number; page: number; limit: number; total_pages: number };
  }> {
    const { name, page, limit, order, role } = query;

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.phone_number',
        'user.photo_url',
        'user.created_at',
        'position.id',
        'position.name',
      ])
      .leftJoin('user.position', 'position')
      .orderBy('user.created_at', order === 'desc' ? 'DESC' : 'ASC');

    if (name) {
      qb.andWhere('user.name ILIKE :name', { name: `${name}%` });
    }

    if (role) {
      qb.andWhere('user.role = :role', { role });
    }

    const users = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const total = await qb.getCount();

    return {
      message: 'Users retrieved successfully',
      data: users.map((user) => {
        const { photo_url, ...result } = user;
        const formattedPhotoUrl = photo_url
          ? process.env.PATH_URL! + photo_url
          : null;
        return { ...result, photo_url: formattedPhotoUrl };
      }),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<{
    message: string;
    data: Omit<User, 'password' | 'photo_url'> & { photo_url: string | null };
  }> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['position'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, photo_url, ...result } = user;
    const formattedPhotoUrl = photo_url
      ? process.env.PATH_URL! + photo_url
      : null;
    return {
      message: 'User retrieved successfully',
      data: { ...result, photo_url: formattedPhotoUrl },
    };
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    authUser: AuthenticatedUser,
  ): Promise<{
    message: string;
    data:
      | (Omit<User, 'password' | 'photo_url'> & { photo_url: string | null })
      | null;
  }> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['position'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, dto);

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.position_id) {
      user.position = { id: dto.position_id } as Position;
    }

    const saved = await this.usersRepository.save(user);

    const updatedUser = await this.usersRepository.findOne({
      where: { id: saved.id },
      relations: ['position'],
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, photo_url, ...result } = updatedUser;
    const formattedPhotoUrl = photo_url
      ? process.env.PATH_URL! + photo_url
      : null;

    this.notificationGateway.sendAdminNotification(
      `${authUser.name} updated profile`,
    );

    const userId = authUser.userId;

    this.loggingProducer.log({
      action: 'UPDATE_PROFILE',
      userId: userId,
      timestamp: new Date(),
    });

    return {
      message: 'User updated successfully',
      data: { ...result, photo_url: formattedPhotoUrl },
    };
  }
}
