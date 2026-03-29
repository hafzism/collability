import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  // BigInt position sent as string from client (e.g. "65536")
  @IsString()
  @IsNotEmpty()
  position!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
