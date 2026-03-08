import { IsEmail, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @Matches(/@company\.co\.id$/, {
    message: 'Email must be a company email (@company.co.id)',
  })
  email!: string;

  @IsString()
  password!: string;
}
