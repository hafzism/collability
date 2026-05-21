import { CardsService } from './cards.service';

describe('CardsService', () => {
  let service: CardsService;

  const prismaService = {
    card: {
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const activityService = {
    log: jest.fn(),
  };

  const boardsService = {
    logBoardActivity: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaService) => Promise<unknown>) =>
        callback(prismaService as any),
    );
    activityService.log.mockResolvedValue(undefined);
    boardsService.logBoardActivity.mockResolvedValue(undefined);
    service = new CardsService(
      prismaService as any,
      activityService as any,
      boardsService as any,
    );
  });

  it('deletes cards instead of archiving them', async () => {
    prismaService.card.findFirst.mockResolvedValue({
      id: 'card-1',
      title: 'Ship billing page',
      list: {
        title: 'Doing',
        board: {
          workspaceId: 'workspace-1',
        },
      },
    });
    prismaService.card.delete.mockResolvedValue({
      id: 'card-1',
      title: 'Ship billing page',
    });

    await expect(
      service.deleteCard('board-1', 'list-1', 'card-1', 'user-1'),
    ).resolves.toEqual({
      id: 'card-1',
      title: 'Ship billing page',
    });

    expect(prismaService.card.delete).toHaveBeenCalledWith({
      where: { id: 'card-1' },
    });
    expect(boardsService.logBoardActivity).toHaveBeenCalledWith(
      prismaService,
      {
        workspaceId: 'workspace-1',
        userId: 'user-1',
        boardId: 'board-1',
        action: 'card.deleted',
        metadata: {
          cardId: 'card-1',
          cardTitle: 'Ship billing page',
          listId: 'list-1',
          listTitle: 'Doing',
        },
      },
    );
    expect(activityService.log).toHaveBeenCalledWith(
      prismaService,
      {
        workspaceId: 'workspace-1',
        userId: 'user-1',
        entityType: 'card',
        entityId: 'card-1',
        action: 'card.deleted',
        metadata: {
          cardTitle: 'Ship billing page',
        },
      },
    );
  });
});
