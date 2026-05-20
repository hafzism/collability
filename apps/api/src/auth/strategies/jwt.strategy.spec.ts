import { JwtStrategy } from './jwt.strategy';

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

  it('extracts the access token from the authorization bearer header', () => {
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

  it('does not authenticate API requests from the refresh cookie', () => {
    const strategy = new JwtStrategy(configService as any, usersService as any);
    const extractor = (strategy as any)._jwtFromRequest as (request: unknown) => string | null;

    expect(
      extractor({
        cookies: {
          collability_refresh: 'refresh-cookie-token',
        },
        headers: {},
      }),
    ).toBeNull();
  });
});
