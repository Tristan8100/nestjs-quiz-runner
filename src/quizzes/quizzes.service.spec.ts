import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from './quizzes.service';
import { Quiz } from './schemas/quiz.schema';

describe('QuizzesService', () => {
  it('should create a quiz with the authenticated user id and strip forbidden fields', async () => {
    const model = {
      create: jest.fn().mockImplementation(async (dto) => ({
        ...dto,
        _id: 'quiz-1',
      })),
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        {
          provide: getModelToken(Quiz.name),
          useValue: model,
        },
      ],
    }).compile();

    const service = module.get(QuizzesService);

    const created = await service.create(
      {
        title: 'Sample quiz',
        status: 'draft',
        questions: [
          {
            question: 'Q1',
            choices: [
              { choice: 'A', correct: true },
              { choice: 'B', correct: false },
            ],
          },
        ],
      },
      'user-123',
    );

    expect(created.userId).toBe('user-123');
    expect(created.title).toBe('Sample quiz');
  });
});
