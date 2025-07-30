import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

// Mock bcrypt module
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedBcrypt = jest.mocked(require('bcryptjs'));

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'DIRECTOR',
    tenantId: 'tenant-123',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'hashedPassword123',
  };

  beforeEach(async () => {
    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockPrismaService = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockAuditService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with correct salt rounds', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      const configServiceMock = { get: jest.fn().mockReturnValue(12) };
      (service as any).configService = configServiceMock;
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await service.hashPassword(password);

      expect(configServiceMock.get).toHaveBeenCalledWith('BCRYPT_SALT_ROUNDS', 12);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('comparePasswords', () => {
    it('should compare passwords correctly', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await service.comparePasswords(plainPassword, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const plainPassword = 'wrongPassword';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await service.comparePasswords(plainPassword, hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'DIRECTOR',
      };

      const configServiceMock = {
        get: jest
          .fn()
          .mockReturnValueOnce('30m') // JWT_EXPIRES_IN
          .mockReturnValueOnce('7d') // JWT_REFRESH_EXPIRES_IN
          .mockReturnValueOnce('refresh-secret'), // JWT_REFRESH_SECRET
      };
      const jwtServiceMock = {
        sign: jest.fn().mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token'),
      };
      (service as any).configService = configServiceMock;
      (service as any).jwtService = jwtServiceMock;

      const result = service.generateTokenPair(payload);

      expect(jwtServiceMock.sign).toHaveBeenCalledWith(payload, { expiresIn: '30m' });
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(payload, {
        secret: 'refresh-secret',
        expiresIn: '7d',
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 1800, // 30 minutes in seconds
      });
    });

    it('should throw error if refresh secret is missing', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'DIRECTOR',
      };

      const configServiceMock = {
        get: jest
          .fn()
          .mockReturnValueOnce('30m')
          .mockReturnValueOnce('7d')
          .mockReturnValueOnce(undefined), // No refresh secret
      };
      (service as any).configService = configServiceMock;

      expect(() => service.generateTokenPair(payload)).toThrow('JWT_REFRESH_SECRET is required');
    });
  });

  describe('validateUser', () => {
    it('should validate user successfully', async () => {
      const email = 'test@example.com';
      const password = 'testPassword123';
      const tenantId = 'tenant-123';

      const prismaServiceMock = {
        user: {
          findFirst: jest.fn().mockResolvedValue(mockUser),
        },
      };
      (service as any).prismaService = prismaServiceMock;
      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await service.validateUser(email, password, tenantId);

      expect(prismaServiceMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email,
          tenantId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          tenantId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          password: true,
        },
      });

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
        status: mockUser.status,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const prismaServiceMock = {
        user: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      (service as any).prismaService = prismaServiceMock;

      await expect(
        service.validateUser('test@example.com', 'password', 'tenant-123'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const prismaServiceMock = {
        user: {
          findFirst: jest.fn().mockResolvedValue(mockUser),
        },
      };
      (service as any).prismaService = prismaServiceMock;
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongPassword', 'tenant-123'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if user has no password', async () => {
      const userWithoutPassword = { ...mockUser, password: '' };
      const prismaServiceMock = {
        user: {
          findFirst: jest.fn().mockResolvedValue(userWithoutPassword),
        },
      };
      (service as any).prismaService = prismaServiceMock;

      await expect(
        service.validateUser('test@example.com', 'password', 'tenant-123'),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const email = 'test@example.com';
      const password = 'testPassword123';
      const tenantId = 'tenant-123';

      const prismaServiceMock = {
        user: {
          findFirst: jest.fn().mockResolvedValue(mockUser),
        },
      };
      const configServiceMock = {
        get: jest
          .fn()
          .mockReturnValueOnce('30m')
          .mockReturnValueOnce('7d')
          .mockReturnValueOnce('refresh-secret'),
      };
      const jwtServiceMock = {
        sign: jest.fn().mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token'),
      };
      (service as any).prismaService = prismaServiceMock;
      (service as any).configService = configServiceMock;
      (service as any).jwtService = jwtServiceMock;
      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await service.login(email, password, tenantId);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 1800,
      });
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', () => {
      const token = 'valid-token';
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'DIRECTOR',
      };

      const jwtServiceMock = {
        verify: jest.fn().mockReturnValue(payload),
      };
      (service as any).jwtService = jwtServiceMock;

      const result = service.validateToken(token);

      expect(jwtServiceMock.verify).toHaveBeenCalledWith(token);
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException for invalid token', () => {
      const token = 'invalid-token';

      const jwtServiceMock = {
        verify: jest.fn().mockImplementation(() => {
          throw new Error('Invalid token');
        }),
      };
      (service as any).jwtService = jwtServiceMock;

      expect(() => service.validateToken(token)).toThrow('Invalid or expired token');
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate refresh token successfully', () => {
      const refreshToken = 'valid-refresh-token';
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'DIRECTOR',
      };

      const configServiceMock = {
        get: jest.fn().mockReturnValue('refresh-secret'),
      };
      const jwtServiceMock = {
        verify: jest.fn().mockReturnValue(payload),
      };
      (service as any).configService = configServiceMock;
      (service as any).jwtService = jwtServiceMock;

      const result = service.validateRefreshToken(refreshToken);

      expect(jwtServiceMock.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh-secret',
      });
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException if refresh secret is missing', () => {
      const configServiceMock = {
        get: jest.fn().mockReturnValue(undefined),
      };
      (service as any).configService = configServiceMock;

      expect(() => service.validateRefreshToken('token')).toThrow(
        'JWT_REFRESH_SECRET is not configured',
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'DIRECTOR',
      };

      const configServiceMock = {
        get: jest
          .fn()
          .mockReturnValueOnce('refresh-secret') // for validateRefreshToken
          .mockReturnValueOnce('30m') // for generateTokenPair
          .mockReturnValueOnce('7d')
          .mockReturnValueOnce('refresh-secret'),
      };
      const jwtServiceMock = {
        verify: jest.fn().mockReturnValue(payload),
        sign: jest
          .fn()
          .mockReturnValueOnce('new-access-token')
          .mockReturnValueOnce('new-refresh-token'),
      };
      const prismaServiceMock = {
        user: {
          findUnique: jest.fn().mockResolvedValue(mockUser),
        },
      };
      (service as any).configService = configServiceMock;
      (service as any).jwtService = jwtServiceMock;
      (service as any).prismaService = prismaServiceMock;

      const result = await service.refreshTokens(refreshToken);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 1800,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'DIRECTOR',
      };

      const configServiceMock = {
        get: jest.fn().mockReturnValue('refresh-secret'),
      };
      const jwtServiceMock = {
        verify: jest.fn().mockReturnValue(payload),
      };
      const prismaServiceMock = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      (service as any).configService = configServiceMock;
      (service as any).jwtService = jwtServiceMock;
      (service as any).prismaService = prismaServiceMock;

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        'User not found or inactive',
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'DIRECTOR',
      };
      const inactiveUser = { ...mockUser, status: 'INACTIVE' };

      const configServiceMock = {
        get: jest.fn().mockReturnValue('refresh-secret'),
      };
      const jwtServiceMock = {
        verify: jest.fn().mockReturnValue(payload),
      };
      const prismaServiceMock = {
        user: {
          findUnique: jest.fn().mockResolvedValue(inactiveUser),
        },
      };
      (service as any).configService = configServiceMock;
      (service as any).jwtService = jwtServiceMock;
      (service as any).prismaService = prismaServiceMock;

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        'User not found or inactive',
      );
    });
  });

  describe('parseExpirationTime', () => {
    it('should parse seconds correctly', () => {
      const result = (
        service as unknown as { parseExpirationTime: (time: string) => number }
      ).parseExpirationTime('30s');
      expect(result).toBe(30);
    });

    it('should parse minutes correctly', () => {
      const result = (
        service as unknown as { parseExpirationTime: (time: string) => number }
      ).parseExpirationTime('30m');
      expect(result).toBe(1800); // 30 * 60
    });

    it('should parse hours correctly', () => {
      const result = (
        service as unknown as { parseExpirationTime: (time: string) => number }
      ).parseExpirationTime('2h');
      expect(result).toBe(7200); // 2 * 60 * 60
    });

    it('should parse days correctly', () => {
      const result = (
        service as unknown as { parseExpirationTime: (time: string) => number }
      ).parseExpirationTime('1d');
      expect(result).toBe(86400); // 1 * 60 * 60 * 24
    });

    it('should return default for invalid format', () => {
      const result = (
        service as unknown as { parseExpirationTime: (time: string) => number }
      ).parseExpirationTime('invalid');
      expect(result).toBe(1800); // Default 30 minutes
    });
  });
});
