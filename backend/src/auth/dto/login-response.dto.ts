import { ApiProperty } from '@nestjs/swagger';

class LoginResponseUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Paste this into the Swagger Authorize dialog' })
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty({ description: 'Seconds until access_token expires' })
  expires_in: number;

  @ApiProperty()
  token_type: string;

  @ApiProperty({ type: LoginResponseUserDto })
  user: LoginResponseUserDto;
}
