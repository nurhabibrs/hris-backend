import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePositionDto {
  @ApiProperty({ example: 'Software Engineer', description: 'Position name' })
  @IsString()
  name!: string;
}
