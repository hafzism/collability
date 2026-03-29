import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { WorkspaceRole } from '../../common/enums/workspace-role.enum';

export class AddWorkspaceMemberDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}
