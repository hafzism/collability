import { IsEnum } from 'class-validator';
import { WorkspaceRole } from '../../common/enums/workspace-role.enum';

export class UpdateWorkspaceMemberRoleDto {
  @IsEnum(WorkspaceRole)
  role!: Exclude<WorkspaceRole, WorkspaceRole.OWNER>;
}
