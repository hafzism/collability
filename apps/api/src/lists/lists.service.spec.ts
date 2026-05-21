import { ListsService } from './lists.service';

describe('ListsService', () => {
  let service: ListsService;

  const prismaService = {
    list: {
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
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
    boardsService.logBoardActivity.mockResolvedValue(undefined);
    service = new ListsService(prismaService as any, boardsService as any);
  });

  it('deletes lists instead of archiving them', async () => {
    prismaService.list.findFirst.mockResolvedValue({
      id: 'list-1',
      boardId: 'board-1',
      title: 'Doing',
      board: {
        workspaceId: 'workspace-1',
      },
    });
    prismaService.list.delete.mockResolvedValue({
      id: 'list-1',
      boardId: 'board-1',
      title: 'Doing',
    });

    await expect(
      service.deleteList('board-1', 'list-1', 'user-1'),
    ).resolves.toEqual({
      id: 'list-1',
      boardId: 'board-1',
      title: 'Doing',
    });

    expect(prismaService.list.delete).toHaveBeenCalledWith({
      where: { id: 'list-1' },
    });
    expect(boardsService.logBoardActivity).toHaveBeenCalledWith(
      prismaService,
      {
        workspaceId: 'workspace-1',
        userId: 'user-1',
        boardId: 'board-1',
        action: 'list.deleted',
        metadata: {
          listId: 'list-1',
          listTitle: 'Doing',
        },
      },
    );
  });
});
