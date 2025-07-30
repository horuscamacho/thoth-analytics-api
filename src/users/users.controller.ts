import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { ROLES } from '../auth/decorators/roles.decorator';
import { CURRENT_USER } from '../auth/decorators/current-user.decorator';

interface ICurrentUser {
  id: string;
  email: string;
  username: string;
  role: string;
  tenantId: string;
}

@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ROLES('DIRECTOR_COMUNICACION')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      email: string;
      username: string;
      role: string;
      tenantId: string;
      status: string;
      temporaryPassword?: string;
    };
  }> {
    const user = await this.usersService.createUser(createUserDto, currentUser.tenantId);

    return {
      message: 'User created successfully',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId || '',
        status: user.status,
        temporaryPassword: user.temporaryPassword,
      },
    };
  }

  @Get()
  @ROLES('SUPER_ADMIN', 'DIRECTOR_COMUNICACION', 'LIDER')
  async getUsers(
    @CURRENT_USER() currentUser: ICurrentUser,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ): Promise<{
    message: string;
    data: Array<{
      id: string;
      email: string;
      username: string;
      role: string;
      status: string;
      createdAt: string;
      lastLoginAt?: string;
    }>;
    total: number;
  }> {
    const filters: { status?: string; role?: string } = {};
    if (status) filters.status = status;
    if (role) filters.role = role;
    
    // SUPER_ADMIN can see all users from all tenants
    const tenantId = currentUser.role === 'SUPER_ADMIN' ? undefined : currentUser.tenantId;
    const users = await this.usersService.getUsers(tenantId, filters);

    return {
      message: 'Users retrieved successfully',
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        ...(user.lastLoginAt && { lastLoginAt: user.lastLoginAt.toISOString() }),
      })),
      total: users.length,
    };
  }

  @Get(':id')
  @ROLES('DIRECTOR_COMUNICACION', 'LIDER', 'DIRECTOR_AREA')
  async getUserById(
    @Param('id') id: string,
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      email: string;
      username: string;
      role: string;
      status: string;
      createdAt: string;
      lastLoginAt?: string;
      tenantId: string;
    };
  }> {
    const user = await this.usersService.getUserById(id, currentUser.tenantId);

    return {
      message: 'User retrieved successfully',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        tenantId: user.tenantId || '',
        ...(user.lastLoginAt && { lastLoginAt: user.lastLoginAt.toISOString() }),
      },
    };
  }

  @Put(':id/suspend')
  @ROLES('DIRECTOR_COMUNICACION')
  @HttpCode(HttpStatus.OK)
  async suspendUser(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      status: string;
      suspendedAt: string;
      suspendedBy: string;
      reason?: string;
    };
  }> {
    const result = await this.usersService.suspendUser(
      id,
      currentUser.tenantId,
      currentUser.id,
      updateStatusDto.reason,
    );

    return {
      message: 'User suspended successfully',
      data: {
        id: result.id,
        status: result.status,
        suspendedAt: result.suspendedAt!.toISOString(),
        suspendedBy: result.suspendedBy!,
        ...(result.suspensionReason && { reason: result.suspensionReason }),
      },
    };
  }

  @Put(':id/reactivate')
  @ROLES('DIRECTOR_COMUNICACION')
  @HttpCode(HttpStatus.OK)
  async reactivateUser(
    @Param('id') id: string,
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      status: string;
      reactivatedAt: string;
      reactivatedBy: string;
    };
  }> {
    const result = await this.usersService.reactivateUser(id, currentUser.tenantId, currentUser.id);

    return {
      message: 'User reactivated successfully',
      data: {
        id: result.id,
        status: result.status,
        reactivatedAt: new Date().toISOString(),
        reactivatedBy: currentUser.id,
      },
    };
  }

  @Delete(':id')
  @ROLES('DIRECTOR_COMUNICACION')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id') id: string,
    @Body() confirmationDto: { confirmation: string; reason: string },
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      deletedAt: string;
      deletedBy: string;
      reason: string;
    };
  }> {
    if (confirmationDto.confirmation !== 'DELETE_PERMANENTLY') {
      throw new Error('Invalid confirmation. Must send "DELETE_PERMANENTLY"');
    }

    const result = await this.usersService.deleteUser(
      id,
      currentUser.tenantId,
      currentUser.id,
      confirmationDto.reason,
    );

    return {
      message: 'User deleted permanently',
      data: {
        id: result.id,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser.id,
        reason: confirmationDto.reason,
      },
    };
  }
}
