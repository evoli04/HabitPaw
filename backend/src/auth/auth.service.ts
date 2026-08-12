import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  /**
   * User ids whose `profiles` row is known to exist. Lives for the process
   * lifetime; a restart simply re-checks each user once.
   *
   * Bounded by the number of distinct users that authenticate against one
   * process, so it does not need eviction at this scale.
   */
  private readonly knownProfiles = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Makes sure the caller has a `profiles` row. Runs on **every** authenticated
   * request (from `JwtStrategy.validate`), so its cost is paid by every endpoint.
   *
   * Two things keep that cost near zero:
   *
   * 1. **The in-memory set short-circuits repeat callers.** Measured against the
   *    Frankfurt pooler, the round trip this skips was 484 ms — roughly two
   *    thirds of a simple `GET /habits`.
   * 2. **On a miss it is one statement, not two.** `upsert` made Prisma issue a
   *    `SELECT` and then an `INSERT`/`UPDATE`; `createMany` with `skipDuplicates`
   *    compiles to a single `INSERT … ON CONFLICT DO NOTHING`.
   *
   * Behaviour is unchanged: the old `upsert` passed `update: {}`, so an existing
   * profile was never modified either — `name` is only ever set at creation.
   */
  async ensureProfile(userId: string, name?: string): Promise<void> {
    if (this.knownProfiles.has(userId)) return;

    await this.prisma.profile.createMany({
      data: { id: userId, name },
      skipDuplicates: true,
    });

    this.knownProfiles.add(userId);
  }

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
