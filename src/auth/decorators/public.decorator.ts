import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const PUBLIC = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC_KEY, true);
