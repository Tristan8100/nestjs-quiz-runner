
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  auth?: {
    sub: string;
    sid?: string;
    [key: string]: unknown;
  };
};

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;
    const [type, token] = authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Missing or invalid authorization token',
      );
    }

    const secretKey =
      this.configService.get<string>('CLERK_SECRET_KEY');

    if (!secretKey) {
      throw new InternalServerErrorException(
        'Clerk secret key is not configured',
      );
    }

    try {
      const payload = await verifyToken(token, { secretKey });

      if (!payload.sub) {
        throw new UnauthorizedException(
          'Invalid Clerk token payload',
        );
      }

      request.auth = payload;

      return true;
    } catch (error) {
      this.logger.error(
        'Clerk token verification failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw new UnauthorizedException(
        'Invalid or expired Clerk token',
      );
    }
  }
}
