import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

interface SupabaseJwtPayload {
    sub: string;
    email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
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

    /**
     * No database access here: the `profiles` row is created by the
     * `on_auth_user_created` trigger when Supabase Auth inserts the user
     * (migration `20261008200000_create_profile_on_signup`).
     */
    validate(payload: SupabaseJwtPayload): AuthenticatedUser {
        return {
            id: payload.sub,
            email: payload.email,
        };
    }
}
