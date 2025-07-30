import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    refreshTokens: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
      tenantId: 'tenant-123',
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 1800,
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'DIRECTOR_COMUNICACION',
      tenantId: 'tenant-123',
    };

    it('should login successfully', async () => {
      mockAuthService.login.mockResolvedValue(mockTokens);
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        loginDto.tenantId,
      );
      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        loginDto.tenantId,
      );
      expect(result).toEqual({
        message: 'Login successful',
        data: mockTokens,
        user: mockUser,
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        loginDto.tenantId,
      );
    });
  });

  describe('refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockNewTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 1800,
    };

    it('should refresh tokens successfully', async () => {
      mockAuthService.refreshTokens.mockResolvedValue(mockNewTokens);

      const result = await controller.refresh(refreshTokenDto);

      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(result).toEqual({
        message: 'Token refreshed successfully',
        data: mockNewTokens,
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockAuthService.refreshTokens.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });
  });

});