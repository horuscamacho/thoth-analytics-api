import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService, ITokenPair } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PUBLIC } from './decorators/public.decorator';
import { CURRENT_USER } from './decorators/current-user.decorator';
import { JwtGuard } from './guards/jwt/jwt.guard';
import { ROLES } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @PUBLIC()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<{
    message: string;
    data: ITokenPair;
    user: {
      id: string;
      email: string;
      username: string;
      role: string;
      tenantId: string;
    };
  }> {
    const tokens = await this.authService.login(
      loginDto.email,
      loginDto.password,
      loginDto.tenantId,
    );

    // Get user info without password for response
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
      loginDto.tenantId,
    );

    return {
      message: 'Login successful',
      data: tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  @PUBLIC()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<{
    message: string;
    data: ITokenPair;
  }> {
    const tokens = await this.authService.refreshTokens(refreshTokenDto.refreshToken);

    return {
      message: 'Token refreshed successfully',
      data: tokens,
    };
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(): {
    message: string;
  } {
    // TODO: Implement token blacklisting in Redis if needed
    // For now, since tokens are stateless, logout is handled client-side

    return {
      message: 'Logout successful',
    };
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  getProfile(@CURRENT_USER() user: unknown): {
    message: string;
    data: unknown;
  } {
    return {
      message: 'Profile retrieved successfully',
      data: user,
    };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @ROLES('DIRECTOR_COMUNICACION')
  @Get('admin-only')
  adminOnly(): { message: string } {
    return {
      message: 'This endpoint is only accessible by Directors',
    };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @ROLES('DIRECTOR_COMUNICACION', 'LIDER', 'DIRECTOR_AREA')
  @Get('management-only')
  managementOnly(): { message: string } {
    return {
      message: 'This endpoint is accessible by Directors and Leaders',
    };
  }
}
