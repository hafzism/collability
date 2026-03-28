import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

enum BoardVisibility {
  WORKSPACE = 'WORKSPACE',
  PRIVATE = 'PRIVATE'
}

export class CreateBoardDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BoardVisibility)
  @IsOptional()
  visibility?: 'WORKSPACE' | 'PRIVATE';
}
