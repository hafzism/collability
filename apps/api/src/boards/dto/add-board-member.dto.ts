import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BoardRole } from '../../common/enums/board-role.enum';

export class AddBoardMemberDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(BoardRole)
  role!: BoardRole;
}
