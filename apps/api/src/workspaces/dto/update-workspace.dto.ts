import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  name?: string;
}
