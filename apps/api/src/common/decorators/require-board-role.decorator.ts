import { SetMetadata } from '@nestjs/common';
import { BoardRole } from '../enums/board-role.enum';

export const REQUIRE_BOARD_ROLE_KEY = 'requireBoardRole';
export const RequireBoardRole = (...roles: BoardRole[]) =>
  SetMetadata(REQUIRE_BOARD_ROLE_KEY, roles);
