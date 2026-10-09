import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('RequestTiming');

/**
 * Logs total wall-clock time per request. Registered as Express middleware (not a
 * Nest interceptor) on purpose: interceptors run *after* guards, so they would miss
 * the time spent in JwtAuthGuard / JwtStrategy.validate().
 */
export function requestTimingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`,
    );
  });
  next();
}
