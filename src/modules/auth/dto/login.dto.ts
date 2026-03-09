import { IsEmail, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'employee@company.co.id',
    description: 'Company email address',
  })
  @IsEmail()
  @Matches(/@company\.co\.id$/, {
    message: 'Email must be a company email (@company.co.id)',
  })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  password!: string;
}
