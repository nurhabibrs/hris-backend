import { IsEmail, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @Matches(/@dexa\.co\.id$/, {
    message: 'Email must be a company email (@dexa.co.id)',
  })
  email!: string;

  @IsString()
  password!: string;
}
