/*
  Warnings:

  - You are about to alter the column `position` on the `Card` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `position` on the `List` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "Card" ALTER COLUMN "position" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "List" ALTER COLUMN "position" SET DATA TYPE BIGINT;
