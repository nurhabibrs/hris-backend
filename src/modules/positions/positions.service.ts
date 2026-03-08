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
}
