import { IsNotEmpty, IsString } from 'class-validator';

export class CreateListDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  // BigInt position sent as string from client (e.g. "65536")
  @IsString()
  @IsNotEmpty()
  position!: string;
}
