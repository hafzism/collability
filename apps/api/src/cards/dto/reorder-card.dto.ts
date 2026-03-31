import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class ReorderCardDto {
  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.afterId)
  beforeId?: string;

  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.beforeId)
  afterId?: string;
}
