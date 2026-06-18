import { CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'collability_refresh';

export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = process.env.REFRESH_TOKEN_TTL_MS;
  const cookieDomain = process.env.REFRESH_TOKEN_COOKIE_DOMAIN;

  if (!maxAge) {
    throw new Error('REFRESH_TOKEN_TTL_MS must be set');
  }

  const options: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: Number(maxAge),
  };

  if (cookieDomain) {
    options.domain = cookieDomain;
  }

  return options;
}
