
import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export interface ClerkUser {
  sub: string;
  sid?: string;
  [key: string]: unknown;
}

export const CurrentUser = createParamDecorator(
  (data: keyof ClerkUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & {
      auth?: ClerkUser;
    }>();

    const user = request.auth;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return data ? user[data] : user;
  },
);
