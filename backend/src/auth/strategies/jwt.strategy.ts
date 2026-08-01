import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

interface SupabaseJwtPayload {
    sub: string;
    email: string;
    user_metadata?: { name?: string };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            algorithms: ['ES256'],
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${process.env.SUPABASE_JWKS_URL}`,
            }),
        });
    }

    async validate(payload: SupabaseJwtPayload): Promise<AuthenticatedUser> {
        await this.authService.ensureProfile(payload.sub, payload.user_metadata?.name);
        return {
            id: payload.sub,
            email: payload.email,
        };
    }
}