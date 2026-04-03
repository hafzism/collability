import { JwtStrategy } from './jwt.strategy';
import { AUTH_COOKIE_NAME } from '../constants/auth-cookie';

describe('JwtStrategy', () => {
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'test-secret';
      }

      return undefined;
    }),
  };

  const usersService = {
    findById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extracts the JWT from the auth cookie first', () => {
    const strategy = new JwtStrategy(configService as any, usersService as any);
    const extractor = (strategy as any)._jwtFromRequest as (request: unknown) => string | null;

    expect(
      extractor({
        cookies: {
          [AUTH_COOKIE_NAME]: 'cookie-token',
        },
        headers: {
          authorization: 'Bearer header-token',
        },
      }),
    ).toBe('cookie-token');
  });

  it('falls back to the bearer token when no auth cookie is present', () => {
    const strategy = new JwtStrategy(configService as any, usersService as any);
    const extractor = (strategy as any)._jwtFromRequest as (request: unknown) => string | null;

    expect(
      extractor({
        headers: {
          authorization: 'Bearer header-token',
        },
      }),
    ).toBe('header-token');
  });
});
