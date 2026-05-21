import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labelIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assigneeIds?: string[];
}
