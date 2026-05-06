import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { WorkspacesController } from './workspaces.controller';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceGuard, RolesGuard],
  exports: [WorkspacesService, WorkspaceGuard, RolesGuard],
})
export class WorkspacesModule {}
