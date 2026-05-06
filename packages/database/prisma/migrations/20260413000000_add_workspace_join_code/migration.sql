ALTER TABLE "Workspace"
ADD COLUMN "joinCode" TEXT;

UPDATE "Workspace"
SET "joinCode" = CONCAT(
  LOWER(SUBSTRING(MD5(id || '-a') FROM 1 FOR 3)),
  '-',
  LOWER(SUBSTRING(MD5(id || '-b') FROM 1 FOR 3)),
  '-',
  LOWER(SUBSTRING(MD5(id || '-c') FROM 1 FOR 3))
)
WHERE "joinCode" IS NULL;

ALTER TABLE "Workspace"
ALTER COLUMN "joinCode" SET NOT NULL;

CREATE UNIQUE INDEX "Workspace_joinCode_key" ON "Workspace"("joinCode");
