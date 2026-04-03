import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from './constants/auth-cookie';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

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

  it('sets the auth cookie and returns only the user on register', async () => {
    authService.register.mockResolvedValue({
      accessToken: 'register-token',
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
        response as any,
      ),
    ).resolves.toEqual({
      user: { id: 'user-1', email: 'new@company.com' },
    });

    expect(response.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'register-token',
      getAuthCookieOptions(),
    );
  });

  it('sets the auth cookie and returns only the user on login', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'login-token',
      user: { id: 'user-1', email: 'new@company.com' },
    });

    await expect(
      controller.login(
        {
          email: 'new@company.com',
          password: 'secret123',
        } as any,
        response as any,
      ),
    ).resolves.toEqual({
      user: { id: 'user-1', email: 'new@company.com' },
    });

    expect(response.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'login-token',
      getAuthCookieOptions(),
    );
  });

  it('clears the auth cookie on logout', () => {
    expect(controller.logout(response as any)).toEqual({
      message: 'Logged out successfully',
    });

    const clearCookieOptions = { ...getAuthCookieOptions() };
    delete clearCookieOptions.maxAge;

    expect(response.clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      clearCookieOptions,
    );
  });
});
