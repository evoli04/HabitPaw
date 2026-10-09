import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Dev/testing convenience only — proxies Supabase's password-grant Auth API so a
   * developer can obtain a bearer token from inside Swagger. Production clients should
   * authenticate directly against Supabase (e.g. via the Supabase client SDK).
   */
  async login({ email, password }: LoginDto): Promise<LoginResponseDto> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const apiKey = this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');

    const response = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: `${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      },
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Supabase credentials');
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
      user: { id: string; email: string };
    };

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      user: { id: data.user.id, email: data.user.email },
    };
  }
}
