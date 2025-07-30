interface IAuthenticatedUser {
    id: string;
    email: string;
    username: string;
    role: string;
    tenantId: string;
}
export declare const CURRENT_USER: (...dataOrPipes: (keyof IAuthenticatedUser | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
export {};
