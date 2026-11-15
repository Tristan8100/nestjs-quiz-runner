import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user/current-user.decorator';
import type { ClerkUser } from '../auth/decorators/current-user/current-user.decorator';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizzesService } from './quizzes.service';

@ApiTags('quizzes')
@ApiBearerAuth()
@Controller('quizzes')
@UseGuards(ClerkAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a quiz for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Quiz created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateQuizDto, @CurrentUser() user: ClerkUser) {
    return this.quizzesService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List authenticated user quizzes' })
  @ApiResponse({ status: 200, description: 'Quiz list returned' })
  findAll(@CurrentUser() user: ClerkUser, @Query() query: QueryQuizDto) {
    return this.quizzesService.findAllByUser(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quiz by id for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Quiz returned' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: ClerkUser) {
    return this.quizzesService.findOneByUser(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quiz for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Quiz updated' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
    @CurrentUser() user: ClerkUser,
  ) {
    return this.quizzesService.updateByUser(user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quiz for the authenticated user' })
  @ApiResponse({ status: 204, description: 'Quiz deleted' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: ClerkUser) {
    await this.quizzesService.removeByUser(user.sub, id);
    return;
  }
}
