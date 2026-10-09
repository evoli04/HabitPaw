import * as Joi from "joi";

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid("production", "development", "test").required(),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    DIRECT_URL: Joi.string().required(),
    SUPABASE_URL: Joi.string().required(),
    SUPABASE_JWKS_URL: Joi.string().required(),
    SUPABASE_PUBLISHABLE_KEY: Joi.string().required(),
    GEMINI_API_KEY: Joi.string().required(),
    GEMINI_MODEL: Joi.string().required(),
    AI_THROTTLE_LIMIT: Joi.number().default(5),
    AI_THROTTLE_TTL_MS: Joi.number().default(3600000),
    CORS_ORIGIN: Joi.string().default("*"),
    SWAGGER_ENABLED: Joi.bool().default(true),
    PERF_LOG: Joi.bool().default(false),
})