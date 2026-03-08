import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../users/users.entity';

export class RegisterDto {
  @IsString()
  name!: string;

  @ValidateIf(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (obj) => obj.email !== undefined && obj.email !== null && obj.email !== '',
  )
  @IsEmail()
  @Matches(/@dexa\.co\.id$/, {
    message: 'Email must be a company email (@dexa.co.id)',
  })
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
