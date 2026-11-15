import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuizDocument = HydratedDocument<Quiz>;

@Schema({ _id: true, timestamps: true })
export class Choice {
  _id?: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 500 })
  choice!: string;

  @Prop({ type: Boolean, required: true, default: false })
  correct!: boolean;
}

@Schema({ _id: true, timestamps: false })
export class Question {
  _id?: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 1000 })
  question!: string;

  @Prop({
    type: [Choice],
    required: true,
    validate: {
      validator: (choices: Choice[]) => Array.isArray(choices) && choices.length >= 2,
      message: 'Each question must have at least two choices',
    },
  })
  choices!: Choice[];
}

@Schema({ collection: 'quizzes', timestamps: true })
export class Quiz {
  @Prop({ type: String, required: true, index: true, trim: true })
  userId!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ type: String, trim: true, maxlength: 5000 })
  description?: string;

  @Prop({
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    required: true,
  })
  status!: 'draft' | 'published';

  @Prop({
    type: {
      timeLimit: { type: Number, default: 30, min: 15, max: 3600 },
      difficulty: { type: String, default: 'medium', maxlength: 50 },
      shuffleQuestions: { type: Boolean, default: false },
      shuffleChoices: { type: Boolean, default: false },
    },
    required: true,
    default: () => ({
      timeLimit: 30,
      difficulty: 'medium',
      shuffleQuestions: false,
      shuffleChoices: false,
    }),
  })
  config!: {
    timeLimit: number;
    difficulty: string;
    shuffleQuestions: boolean;
    shuffleChoices: boolean;
  };

  @Prop({
    type: [Question],
    required: true,
    validate: {
      validator: (questions: Question[]) => Array.isArray(questions) && questions.length > 0,
      message: 'Quiz must contain at least one question',
    },
  })
  questions!: Question[];
}

export const ChoiceSchema = SchemaFactory.createForClass(Choice);
export const QuestionSchema = SchemaFactory.createForClass(Question);
export const QuizSchema = SchemaFactory.createForClass(Quiz);

QuizSchema.index({ userId: 1, createdAt: -1 });
