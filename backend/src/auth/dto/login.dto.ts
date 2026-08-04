import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  // No length rule here: password policy is Supabase's (at signup). Enforcing one
  // on login only rejects accounts that Supabase itself already accepts.
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
