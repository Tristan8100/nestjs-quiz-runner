import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateQuizChoiceDto {
  @IsOptional()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  choice: string;

  @IsBoolean()
  correct: boolean;
}

export class CreateQuizQuestionDto {
  @IsOptional()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizChoiceDto)
  choices: CreateQuizChoiceDto[];
}

export class CreateQuizConfigDto {
  @IsOptional()
  @Type(() => Number)
  @Min(15)
  timeLimit?: number = 30;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  difficulty?: string = 'medium';

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean = false;

  @IsOptional()
  @IsBoolean()
  shuffleChoices?: boolean = false;
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: 'draft' | 'published' = 'draft';

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuizConfigDto)
  config?: CreateQuizConfigDto = {
    timeLimit: 30,
    difficulty: 'medium',
    shuffleQuestions: false,
    shuffleChoices: false,
  };

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions: CreateQuizQuestionDto[];
}
