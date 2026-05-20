import { CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'collability_refresh';

export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
