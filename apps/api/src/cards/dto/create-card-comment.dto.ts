import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCardCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
