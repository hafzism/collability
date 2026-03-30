import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // BigInt position sent as string from client (e.g. "65536")
  @IsString()
  @IsOptional()
  position?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  listId?: string;

  @IsBoolean()
  @IsOptional()
  archived?: boolean;
}
