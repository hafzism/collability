import { Global, Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Global()
@Module({
  providers: [WorkspacesService, WorkspaceGuard, RolesGuard],
  exports: [WorkspacesService, WorkspaceGuard, RolesGuard],
})
export class WorkspacesModule {}
