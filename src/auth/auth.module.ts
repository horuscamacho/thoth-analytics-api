import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { DatabaseModule } from '../database/database.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtGuard } from './guards/jwt/jwt.guard';
import { RolesGuard } from './guards/roles/roles.guard';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (typeof secret !== 'string' || secret.trim() === '') {
          throw new Error('JWT_SECRET is required');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'), // Access token: 30 min
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtGuard, RolesGuard],
  controllers: [AuthController],
  exports: [JwtModule, PassportModule, AuthService, JwtGuard, RolesGuard],
})
export class AuthModule {}
