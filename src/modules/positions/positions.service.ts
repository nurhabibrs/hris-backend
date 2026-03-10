import { ConflictException, Injectable } from '@nestjs/common';
import { Position } from './positions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePositionDto } from './dto/position.dto';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
  ) {}

  async create(
    dto: CreatePositionDto,
  ): Promise<{ message: string; data: Position }> {
    const existing = await this.positionsRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Position already exists');
    }

    const position = this.positionsRepository.create(dto);
    const saved = await this.positionsRepository.save(position);
    return {
      message: 'Position created successfully',
      data: saved,
    };
  }

  async findAll(): Promise<{ message: string; data: Position[] }> {
    const positions = await this.positionsRepository
      .createQueryBuilder('position')
      .select([
        'position.id',
        'position.name',
        'position.created_at',
        'position.updated_at',
      ])
      .getMany();

    return {
      message: 'Positions retrieved successfully',
      data: positions,
    };
  }
}
