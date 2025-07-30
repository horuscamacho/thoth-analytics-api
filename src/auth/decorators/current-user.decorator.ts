import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface IAuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: string;
  tenantId: string;
}

interface IRequestWithUser extends Request {
  user?: IAuthenticatedUser;
}

export const CURRENT_USER = createParamDecorator(
  (data: keyof IAuthenticatedUser | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<IRequestWithUser>();
    const user = request.user;

    if (!user) {
      return null;
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);
