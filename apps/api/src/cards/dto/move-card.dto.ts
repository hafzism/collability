import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class MoveCardDto {
  @IsString()
  @IsNotEmpty()
  targetListId!: string;

  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.afterId)
  beforeId?: string;

  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.beforeId)
  afterId?: string;
}
