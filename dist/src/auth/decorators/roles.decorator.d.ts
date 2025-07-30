import { SetMetadata } from '@nestjs/common';
export declare const ROLES_KEY = "roles";
export declare const ROLES: (...roles: string[]) => ReturnType<typeof SetMetadata>;
