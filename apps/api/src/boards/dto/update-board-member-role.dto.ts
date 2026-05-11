import { IsEnum } from 'class-validator';
import { BoardRole } from '../../common/enums/board-role.enum';

export class UpdateBoardMemberRoleDto {
  @IsEnum(BoardRole)
  role!: BoardRole;
}
