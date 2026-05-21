import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  getRefreshTokenCookieOptions,
} from './constants/auth-cookie';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
    refreshSession: jest.fn(),
    logoutSession: jest.fn(),
    listSessions: jest.fn(),
    logoutOtherSessions: jest.fn(),
    revokeSession: jest.fn(),
  };

  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    process.env.REFRESH_TOKEN_TTL_MS = '604800000';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('sets the refresh cookie and returns the access token and user on register', async () => {
    authService.register.mockResolvedValue({
      accessToken: 'register-access-token',
      refreshToken: 'register-refresh-token',
      user: { id: 'user-1', email: 'new@company.com' },
    });

    await expect(
      controller.register(
        {
          email: 'new@company.com',
          name: 'New User',
          password: 'secret123',
          verificationToken: 'verified-token',
        } as any,
        {
          headers: {
            'user-agent': 'Chrome',
          },
          ip: '127.0.0.1',
        } as any,
        response as any,
      ),
    ).resolves.toEqual({
      accessToken: 'register-access-token',
      user: { id: 'user-1', email: 'new@company.com' },
    });

    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      'register-refresh-token',
      getRefreshTokenCookieOptions(),
    );
  });

  it('sets the refresh cookie and returns the access token and user on login', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'login-access-token',
      refreshToken: 'login-refresh-token',
      user: { id: 'user-1', email: 'new@company.com' },
    });

    await expect(
      controller.login(
        {
          email: 'new@company.com',
          password: 'secret123',
        } as any,
        {
          headers: {
            'user-agent': 'Firefox',
          },
          ip: '203.0.113.10',
        } as any,
        response as any,
      ),
    ).resolves.toEqual({
      accessToken: 'login-access-token',
      user: { id: 'user-1', email: 'new@company.com' },
    });

    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      'login-refresh-token',
      getRefreshTokenCookieOptions(),
    );
  });

  it('rotates the refresh cookie and returns a fresh access token on refresh', async () => {
    authService.refreshSession.mockResolvedValue({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
      user: { id: 'user-1', email: 'new@company.com' },
    });

    await expect(
      controller.refresh(
        {
          cookies: {
            [REFRESH_TOKEN_COOKIE_NAME]: 'current-refresh-token',
          },
          headers: {
            'user-agent': 'Safari',
          },
          ip: '198.51.100.20',
        } as any,
        response as any,
      ),
    ).resolves.toEqual({
      accessToken: 'next-access-token',
      user: { id: 'user-1', email: 'new@company.com' },
    });

    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      'next-refresh-token',
      getRefreshTokenCookieOptions(),
    );
  });

  it('revokes the active session and clears the refresh cookie on logout', async () => {
    authService.logoutSession.mockResolvedValue({
      message: 'Logged out successfully',
    });

    await expect(
      controller.logout(
        {
          cookies: {
            [REFRESH_TOKEN_COOKIE_NAME]: 'current-refresh-token',
          },
        } as any,
        response as any,
      ),
    ).resolves.toEqual({
      message: 'Logged out successfully',
    });

    const clearCookieOptions = { ...getRefreshTokenCookieOptions() };
    delete clearCookieOptions.maxAge;

    expect(authService.logoutSession).toHaveBeenCalledWith('current-refresh-token');
    expect(response.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      clearCookieOptions,
    );
  });

  it('returns active device sessions for the authenticated user', async () => {
    authService.listSessions.mockResolvedValue([
      {
        id: 'session-1',
        isCurrent: true,
      },
    ]);

    await expect(
      controller.getSessions({
        user: {
          id: 'user-1',
        },
      } as any),
    ).resolves.toEqual([
      {
        id: 'session-1',
        isCurrent: true,
      },
    ]);

    expect(authService.listSessions).toHaveBeenCalledWith('user-1', undefined);
  });

  it('logs out all other devices for the authenticated session', async () => {
    authService.logoutOtherSessions.mockResolvedValue({
      message: 'Logged out other devices successfully',
    });

    await expect(
      controller.logoutOtherSessions({
        user: {
          id: 'user-1',
        },
        auth: {
          sessionId: 'session-1',
        },
      } as any),
    ).resolves.toEqual({
      message: 'Logged out other devices successfully',
    });

    expect(authService.logoutOtherSessions).toHaveBeenCalledWith('user-1', 'session-1');
  });

  it('revokes an individual device session for the authenticated user', async () => {
    authService.revokeSession.mockResolvedValue({
      message: 'Device logged out successfully',
    });

    await expect(
      controller.revokeSession(
        'session-2',
        {
          user: {
            id: 'user-1',
          },
        } as any,
      ),
    ).resolves.toEqual({
      message: 'Device logged out successfully',
    });

    expect(authService.revokeSession).toHaveBeenCalledWith('user-1', 'session-2');
  });
});
