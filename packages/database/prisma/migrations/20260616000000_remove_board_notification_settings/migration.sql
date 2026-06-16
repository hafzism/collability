-- DropForeignKey
ALTER TABLE "BoardNotificationSetting" DROP CONSTRAINT IF EXISTS "BoardNotificationSetting_boardId_fkey";

-- DropForeignKey
ALTER TABLE "BoardNotificationSetting" DROP CONSTRAINT IF EXISTS "BoardNotificationSetting_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "BoardNotificationSetting";
