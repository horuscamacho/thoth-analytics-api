import { AuthService, ITokenPair } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        message: string;
        data: ITokenPair;
        user: {
            id: string;
            email: string;
            username: string;
            role: string;
            tenantId: string;
        };
    }>;
    refresh(refreshTokenDto: RefreshTokenDto): Promise<{
        message: string;
        data: ITokenPair;
    }>;
    logout(): {
        message: string;
    };
    getProfile(user: unknown): {
        message: string;
        data: unknown;
    };
    adminOnly(): {
        message: string;
    };
    managementOnly(): {
        message: string;
    };
}
