import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateListDto {
  @IsString()
  @IsOptional()
  title?: string;

  // BigInt position sent as string from client (e.g. "65536")
  @IsString()
  @IsOptional()
  position?: string;

  @IsBoolean()
  @IsOptional()
  archived?: boolean;
}
