import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../users.entity';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
  @IsString()
  name!: string;

  @ValidateIf(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (obj) => obj.email !== undefined && obj.email !== null && obj.email !== '',
  )
  @IsEmail()
  @Matches(/@company\.co\.id$/, {
    message: 'Email must be a company email (@company.co.id)',
  })
  email!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsNumber()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  position_id?: number;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
