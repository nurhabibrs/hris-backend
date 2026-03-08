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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    dto: CreateUserDto,
  ): Promise<{ message: string; data: Omit<User, 'password'> }> {
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
    const { password, ...result } = saved;
    return {
      message: 'User created successfully',
      data: result,
    };
  }

  async findAll(): Promise<{
    message: string;
    data: Omit<User, 'password'>[];
  }> {
    const users = await this.usersRepository.find({ relations: ['position'] });

    return {
      message: 'Users retrieved successfully',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      data: users.map(({ password, ...result }) => result),
    };
  }

  async findOne(
    id: number,
  ): Promise<{ message: string; data: Omit<User, 'password'> }> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['position'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return {
      message: 'User retrieved successfully',
      data: result,
    };
  }

  async update(
    id: number,
    dto: UpdateUserDto,
  ): Promise<{ message: string; data: Omit<User, 'password'> }> {
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

    const { position_id, ...fields } = dto;

    Object.assign(user, fields);

    if (position_id !== undefined) {
      user.position = { id: position_id } as Position;
    }

    const saved = await this.usersRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = saved;
    return {
      message: 'User updated successfully',
      data: result,
    };
  }
}
