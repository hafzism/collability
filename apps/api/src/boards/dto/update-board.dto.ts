import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

enum BoardVisibility {
  WORKSPACE = 'WORKSPACE',
  PRIVATE = 'PRIVATE'
}

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BoardVisibility)
  @IsOptional()
  visibility?: 'WORKSPACE' | 'PRIVATE';

  @IsBoolean()
  @IsOptional()
  archived?: boolean;
}
