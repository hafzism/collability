import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateListDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsBoolean()
  @IsOptional()
  archived?: boolean;
}
