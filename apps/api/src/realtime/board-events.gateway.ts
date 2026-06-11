import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { BoardsService } from '../boards/boards.service';
import { BoardRole } from '../common/enums/board-role.enum';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { BoardPresenceService } from './board-presence.service';
import type { BoardPresenceSnapshot } from './board-presence.types';
import { BoardEventsService, getBoardRoomName } from './board-events.service';

export const BOARD_PRESENCE_EVENT_NAME = 'board:presence';

type AccessTokenPayload = {
  sub?: string;
  type?: string;
  sid?: string;
};

type BoardEventsSocketData = {
  auth?: {
    sessionId?: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

type BoardEventsSocket = Socket & {
  data: BoardEventsSocketData;
};

@Injectable()
@WebSocketGateway({
  cors: {
    credentials: true,
    origin: process.env.WEB_APP_URL,
  },
  namespace: 'board-events',
})
export class BoardEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly boardEventsService: BoardEventsService,
    private readonly boardPresenceService: BoardPresenceService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly boardsService: BoardsService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  afterInit(server: Server) {
    this.server = server;
    this.boardEventsService.bindServer(server);
  }

  async handleConnection(client: BoardEventsSocket) {
    try {
      const token = this.extractAccessToken(client);
      const payload = this.jwtService.verify<AccessTokenPayload>(token);

      if (!payload.sub || payload.type !== 'access') {
        throw new UnauthorizedException('Invalid access token');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      client.data.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
      client.data.auth = {
        sessionId: payload.sid,
      };
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: BoardEventsSocket) {
    const snapshots = this.boardPresenceService.disconnectSocket(client.id);

    for (const snapshot of snapshots) {
      this.broadcastPresenceSnapshot(snapshot);
    }
  }

  @SubscribeMessage('board:join')
  async handleJoinBoard(
    @ConnectedSocket() client: BoardEventsSocket,
    @MessageBody() body: { boardId?: string },
  ) {
    const user = client.data.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!body.boardId) {
      throw new ForbiddenException('Board ID is required');
    }

    const role = await this.resolveBoardRole(user.id, body.boardId);
    const room = getBoardRoomName(body.boardId);
    await client.join(room);
    const snapshot = this.boardPresenceService.enterBoard({
      boardId: body.boardId,
      socketId: client.id,
      user,
    });
    this.broadcastPresenceSnapshot(snapshot);

    return {
      boardId: body.boardId,
      room,
      role,
    };
  }

  @SubscribeMessage('board:leave')
  async handleLeaveBoard(
    @ConnectedSocket() client: BoardEventsSocket,
    @MessageBody() body: { boardId?: string },
  ) {
    if (!body.boardId) {
      return {
        left: false,
      };
    }

    await client.leave(getBoardRoomName(body.boardId));
    const snapshot = this.boardPresenceService.leaveBoard({
      boardId: body.boardId,
      socketId: client.id,
    });
    this.broadcastPresenceSnapshot(snapshot);

    return {
      boardId: body.boardId,
      left: true,
    };
  }

  @SubscribeMessage('board:presence:update')
  async handlePresenceUpdate(
    @ConnectedSocket() client: BoardEventsSocket,
    @MessageBody()
    body: {
      boardId?: string;
      viewingCardId?: string | null;
      editingCardId?: string | null;
      typingCardId?: string | null;
    },
  ) {
    const user = client.data.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!body.boardId) {
      throw new ForbiddenException('Board ID is required');
    }

    const snapshot = this.boardPresenceService.updatePresence({
      boardId: body.boardId,
      socketId: client.id,
      viewingCardId: body.viewingCardId,
      editingCardId: body.editingCardId,
      typingCardId: body.typingCardId,
    });
    this.broadcastPresenceSnapshot(snapshot);

    return snapshot;
  }

  private extractAccessToken(client: BoardEventsSocket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken;
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length);
    }

    throw new UnauthorizedException('Access token is required');
  }

  private broadcastPresenceSnapshot(snapshot: BoardPresenceSnapshot) {
    this.server
      .to(getBoardRoomName(snapshot.boardId))
      .emit(BOARD_PRESENCE_EVENT_NAME, snapshot);
  }

  private async resolveBoardRole(userId: string, boardId: string) {
    const board = await this.boardsService.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const workspaceRole = await this.workspacesService.getWorkspaceRole(
      userId,
      board.workspaceId,
    );

    if (!workspaceRole) {
      throw new ForbiddenException(
        'You must be a member of the workspace to access this board',
      );
    }

    const boardMembership = await this.boardsService.getBoardMembership(
      userId,
      boardId,
    );

    if (board.createdBy === userId) {
      return BoardRole.MANAGER;
    }

    if (boardMembership) {
      return boardMembership.role as BoardRole;
    }

    if (
      board.visibility === 'PRIVATE' &&
      workspaceRole !== WorkspaceRole.OWNER &&
      workspaceRole !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException('You do not have access to this private board');
    }

    return BoardRole.VIEWER;
  }
}
