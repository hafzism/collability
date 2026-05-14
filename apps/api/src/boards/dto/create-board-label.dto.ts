import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';

export class CreateBoardLabelDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsHexColor()
  color!: string;
}
