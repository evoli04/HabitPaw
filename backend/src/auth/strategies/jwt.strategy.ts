import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwksClient } from 'jwks-rsa';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

interface SupabaseJwtPayload {
    sub: string;
    email: string;
}

/** `kid` from the JWT header, or undefined if the token is not a parsable JWT. */
function readKid(rawJwtToken: string): string | undefined {
    try {
        const header = JSON.parse(
            Buffer.from(rawJwtToken.split('.')[0], 'base64url').toString('utf8'),
        ) as { kid?: unknown };
        return typeof header.kid === 'string' ? header.kid : undefined;
    } catch {
        return undefined;
    }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) implements OnModuleInit {
    private readonly logger = new Logger(JwtStrategy.name);
    private readonly jwks: JwksClient;

    constructor() {
        // Own JwksClient instead of jwks-rsa's passportJwtSecret(): that helper
        // creates its client internally, so its key cache cannot be warmed at
        // startup and the first authenticated request paid the JWKS fetch.
        const jwks = new JwksClient({
            jwksUri: `${process.env.SUPABASE_JWKS_URL}`,
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
        });

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            algorithms: ['ES256'],
            secretOrKeyProvider: (_request, rawJwtToken: string, done) => {
                const kid = readKid(rawJwtToken);
                if (!kid) return done(null, undefined);
                jwks
                    .getSigningKey(kid)
                    .then((key) => done(null, key.getPublicKey()))
                    .catch((error: Error) =>
                        // Unknown kid → no key → 401, same as passportJwtSecret.
                        error.name === 'SigningKeyNotFoundError'
                            ? done(null, undefined)
                            : done(error, undefined),
                    );
            },
        });
        this.jwks = jwks;
    }

    /**
     * Fetches and caches the signing keys before the first request. Failure
     * is not fatal: the first authenticated request just fetches them itself.
     */
    async onModuleInit() {
        const start = Date.now();
        try {
            const keys = await this.jwks.getSigningKeys();
            await Promise.all(keys.map((key) => this.jwks.getSigningKey(key.kid)));
            this.logger.log(`JWKS warmed: ${keys.length} key(s) in ${Date.now() - start}ms`);
        } catch (error) {
            this.logger.warn(
                `JWKS warm-up failed, keys will be fetched on first request: ${(error as Error).message}`,
            );
        }
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
