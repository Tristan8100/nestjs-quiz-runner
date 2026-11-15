import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Quiz, QuizDocument } from './schemas/quiz.schema';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
  ) {}

  async create(dto: CreateQuizDto, userId: string): Promise<QuizDocument> {
    const cleanPayload = this.normalizeQuizPayload(dto, userId);

    const quiz = await this.quizModel.create(cleanPayload);
    return quiz;
  }

  async findAllByUser(
    userId: string,
    query: QueryQuizDto,
  ): Promise<{ data: QuizDocument[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const skip = (page - 1) * limit;

    const filters: Record<string, unknown> = { userId };
    if (query.status) {
      filters.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.quizModel
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.quizModel.countDocuments(filters).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findOneByUser(userId: string, id: string): Promise<QuizDocument> {
    this.ensureObjectId(id);

    const quiz = await this.quizModel.findOne({ _id: id, userId }).exec();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async updateByUser(
    userId: string,
    id: string,
    dto: UpdateQuizDto,
  ): Promise<QuizDocument> {
    const quiz = await this.findOneByUser(userId, id);
    const updates = this.normalizeUpdatePayload(dto);

    Object.assign(quiz, updates);
    await quiz.save();
    return quiz;
  }

  async removeByUser(userId: string, id: string): Promise<void> {
    this.ensureObjectId(id);

    const result = await this.quizModel.deleteOne({ _id: id, userId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Quiz not found');
    }
  }

  private normalizeQuizPayload(dto: CreateQuizDto, userId: string): Partial<Quiz> {
    const payload: Partial<Quiz> & Record<string, unknown> = {
      userId,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      status: dto.status ?? 'draft',
      config: {
        timeLimit: dto.config?.timeLimit ?? 30,
        difficulty: dto.config?.difficulty ?? 'medium',
        shuffleQuestions: dto.config?.shuffleQuestions ?? false,
        shuffleChoices: dto.config?.shuffleChoices ?? false,
      },
      questions: this.normalizeQuestions(dto.questions),
    };

    if (!payload.title) {
      throw new BadRequestException('Quiz title is required');
    }

    if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
      throw new BadRequestException('Quiz must contain at least one question');
    }

    return payload as Partial<Quiz>;
  }

  private normalizeUpdatePayload(dto: UpdateQuizDto): Partial<Quiz> {
    const payload: Partial<Quiz> & Record<string, unknown> = {};

    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (!title) {
        throw new BadRequestException('Quiz title cannot be empty');
      }
      payload.title = title;
    }

    if (dto.description !== undefined) {
      payload.description = dto.description.trim();
    }

    if (dto.status !== undefined) {
      payload.status = dto.status;
    }

    if (dto.config !== undefined) {
      payload.config = {
        timeLimit: dto.config.timeLimit ?? 30,
        difficulty: dto.config.difficulty ?? 'medium',
        shuffleQuestions: dto.config.shuffleQuestions ?? false,
        shuffleChoices: dto.config.shuffleChoices ?? false,
      };
    }

    if (dto.questions !== undefined) {
      payload.questions = this.normalizeQuestions(dto.questions);
    }

    return payload as Partial<Quiz>;
  }

  private normalizeQuestions(
    questions: Array<Record<string, unknown> | { question?: string; choices?: Array<Record<string, unknown> | { choice?: string; correct?: boolean }> }>,
  ): Array<{ _id?: Types.ObjectId; question: string; choices: Array<{ _id?: Types.ObjectId; choice: string; correct: boolean }> }> {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestException('Questions are required');
    }

    return questions.map((question) => {
      const questionRecord = question as Record<string, unknown>;
      const questionText = String(questionRecord?.question ?? '').trim();
      if (!questionText) {
        throw new BadRequestException('Each question requires text');
      }

      const choices = Array.isArray(questionRecord?.choices) ? questionRecord.choices : [];
      if (choices.length < 2) {
        throw new BadRequestException('Each question must have at least two choices');
      }

      const correctChoices = choices.filter((choice) => Boolean((choice as Record<string, unknown>)?.correct));
      if (correctChoices.length !== 1) {
        throw new BadRequestException('Each question must have exactly one correct choice');
      }

      return {
        _id: this.toObjectId(questionRecord?._id),
        question: questionText,
        choices: choices.map((choice) => {
          const choiceRecord = choice as Record<string, unknown>;
          return {
            _id: this.toObjectId(choiceRecord?._id),
            choice: String(choiceRecord?.choice ?? '').trim(),
            correct: Boolean(choiceRecord?.correct),
          };
        }),
      };
    });
  }

  private toObjectId(value: unknown): Types.ObjectId {
    if (!value) {
      return new Types.ObjectId();
    }

    const objectIdValue = String(value);
    if (!Types.ObjectId.isValid(objectIdValue)) {
      throw new BadRequestException('Invalid MongoDB ObjectId');
    }

    return new Types.ObjectId(objectIdValue);
  }

  private ensureObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid quiz id');
    }
  }
}
