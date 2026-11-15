
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from './guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from './decorators/current-user/current-user.decorator';
import type { ClerkUser } from './decorators/current-user/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Authenticated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getCurrentUser(@CurrentUser() user: ClerkUser) {
    return {
      message: 'Authenticated successfully',
      user,
    };
  }
}
