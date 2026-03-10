import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../users.entity';
import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'john@company.co.id',
    description: 'Company email address',
  })
  @ValidateIf(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (obj) => obj.email !== undefined && obj.email !== null && obj.email !== '',
  )
  @IsEmail()
  @Matches(/@company\.co\.id$/, {
    message: 'Email must be a company email (@company.co.id)',
  })
  email!: string;

  @ApiPropertyOptional({ example: 'password123', description: 'User password' })
  @IsOptional()
  @MinLength(8)
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    example: '+628123456789',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/photo.jpg',
    description: 'Profile photo URL',
  })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.EMPLOYEE,
    description: 'User role',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 1, description: 'Position ID' })
  @IsOptional()
  @IsNumber()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  position_id?: number;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
