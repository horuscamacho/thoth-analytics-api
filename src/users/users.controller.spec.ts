import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

interface ICurrentUser {
  id: string;
  email: string;
  username: string;
  role: string;
  tenantId: string;
}

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockCurrentUser: ICurrentUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    username: 'admin',
    role: 'DIRECTOR_COMUNICACION',
    tenantId: 'tenant-123',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'ASISTENTE',
    tenantId: 'tenant-123',
    status: 'ACTIVE',
    createdAt: new Date(),
    lastLoginAt: null,
    suspendedAt: null,
    suspendedBy: null,
    suspensionReason: null,
    temporaryPassword: 'TempPass123!',
  };

  const mockUsersService = {
    createUser: jest.fn(),
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    suspendUser: jest.fn(),
    reactivateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      role: 'ASISTENTE',
    };

    it('should create user successfully', async () => {
      usersService.createUser.mockResolvedValue(mockUser);

      const result = await controller.createUser(createUserDto, mockCurrentUser);

      expect(result.message).toBe('User created successfully');
      expect(result.data).toHaveProperty('temporaryPassword');
      expect(result.data.email).toBe(mockUser.email);
      expect(usersService.createUser).toHaveBeenCalledWith(createUserDto, 'tenant-123');
    });
  });

  describe('getUsers', () => {
    it('should return users list', async () => {
      const mockUsers = [mockUser];
      usersService.getUsers.mockResolvedValue(mockUsers);

      const result = await controller.getUsers(mockCurrentUser);

      expect(result.message).toBe('Users retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(usersService.getUsers).toHaveBeenCalledWith('tenant-123', {});
    });

    it('should return users with filters', async () => {
      const mockUsers = [mockUser];
      usersService.getUsers.mockResolvedValue(mockUsers);

      await controller.getUsers(mockCurrentUser, 'ACTIVE', 'ASISTENTE');

      expect(usersService.getUsers).toHaveBeenCalledWith('tenant-123', {
        status: 'ACTIVE',
        role: 'ASISTENTE',
      });
    });
  });

  describe('getUserById', () => {
    it('should return single user', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById('user-123', mockCurrentUser);

      expect(result.message).toBe('User retrieved successfully');
      expect(result.data.id).toBe('user-123');
      expect(usersService.getUserById).toHaveBeenCalledWith('user-123', 'tenant-123');
    });
  });

  describe('suspendUser', () => {
    const updateStatusDto: UpdateUserStatusDto = {
      reason: 'Policy violation',
    };

    it('should suspend user successfully', async () => {
      const suspendedUser = {
        ...mockUser,
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendedBy: 'admin-123',
        suspensionReason: 'Policy violation',
      };

      usersService.suspendUser.mockResolvedValue(suspendedUser);

      const result = await controller.suspendUser('user-123', updateStatusDto, mockCurrentUser);

      expect(result.message).toBe('User suspended successfully');
      expect(result.data.status).toBe('SUSPENDED');
      expect(result.data.reason).toBe('Policy violation');
      expect(usersService.suspendUser).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        'admin-123',
        'Policy violation',
      );
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      const reactivatedUser = {
        ...mockUser,
        status: 'ACTIVE',
      };

      usersService.reactivateUser.mockResolvedValue(reactivatedUser);

      const result = await controller.reactivateUser('user-123', mockCurrentUser);

      expect(result.message).toBe('User reactivated successfully');
      expect(result.data.status).toBe('ACTIVE');
      expect(usersService.reactivateUser).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        'admin-123',
      );
    });
  });

  describe('deleteUser', () => {
    const confirmationDto = {
      confirmation: 'DELETE_PERMANENTLY',
      reason: 'Account closure requested',
    };

    it('should delete user successfully', async () => {
      usersService.deleteUser.mockResolvedValue({ id: 'user-123' });

      const result = await controller.deleteUser('user-123', confirmationDto, mockCurrentUser);

      expect(result.message).toBe('User deleted permanently');
      expect(result.data.id).toBe('user-123');
      expect(result.data.reason).toBe('Account closure requested');
      expect(usersService.deleteUser).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        'admin-123',
        'Account closure requested',
      );
    });

    it('should throw error for invalid confirmation', async () => {
      const invalidConfirmation = {
        confirmation: 'INVALID',
        reason: 'Test',
      };

      await expect(
        controller.deleteUser('user-123', invalidConfirmation, mockCurrentUser),
      ).rejects.toThrow('Invalid confirmation. Must send "DELETE_PERMANENTLY"');
    });
  });
});