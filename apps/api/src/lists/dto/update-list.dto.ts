import { IsOptional, IsString } from 'class-validator';

export class UpdateListDto {
  @IsString()
  @IsOptional()
  title?: string;
}
