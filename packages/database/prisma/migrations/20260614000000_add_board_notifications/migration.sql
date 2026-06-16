-- CreateEnum
CREATE TYPE "BoardNotificationType" AS ENUM (
  'CARD_ASSIGNED',
  'CARD_UNASSIGNED',
  'CARD_COMMENTED',
  'CARD_DUE_REMINDER',
  'BOARD_MEMBER_ADDED',
  'BOARD_ROLE_CHANGED'
);

-- CreateEnum
CREATE TYPE "DueDateReminderStatus" AS ENUM (
  'PENDING',
  'SENT',
  'CANCELED'
);

-- CreateTable
CREATE TABLE "BoardNotification" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "type" "BoardNotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "metadata" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BoardNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardNotificationSetting" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
  "dueReminderMinutes" INTEGER[] DEFAULT ARRAY[1440]::INTEGER[],
  "mutedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BoardNotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DueDateReminder" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "notificationId" TEXT,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "remindAt" TIMESTAMP(3) NOT NULL,
  "status" "DueDateReminderStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),

  CONSTRAINT "DueDateReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardNotification_boardId_userId_createdAt_idx" ON "BoardNotification"("boardId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardNotification_userId_readAt_createdAt_idx" ON "BoardNotification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BoardNotificationSetting_boardId_userId_key" ON "BoardNotificationSetting"("boardId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DueDateReminder_cardId_userId_remindAt_key" ON "DueDateReminder"("cardId", "userId", "remindAt");

-- CreateIndex
CREATE INDEX "DueDateReminder_status_remindAt_idx" ON "DueDateReminder"("status", "remindAt");

-- CreateIndex
CREATE INDEX "DueDateReminder_boardId_userId_idx" ON "DueDateReminder"("boardId", "userId");

-- AddForeignKey
ALTER TABLE "BoardNotification" ADD CONSTRAINT "BoardNotification_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardNotification" ADD CONSTRAINT "BoardNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardNotification" ADD CONSTRAINT "BoardNotification_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardNotificationSetting" ADD CONSTRAINT "BoardNotificationSetting_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardNotificationSetting" ADD CONSTRAINT "BoardNotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDateReminder" ADD CONSTRAINT "DueDateReminder_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDateReminder" ADD CONSTRAINT "DueDateReminder_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDateReminder" ADD CONSTRAINT "DueDateReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDateReminder" ADD CONSTRAINT "DueDateReminder_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "BoardNotification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
