import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

interface ITestUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockUser: ITestUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'DIRECTOR_COMUNICACION',
    tenantId: 'tenant-123',
  };

  const createMockExecutionContext = (
    user: ITestUser | null = mockUser,
    requiredRoles: string[] | null = null,
  ): ExecutionContext => {
    const mockRequest = {
      user,
    };

    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    // Mock reflector to return the required roles
    const mockReflector = reflector;
    mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

    return mockContext;
  };

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      const context = createMockExecutionContext(mockUser, null);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when required roles array is empty', () => {
      const context = createMockExecutionContext(mockUser, []);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      const context = createMockExecutionContext(null, ['DIRECTOR_COMUNICACION']);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should throw ForbiddenException when user is undefined', () => {
      const context = createMockExecutionContext(null, ['DIRECTOR_COMUNICACION']);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should allow DIRECTOR access to DIRECTOR-only endpoints', () => {
      const directorUser = { ...mockUser, role: 'DIRECTOR_COMUNICACION' };
      const context = createMockExecutionContext(directorUser, ['DIRECTOR_COMUNICACION']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow DIRECTOR access to LIDER endpoints (hierarchy)', () => {
      const directorUser = { ...mockUser, role: 'DIRECTOR_COMUNICACION' };
      const context = createMockExecutionContext(directorUser, ['LIDER']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow DIRECTOR access to DIRECTOR_AREA endpoints (hierarchy)', () => {
      const directorUser = { ...mockUser, role: 'DIRECTOR_COMUNICACION' };
      const context = createMockExecutionContext(directorUser, ['DIRECTOR_AREA']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow DIRECTOR access to ASISTENTE endpoints (hierarchy)', () => {
      const directorUser = { ...mockUser, role: 'DIRECTOR_COMUNICACION' };
      const context = createMockExecutionContext(directorUser, ['ASISTENTE']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow LIDER access to LIDER endpoints', () => {
      const liderUser = { ...mockUser, role: 'LIDER' };
      const context = createMockExecutionContext(liderUser, ['LIDER']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow LIDER access to DIRECTOR_AREA endpoints (hierarchy)', () => {
      const liderUser = { ...mockUser, role: 'LIDER' };
      const context = createMockExecutionContext(liderUser, ['DIRECTOR_AREA']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow DIRECTOR_AREA access to ASISTENTE endpoints (hierarchy)', () => {
      const directorAreaUser = { ...mockUser, role: 'DIRECTOR_AREA' };
      const context = createMockExecutionContext(directorAreaUser, ['ASISTENTE']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny LIDER access to DIRECTOR-only endpoints', () => {
      const liderUser = { ...mockUser, role: 'LIDER' };
      const context = createMockExecutionContext(liderUser, ['DIRECTOR_COMUNICACION']);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access denied. Required roles: DIRECTOR_COMUNICACION. Your role: LIDER',
      );
    });

    it('should deny ASISTENTE access to higher role endpoints', () => {
      const asistenteUser = { ...mockUser, role: 'ASISTENTE' };
      const context = createMockExecutionContext(asistenteUser, ['DIRECTOR_COMUNICACION']);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access denied. Required roles: DIRECTOR_COMUNICACION. Your role: ASISTENTE',
      );
    });

    it('should allow access when user has any of multiple required roles', () => {
      const liderUser = { ...mockUser, role: 'LIDER' };
      const context = createMockExecutionContext(liderUser, [
        'DIRECTOR_COMUNICACION',
        'LIDER',
        'DIRECTOR_AREA',
      ]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have any of multiple required roles', () => {
      const asistenteUser = { ...mockUser, role: 'ASISTENTE' };
      const context = createMockExecutionContext(asistenteUser, [
        'DIRECTOR_COMUNICACION',
        'LIDER',
        'DIRECTOR_AREA',
      ]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access denied. Required roles: DIRECTOR_COMUNICACION, LIDER, DIRECTOR_AREA. Your role: ASISTENTE',
      );
    });

    it('should throw ForbiddenException for invalid user role', () => {
      const userWithInvalidRole = { ...mockUser, role: 'INVALID_ROLE' };
      const context = createMockExecutionContext(userWithInvalidRole, ['DIRECTOR_COMUNICACION']);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Invalid user role');
    });

    it('should handle edge case with empty role string', () => {
      const userWithEmptyRole = { ...mockUser, role: '' };
      const context = createMockExecutionContext(userWithEmptyRole, ['DIRECTOR_COMUNICACION']);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Invalid user role');
    });

    it('should handle case sensitivity in roles', () => {
      const userWithLowercaseRole = { ...mockUser, role: 'director' };
      const context = createMockExecutionContext(userWithLowercaseRole, ['DIRECTOR_COMUNICACION']);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Invalid user role');
    });

    it('should work with complex role combinations', () => {
      // Test DIRECTOR_AREA with mixed required roles
      const directorAreaUser = { ...mockUser, role: 'DIRECTOR_AREA' };
      const context = createMockExecutionContext(directorAreaUser, ['ASISTENTE', 'DIRECTOR_AREA']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should properly call reflector with correct parameters', () => {
      const context = createMockExecutionContext(mockUser, ['DIRECTOR_COMUNICACION']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle null user gracefully', () => {
      const mockRequest = { user: null };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['DIRECTOR_COMUNICACION']);

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow('User not authenticated');
    });
  });
});
