import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateListDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsNumber()
  position!: number;
}
